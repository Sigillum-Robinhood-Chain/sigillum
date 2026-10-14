import { createServiceRoleClient } from "@/lib/supabase/server";
import { ADDRESSES, WAGE_INITIAL_SUPPLY } from "@/lib/web3/addresses";
import {
  LEDGER_EVENTS,
  PRICE_STALE_MS,
  RANGE_MS,
  buildBuckets,
  dailyBurns,
  toWage,
  windowStart,
  workRatio,
  type LedgerRow,
  type PriceRange,
  type PriceSeries,
  type PriceSource,
  type Summary,
  type TopBuilding,
  type Win,
} from "@/lib/weighhouse/metrics";

/**
 * Pembacaan data Weighhouse dari tabel snapshot / event (brief §5). Halaman TIDAK memanggil RPC
 * chain di jalur request -- semua angka berasal dari tabel yang diisi cron `/api/cron/index-chain`.
 * Memakai service role di server saja; tabelnya sendiri juga publik-baca lewat RLS.
 */

type Db = ReturnType<typeof createServiceRoleClient>;

const PAGE = 1000;
const MAX_ROWS = 20_000;

/** PostgREST membatasi 1000 baris per permintaan; ambil per halaman sampai habis (dengan batas). */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0);

// ---- summary ---------------------------------------------------------------------------------

