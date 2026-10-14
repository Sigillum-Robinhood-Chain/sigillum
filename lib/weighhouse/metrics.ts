/**
 * Tipe + hitungan murni untuk The Weighhouse (brief Wagehold-Weighhouse-devbrief.md §4).
 * File ini TIDAK mengimpor kode server, jadi aman diimpor (type-only) dari komponen client.
 * Akses database ada di `lib/weighhouse/data.ts`.
 */
import type { DistrictId } from "@/types/domain";
import { WAGE_DECIMALS, WAGE_INITIAL_SUPPLY } from "@/lib/web3/addresses";

export type Win = "24h" | "7d" | "all";
export type PriceRange = "24h" | "7d" | "30d";
export type PriceSource = "bitquery" | "onchain";

export const WINDOW_MS: Record<Exclude<Win, "all">, number> = {
  "24h": 24 * 3600_000,
  "7d": 7 * 24 * 3600_000,
};
export const RANGE_MS: Record<PriceRange, number> = {
  "24h": 24 * 3600_000,
  "7d": 7 * 24 * 3600_000,
  "30d": 30 * 24 * 3600_000,
};
/** Harga lebih tua dari ini ditandai "stale" (brief §7). */
export const PRICE_STALE_MS = 15 * 60_000;
/** Work Ratio ditampilkan paling tinggi 999% (brief §4.1). */
export const WORK_RATIO_CAP = 999;

export function parseWin(v: string | null | undefined): Win {
  return v === "24h" || v === "all" ? v : "7d";
}
export function parseRange(v: string | null | undefined): PriceRange {
  return v === "24h" || v === "30d" ? v : "7d";
}
export function windowStart(win: Win, now = Date.now()): Date | null {
  return win === "all" ? null : new Date(now - WINDOW_MS[win]);
}

/** uint256 mentah (wei) -> satuan SGUM. Hanya untuk tampilan. */
export function toWage(raw: number | string | bigint | null | undefined): number {
  if (raw == null) return 0;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
  return Number.isFinite(n) ? n / 10 ** WAGE_DECIMALS : 0;
}

/** Work Ratio = Σ sealed ÷ Σ traded (brief §4.1). Volume 0 -> null ("—"). */
export function workRatio(
  sealed: number,
  traded: number,
): { pct: number | null; capped: boolean } {
  if (!(traded > 0)) return { pct: null, capped: false };
  const pct = (sealed / traded) * 100;
  return pct > WORK_RATIO_CAP ? { pct: WORK_RATIO_CAP, capped: true } : { pct, capped: false };
}

// ---- tipe respons API -------------------------------------------------------------------

export interface SupplyBucket {
  key:
    | "burned"
    | "curve"
    | "lp"
    | "locker"
    | "strongbox"
    | "splitter"
    | "treasuries"
    | "circulating";
  label: string;
  /** Padanan istilah polos (brief §6: lore + label polos). */
  plain: string;
  amount: number;
  /** % dari total supply. */
  pct: number;
  note?: string;
  links?: { label: string; address: string }[];
}

export interface BurnDay {
  day: string;
  burned: number;
  cumulative: number;
}

export interface Summary {
  window: Win;
  tiles: {
    priceUsd: number | null;
    change24hPct: number | null;
    priceSource: PriceSource | null;
    priceUpdatedAt: string | null;
    priceStale: boolean;
    marketCapUsd: number | null;
    liquidityUsd: number | null;
    workRatioPct: number | null;
    workRatioCapped: boolean;
    sealedWage: number;
    tradedWage: number;
    tradeVolumeSource: "v4" | "snapshots" | "none";
  };
  supply: {
    total: number;
    blockNumber: number;
    updatedAt: string;
    buckets: SupplyBucket[];
  } | null;
  /** Stake patron di tabel `stakes` (simulasi sampai Patronage on-chain rilis). */
  stakedByPatrons: number;
  flow: {
    locked: number;
    sealed: number;
    patrons: number;
    lampOil: number;
    tithe: number;
    furnace: number;
    stillInEscrow: number;
    refunded: number;
    jobs: { posted: number; sealed: number; refunded: number; disputed: number };
  };
  furnace: {
    burnedAllTime: number;
    burnedInWindow: number;
    pctOfSupply: number;
    daily: BurnDay[];
    latest: { txHash: string; at: string; amount: number }[];
  };
  graduatedAt: string | null;
}