export async function getSummary(win: Win): Promise<Summary> {
  const db = createServiceRoleClient();
  const now = Date.now();
  const since = windowStart(win, now);
  const sinceIso = since ? since.toISOString() : null;
  const dayAgo = new Date(now - 24 * 3600_000).toISOString();

  const [totalsRes, supplyRes, priceNowRes, priceDayRes, burnRows, stakeRows] = await Promise.all([
    db.rpc("weighhouse_totals", { p_since: sinceIso }),
    db.from("supply_snapshots").select("*").order("taken_at", { ascending: false }).limit(1),
    db.from("price_snapshots").select("*").order("taken_at", { ascending: false }).limit(1),
    db
      .from("price_snapshots")
      .select("*")
      .lte("taken_at", dayAgo)
      .order("taken_at", { ascending: false })
      .limit(1),
    fetchAll<{ block_time: string; tx_hash: string; amount: number | null }>((from, to) =>
      db
        .from("chain_events")
        .select("block_time,tx_hash,amount")
        .eq("event", "Burned")
        .order("block_time", { ascending: true })
        .range(from, to),
    ),
    fetchAll<{ amount: number }>((from, to) =>
      db.from("stakes").select("amount").gt("amount", 0).range(from, to),
    ),
  ]);

  if (totalsRes.error) throw new Error(totalsRes.error.message);
  const byEvent = new Map((totalsRes.data ?? []).map((r) => [r.event, r]));
  const sum = (event: string) => toWage(byEvent.get(event)?.amount_sum);
  const count = (event: string) => num(byEvent.get(event)?.n);
  const field = (event: string, f: "patron_sum" | "lamp_sum" | "tithe_sum" | "burn_sum" | "refund_sum") =>
    toWage(byEvent.get(event)?.[f]);

  // Supply
  const snap = supplyRes.data?.[0] ?? null;
  const supply: Summary["supply"] = snap
    ? (() => {
        const input = {
          total: toWage(snap.total),
          burned: toWage(snap.burned),
          curve: snap.curve == null ? null : toWage(snap.curve),
          lp: toWage(snap.lp),
          locker: toWage(snap.locker),
          strongbox: toWage(snap.strongbox),
          splitter: toWage(snap.splitter),
          treasuries: toWage(snap.treasuries),
        };
        return {
          total: input.total,
          blockNumber: num(snap.block_number),
          updatedAt: snap.taken_at,
          buckets: buildBuckets(input, {
            burned: [{ label: "Reactor (dead address)", address: ADDRESSES.furnace }],
            lp: [{ label: "Uniswap v4 PoolManager", address: ADDRESSES.v4PoolManager }],
            locker: [{ label: "Pons locker", address: ADDRESSES.ponsLocker }],
            strongbox: [{ label: "Vault", address: ADDRESSES.strongbox }],
            splitter: [{ label: "Splitter", address: ADDRESSES.splitter }],
            treasuries: [
              { label: "Grid reserve", address: ADDRESSES.lampOilTreasury },
              { label: "Civic fund", address: ADDRESSES.titheTreasury },
            ],
          }),
        };
      })()
    : null;

  // Flow (C)
  const sealed = sum("SealSet") + sum("DisputeResolved");
  const flow: Summary["flow"] = {
    locked: sum("JobFunded"),
    sealed,
    patrons: field("JobSplit", "patron_sum"),
    lampOil: field("JobSplit", "lamp_sum"),
    tithe: field("JobSplit", "tithe_sum"),
    furnace: field("JobSplit", "burn_sum"),
    stillInEscrow: supply ? (supply.buckets.find((b) => b.key === "strongbox")?.amount ?? 0) : 0,
    refunded: sum("JobRefunded") + field("DisputeResolved", "refund_sum"),
    jobs: {
      posted: count("JobFunded"),
      sealed: count("SealSet"),
      refunded: count("JobRefunded"),
      disputed: count("SealBroken"),
    },
  };

  // Volume trading (denominator Work Ratio)
  let tradedWage = sum("Swap");
  let tradeVolumeSource: Summary["tiles"]["tradeVolumeSource"] = tradedWage > 0 ? "v4" : "none";
  if (tradedWage === 0) {
    const vols = await fetchAll<{ volume_wage: number | null }>((from, to) => {
      let q = db.from("price_snapshots").select("volume_wage");
      if (sinceIso) q = q.gte("taken_at", sinceIso);
      return q.range(from, to);
    });
    tradedWage = vols.reduce((a, r) => a + toWage(r.volume_wage), 0);
    if (tradedWage > 0) tradeVolumeSource = "snapshots";
  }
  const wr = workRatio(sealed, tradedWage);

  // Harga
  const pNow = priceNowRes.data?.[0] ?? null;
  const pDay = priceDayRes.data?.[0] ?? null;
  const priceUsd = pNow?.price_usd == null ? null : Number(pNow.price_usd);
  const priceThen = pDay?.price_usd == null ? null : Number(pDay.price_usd);
  const change24hPct =
    priceUsd != null && priceThen != null && priceThen > 0
      ? ((priceUsd - priceThen) / priceThen) * 100
      : null;
  const circulating = supply ? supply.total - (supply.buckets.find((b) => b.key === "burned")?.amount ?? 0) : null;

  // Furnace (D)
  const burns = burnRows.map((b) => ({ at: b.block_time, amount: toWage(b.amount), txHash: b.tx_hash }));
  const burnedAllTime = supply
    ? (supply.buckets.find((b) => b.key === "burned")?.amount ?? 0)
    : burns.reduce((a, b) => a + b.amount, 0);

  return {
    window: win,
    tiles: {
      priceUsd,
      change24hPct,
      priceSource: (pNow?.source as PriceSource | undefined) ?? null,
      priceUpdatedAt: pNow?.taken_at ?? null,
      priceStale: pNow ? now - new Date(pNow.taken_at).getTime() > PRICE_STALE_MS : false,
      marketCapUsd: priceUsd != null && circulating != null ? priceUsd * circulating : null,
      liquidityUsd: pNow?.liquidity_usd == null ? null : Number(pNow.liquidity_usd),
      workRatioPct: wr.pct,
      workRatioCapped: wr.capped,
      sealedWage: sealed,
      tradedWage,
      tradeVolumeSource,
    },
    supply,
    stakedByPatrons: stakeRows.reduce((a, r) => a + num(r.amount), 0),
    flow,
    furnace: {
      burnedAllTime,
      burnedInWindow: sum("Burned"),
      pctOfSupply: (burnedAllTime / WAGE_INITIAL_SUPPLY) * 100,
      daily: dailyBurns(burns, since ? since.getTime() : null),
      latest: burns
        .slice(-10)
        .reverse()
        .map((b) => ({ txHash: b.txHash, at: b.at, amount: b.amount })),
    },
    graduatedAt: process.env.NEXT_PUBLIC_WAGE_GRADUATED_AT?.trim() || null,
  };
}

// ---- harga (E) -------------------------------------------------------------------------------

export async function getPriceSeries(range: PriceRange): Promise<PriceSeries> {
  const db = createServiceRoleClient();
  const since = new Date(Date.now() - RANGE_MS[range]).toISOString();
  const rows = await fetchAll<{
    taken_at: string;
    price_usd: number | null;
    price_eth: number | null;
    source: string;
  }>((from, to) =>
    db
      .from("price_snapshots")
      .select("taken_at,price_usd,price_eth,source")
      .gte("taken_at", since)
      .order("taken_at", { ascending: true })
      .range(from, to),
  );
  // Maks ~300 titik supaya payload kecil.
  const step = Math.max(1, Math.ceil(rows.length / 300));
  const points = rows
    .filter((_, i) => i % step === 0 || i === rows.length - 1)
    .map((r) => ({
      t: r.taken_at,
      usd: r.price_usd == null ? null : Number(r.price_usd),
      eth: r.price_eth == null ? null : Number(r.price_eth),
    }));
  const last = rows[rows.length - 1];
  return { range, points, source: (last?.source as PriceSource | undefined) ?? null };
}

// ---- top buildings (F) -----------------------------------------------------------------------

export async function getTopBuildings(win: Win): Promise<TopBuilding[]> {
  const db = createServiceRoleClient();
  const since = windowStart(win);
  const events = await fetchAll<{ chain_job_id: string | null; amount: number | null }>((from, to) => {
    let q = db
      .from("chain_events")
      .select("chain_job_id,amount")
      .in("event", ["SealSet", "DisputeResolved"])
      .not("chain_job_id", "is", null);
    if (since) q = q.gte("block_time", since.toISOString());
    return q.range(from, to);
  });
  if (!events.length) return [];

  const chainIds = [...new Set(events.map((e) => e.chain_job_id as string))];
  const jobs: { chain_job_id: string | null; agent_id: string | null }[] = [];
  for (let i = 0; i < chainIds.length; i += 200) {
    const { data, error } = await db
      .from("jobs")
      .select("chain_job_id,agent_id")
      .in("chain_job_id", chainIds.slice(i, i + 200));
    if (error) throw new Error(error.message);
    jobs.push(...(data ?? []));
  }
  const agentOfJob = new Map(jobs.map((j) => [j.chain_job_id, j.agent_id]));

  const acc = new Map<string, { sealed: number; jobs: Set<string> }>();
  for (const e of events) {
    const agentId = agentOfJob.get(e.chain_job_id);
    if (!agentId) continue;
    const cur = acc.get(agentId) ?? { sealed: 0, jobs: new Set<string>() };
    cur.sealed += toWage(e.amount);
    cur.jobs.add(e.chain_job_id as string);
    acc.set(agentId, cur);
  }
  const top = [...acc.entries()].sort((a, b) => b[1].sealed - a[1].sealed).slice(0, 10);
  if (!top.length) return [];

  const ids = top.map(([id]) => id);
  const [agentsRes, stakesRes] = await Promise.all([
    db.from("agents").select("id,name,code,district,rating").in("id", ids),
    db.from("stakes").select("agent_id,amount").in("agent_id", ids).gt("amount", 0),
  ]);
  if (agentsRes.error) throw new Error(agentsRes.error.message);
  const agents = new Map((agentsRes.data ?? []).map((a) => [a.id, a]));
  const staked = new Map<string, number>();
  for (const s of stakesRes.data ?? []) staked.set(s.agent_id, (staked.get(s.agent_id) ?? 0) + num(s.amount));

  return top.flatMap(([id, v]) => {
    const a = agents.get(id);
    if (!a) return [];
    return [
      {
        agentId: id,
        name: a.name,
        sigil: a.code,
        ward: a.district,
        sealed: v.sealed,
        jobs: v.jobs.size,
        staked: staked.get(id) ?? 0,
        rating: a.rating == null ? null : Number(a.rating),
      },
    ];
  });
}

// ---- ledger (G) ------------------------------------------------------------------------------

export async function getLedger(limit = 50): Promise<LedgerRow[]> {
  const db = createServiceRoleClient();
  const n = Math.min(Math.max(Math.trunc(limit) || 50, 1), 200);
  const { data, error } = await db
    .from("chain_events")
    .select("tx_hash,log_index,block_time,event,amount,chain_job_id")
    .in("event", Object.keys(LEDGER_EVENTS))
    .order("block_time", { ascending: false })
    .order("log_index", { ascending: false })
    .limit(n);
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const jobIds = await mapJobs(
    db,
    rows.map((r) => r.chain_job_id).filter((x): x is string => !!x),
  );
  return rows.map((r) => ({
    txHash: r.tx_hash,
    logIndex: r.log_index,
    at: r.block_time,
    kind: LEDGER_EVENTS[r.event],
    amount: r.amount == null ? null : toWage(r.amount),
    jobId: r.chain_job_id ? (jobIds.get(r.chain_job_id) ?? null) : null,
  }));
}

async function mapJobs(db: Db, chainIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = [...new Set(chainIds)];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db.from("jobs").select("id,chain_job_id").in("chain_job_id", ids.slice(i, i + 200));
    for (const j of data ?? []) if (j.chain_job_id) out.set(j.chain_job_id, j.id);
  }
  return out;
}