export type LedgerKind =
  | "Locked"
  | "Sealed"
  | "Refunded"
  | "Disputed"
  | "Resolved"
  | "Split"
  | "Burned";

export interface LedgerRow {
  txHash: string;
  logIndex: number;
  at: string;
  kind: LedgerKind;
  amount: number | null;
  /** UUID job di app (bukan bytes32) kalau event bisa dipetakan. */
  jobId: string | null;
}

export interface TopBuilding {
  agentId: string;
  name: string;
  sigil: string;
  ward: DistrictId;
  sealed: number;
  jobs: number;
  staked: number;
  rating: number | null;
}

export interface PriceSeries {
  range: PriceRange;
  points: { t: string; usd: number | null; eth: number | null }[];
  source: PriceSource | null;
}

// ---- pemetaan event -> baris ledger -------------------------------------------------------

export const LEDGER_EVENTS: Record<string, LedgerKind> = {
  JobFunded: "Locked",
  SealSet: "Sealed",
  JobRefunded: "Refunded",
  SealBroken: "Disputed",
  DisputeResolved: "Resolved",
  JobSplit: "Split",
  Burned: "Burned",
};

// ---- bucket suplai (brief §4B) ------------------------------------------------------------

export interface SupplyInput {
  total: number;
  burned: number;
  curve: number | null;
  lp: number;
  locker: number;
  strongbox: number;
  splitter: number;
  treasuries: number;
}

export function circulatingSupply(s: SupplyInput): number {
  return (
    s.total - s.burned - (s.curve ?? 0) - s.locker - s.lp - s.strongbox - s.splitter - s.treasuries
  );
}

/** Link Blockscout per bucket diisi pemanggil (butuh ADDRESSES) lewat `links`. */
export function buildBuckets(
  s: SupplyInput,
  links: Partial<Record<SupplyBucket["key"], SupplyBucket["links"]>>,
): SupplyBucket[] {
  const total = s.total > 0 ? s.total : WAGE_INITIAL_SUPPLY;
  const pct = (n: number) => (n / total) * 100;
  const row = (
    key: SupplyBucket["key"],
    label: string,
    plain: string,
    amount: number,
    note?: string,
  ): SupplyBucket => ({ key, label, plain, amount, pct: pct(amount), note, links: links[key] });
  return [
    row("burned", "Reactor", "burned", s.burned),
    row(
      "curve",
      "Bonding curve",
      "pre-graduation",
      s.curve ?? 0,
      s.curve == null ? "not tracked" : undefined,
    ),
    row("lp", "Liquidity pool", "Uniswap v4 PoolManager balance", s.lp),
    row("locker", "Pons locker", "locked liquidity", s.locker),
    row("strongbox", "Vault", "escrow", s.strongbox),
    row("splitter", "Splitter", "pending split / burn", s.splitter),
    row("treasuries", "Treasuries", "Grid reserve + Civic fund", s.treasuries),
    row("circulating", "Circulating", "everything else", circulatingSupply(s)),
  ];
}

// ---- burn harian (UTC) --------------------------------------------------------------------

export function dailyBurns(
  events: { at: string; amount: number }[],
  sinceMs: number | null,
): BurnDay[] {
  const byDay = new Map<string, number>();
  for (const e of [...events].sort((a, b) => a.at.localeCompare(b.at))) {
    const day = e.at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + e.amount);
  }
  let cum = 0;
  const out: BurnDay[] = [];
  for (const [day, burned] of byDay) {
    cum += burned;
    if (sinceMs == null || new Date(`${day}T23:59:59.999Z`).getTime() >= sinceMs) {
      out.push({ day, burned, cumulative: cum });
    }
  }
  return out;
}
