import {
  encodeAbiParameters,
  keccak256,
  parseAbi,
  parseAbiItem,
  toHex,
  type Log,
} from 'viem';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { publicClient } from '@/lib/web3/public-client';
import { computeJobId } from '@/lib/web3/strongbox';
import {
  ADDRESSES,
  DEPLOY_BLOCK,
  V4_POOL_ID,
  WAGE_CURVE,
  WAGE_DECIMALS,
} from '@/lib/web3/addresses';

/**
 * Indexer + snapshot Weighhouse (brief §5). Dipanggil cron `/api/cron/index-chain`.
 * Event dibaca dari kontrak di `contracts/src/*.sol` (nama & argumen persis, bukan tebakan).
 * Semua tulisan idempoten: `(tx_hash, log_index)` unik untuk event, `taken_at` unik untuk snapshot.
 */

const STRONGBOX_EVENTS = parseAbi([
  'event JobFunded(bytes32 indexed jobId, address indexed client, uint256 amount)',
  'event PayeeSet(bytes32 indexed jobId, address indexed payee)',
  'event SealSet(bytes32 indexed jobId, address indexed payee, uint256 amount)',
  'event JobRefunded(bytes32 indexed jobId, address indexed client, uint256 amount)',
  'event SealBroken(bytes32 indexed jobId, address indexed client)',
  'event DisputeResolved(bytes32 indexed jobId, address indexed payee, uint256 payeeAmount, uint256 refundAmount)',
]);

const SPLITTER_EVENTS = parseAbi([
  'event JobRegistered(bytes32 indexed jobId, address indexed patronPool, uint256 amount)',
  'event JobSplit(bytes32 indexed jobId, address indexed patronPool, uint256 patronAmount, uint256 lampOilAmount, uint256 titheAmount, uint256 burnAmount)',
  'event Burned(address indexed caller, uint256 amount)',
]);

// Uniswap v4 PoolManager.Swap (v4-core). amount0/amount1 = delta sisi swapper; volume = |amount1|
// karena $WAGE adalah currency1 di pool berpasangan ETH native.
const V4_SWAP_EVENT = parseAbiItem(
  'event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)',
);

const ERC20 = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

const CHUNK = 5000n;
const MAX_CHUNKS_PER_RUN = 10;
const REORG_BUFFER = 2n;
const STATE_KEY = 'chain_events';

type EventInsert = {
  tx_hash: string;
  log_index: number;
  block_number: string;
  block_time: string;
  contract: string;
  event: string;
  chain_job_id: string | null;
  amount: string | null;
  args: Record<string, unknown>;
};

const bigintReplacer = (_: string, v: unknown) =>
  typeof v === 'bigint' ? v.toString() : v;
const abs = (v: bigint) => (v < 0n ? -v : v);

function amountOf(event: string, a: Record<string, unknown>): bigint | null {
  switch (event) {
    case 'JobFunded':
    case 'SealSet':
    case 'JobRefunded':
    case 'Burned':
      return a.amount as bigint;
    case 'DisputeResolved':
      return a.payeeAmount as bigint;
    case 'JobSplit':
      return (
        (a.patronAmount as bigint) +
        (a.lampOilAmount as bigint) +
        (a.titheAmount as bigint) +
        (a.burnAmount as bigint)
      );
    case 'Swap':
      return abs(a.amount1 as bigint);
    default:
      return null;
  }
}

// ---- 1. event -> chain_events -------------------------------------------------------------------

export interface IndexReport {
  skipped?: string;
  fromBlock?: string;
  toBlock?: string;
  events?: number;
  caughtUp?: boolean;
}

export async function indexChainEvents(): Promise<IndexReport> {
  if (DEPLOY_BLOCK == null)
    return { skipped: 'WEIGHHOUSE_DEPLOY_BLOCK not set' };
  const db = createServiceRoleClient();

  const { data: state } = await db
    .from('indexer_state')
    .select('last_block')
    .eq('key', STATE_KEY)
    .maybeSingle();
  const head = (await publicClient.getBlockNumber()) - REORG_BUFFER;
  let from = state ? BigInt(state.last_block) + 1n : DEPLOY_BLOCK;
  if (from > head)
    return {
      fromBlock: from.toString(),
      toBlock: head.toString(),
      events: 0,
      caughtUp: true,
    };

  const startedAt = from;
  const blockTimes = new Map<bigint, string>();
  const timeOf = async (bn: bigint) => {
    const hit = blockTimes.get(bn);
    if (hit) return hit;
    const b = await publicClient.getBlock({ blockNumber: bn });
    const iso = new Date(Number(b.timestamp) * 1000).toISOString();
    blockTimes.set(bn, iso);
    return iso;
  };

  let total = 0;
  let lastDone = from - 1n;
  for (let i = 0; i < MAX_CHUNKS_PER_RUN && from <= head; i++) {
    const to = from + CHUNK - 1n > head ? head : from + CHUNK - 1n;

    const [strongbox, splitter, swaps] = await Promise.all([
      publicClient.getLogs({
        address: ADDRESSES.strongbox,
        events: STRONGBOX_EVENTS,
        fromBlock: from,
        toBlock: to,
      }),
      publicClient.getLogs({
        address: ADDRESSES.splitter,
        events: SPLITTER_EVENTS,
        fromBlock: from,
        toBlock: to,
      }),
      V4_POOL_ID
        ? publicClient.getLogs({
            address: ADDRESSES.v4PoolManager,
            event: V4_SWAP_EVENT,
            args: { id: V4_POOL_ID },
            fromBlock: from,
            toBlock: to,
          })
        : Promise.resolve([]),
    ]);

    const batches: { logs: readonly Log[]; contract: string }[] = [
      { logs: strongbox as readonly Log[], contract: ADDRESSES.strongbox },
      { logs: splitter as readonly Log[], contract: ADDRESSES.splitter },
      { logs: swaps as readonly Log[], contract: ADDRESSES.v4PoolManager },
    ];

    const rows: EventInsert[] = [];
    for (const { logs, contract } of batches) {
      for (const log of logs) {
        const named = log as Log & {
          eventName?: string;
          args?: Record<string, unknown>;
        };
        if (
          !named.eventName ||
          log.blockNumber == null ||
          log.transactionHash == null ||
          log.logIndex == null
        )
          continue;
        const args = (named.args ?? {}) as Record<string, unknown>;
        const amount = amountOf(named.eventName, args);
        rows.push({
          tx_hash: log.transactionHash,
          log_index: log.logIndex,
          block_number: log.blockNumber.toString(),
          block_time: await timeOf(log.blockNumber),
          contract: contract.toLowerCase(),
          event: named.eventName,
          chain_job_id: typeof args.jobId === 'string' ? args.jobId : null,
          amount: amount == null ? null : amount.toString(),
          args: JSON.parse(JSON.stringify(args, bigintReplacer)) as Record<
            string,
            unknown
          >,
        });
      }
    }

    if (rows.length) {
      const { error } = await db
        .from('chain_events')
        .upsert(rows, { onConflict: 'tx_hash,log_index' });
      if (error) throw new Error(`chain_events upsert: ${error.message}`);
      total += rows.length;
    }
    const { error: stErr } = await db
      .from('indexer_state')
      .upsert(
        { key: STATE_KEY, last_block: to.toString() },
        { onConflict: 'key' },
      );
    if (stErr) throw new Error(`indexer_state upsert: ${stErr.message}`);

    lastDone = to;
    from = to + 1n;
  }

  return {
    fromBlock: startedAt.toString(),
    toBlock: lastDone.toString(),
    events: total,
    caughtUp: lastDone >= head,
  };
}

/** Isi `jobs.chain_job_id` (= keccak256(uuid)) supaya ledger bisa menaut ke /jobs/[id]. */
export async function backfillChainJobIds(limit = 200): Promise<number> {
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from('jobs')
    .select('id')
    .is('chain_job_id', null)
    .limit(limit);
  if (error) throw new Error(error.message);
  let n = 0;
  for (const j of data ?? []) {
    const { error: upErr } = await db
      .from('jobs')
      .update({ chain_job_id: computeJobId(j.id) })
      .eq('id', j.id);
    if (!upErr) n++;
  }
  return n;
}

// ---- 2. supply snapshot (brief §5.3) ------------------------------------------------------------

export async function snapshotSupply(): Promise<{
  block: string;
  total: string;
}> {
  const token = ADDRESSES.wageToken;
  const block = await publicClient.getBlockNumber();
  const bal = (who: `0x${string}`) =>
    publicClient.readContract({
      address: token,
      abi: ERC20,
      functionName: 'balanceOf',
      args: [who],
      blockNumber: block,
    });

  const [
    decimals,
    total,
    dead,
    zero,
    curve,
    locker,
    strongbox,
    splitter,
    lamp,
    tithe,
    pool,
  ] = await Promise.all([
    publicClient.readContract({
      address: token,
      abi: ERC20,
      functionName: 'decimals',
      blockNumber: block,
    }),
    publicClient.readContract({
      address: token,
      abi: ERC20,
      functionName: 'totalSupply',
      blockNumber: block,
    }),
    bal(ADDRESSES.furnace),
    bal(ADDRESSES.zero),
    WAGE_CURVE ? bal(WAGE_CURVE) : Promise.resolve(null),
    bal(ADDRESSES.ponsLocker),
    bal(ADDRESSES.strongbox),
    bal(ADDRESSES.splitter),
    bal(ADDRESSES.lampOilTreasury),
    bal(ADDRESSES.titheTreasury),
    // Saldo $WAGE milik PoolManager = $WAGE di semua pool v4 (PoolManager memegang banyak token,
    // tapi balanceOf di kontrak $WAGE hanya menghitung $WAGE).
    bal(ADDRESSES.v4PoolManager),
  ]);
  if (Number(decimals) !== WAGE_DECIMALS)
    throw new Error(
      `$WAGE decimals ${decimals} != ${WAGE_DECIMALS}; update WAGE_DECIMALS`,
    );

  const burned = dead + zero;
  const treasuries = lamp + tithe;
  const circulating =
    total -
    burned -
    (curve ?? 0n) -
    locker -
    pool -
    strongbox -
    splitter -
    treasuries;

  const db = createServiceRoleClient();
  const takenAt = new Date(
    Math.floor(Date.now() / 60_000) * 60_000,
  ).toISOString();
  const { error } = await db.from('supply_snapshots').upsert(
    {
      taken_at: takenAt,
      block_number: block.toString(),
      total: total.toString(),
      burned: burned.toString(),
      curve: curve == null ? null : curve.toString(),
      lp: pool.toString(),
      locker: locker.toString(),
      strongbox: strongbox.toString(),
      splitter: splitter.toString(),
      treasuries: treasuries.toString(),
      circulating: circulating.toString(),
    },
    { onConflict: 'taken_at' },
  );
  if (error) throw new Error(`supply_snapshots upsert: ${error.message}`);
  return { block: block.toString(), total: total.toString() };
}

// ---- 3. price snapshot (brief §5.2, jalur on-chain) ---------------------------------------------

const POOL_MANAGER_ABI = parseAbi([
  'function extsload(bytes32 slot) view returns (bytes32)',
]);
const FEED_ABI = parseAbi([
  'function decimals() view returns (uint8)',
  'function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)',
]);
/** `pools` mapping ada di storage slot 6 PoolManager v4 (v4-core StateLibrary.POOLS_SLOT). */
const V4_POOLS_SLOT = 6n;
const PRICE_EVERY_MS = 5 * 60_000;

async function ethUsd(): Promise<number | null> {
  const feed = process.env.WEIGHHOUSE_ETH_USD_FEED?.trim() as
    | `0x${string}`
    | undefined;
  if (feed) {
    try {
      const [dec, round] = await Promise.all([
        publicClient.readContract({
          address: feed,
          abi: FEED_ABI,
          functionName: 'decimals',
        }),
        publicClient.readContract({
          address: feed,
          abi: FEED_ABI,
          functionName: 'latestRoundData',
        }),
      ]);
      const v = Number(round[1]) / 10 ** Number(dec);
      if (v > 0) return v;
    } catch {
      /* jatuh ke env */
    }
  }
  const fixed = Number(process.env.WEIGHHOUSE_ETH_USD);
  return Number.isFinite(fixed) && fixed > 0 ? fixed : null;
}

/**
 * Harga dari slot0 pool Uniswap v4 (`sqrtPriceX96`). Hanya jalan setelah token graduate dan
 * `WEIGHHOUSE_V4_POOL_ID` terisi. Asumsi: pasangan ETH native, $WAGE = currency1
 * (ubah lewat WEIGHHOUSE_V4_WAGE_IS_CURRENCY0=true bila terbalik); kedua token 18 desimal.
 */
export async function snapshotPrice(): Promise<{
  skipped?: string;
  priceEth?: number;
  priceUsd?: number | null;
  liquidityUsd?: number | null;
}> {
  if (!V4_POOL_ID)
    return {
      skipped:
        'WEIGHHOUSE_V4_POOL_ID not set (price needs the v4 pool or a Bitquery source)',
    };
  const db = createServiceRoleClient();

  const { data: last } = await db
    .from('price_snapshots')
    .select('taken_at')
    .order('taken_at', { ascending: false })
    .limit(1);
  if (
    last?.[0] &&
    Date.now() - new Date(last[0].taken_at).getTime() < PRICE_EVERY_MS
  )
    return { skipped: 'fresh snapshot exists' };

  const slot = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'uint256' }],
      [V4_POOL_ID, V4_POOLS_SLOT],
    ),
  );
  // slot0 ada di `slot`; `liquidity` (uint128, likuiditas aktif di tick sekarang) di slot + 3
  // (Pool.State v4-core: slot0, feeGrowthGlobal0X128, feeGrowthGlobal1X128, liquidity).
  const liqSlot = toHex(BigInt(slot) + 3n, { size: 32 });
  const [word, liqWord] = await Promise.all([
    publicClient.readContract({
      address: ADDRESSES.v4PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'extsload',
      args: [slot],
    }),
    publicClient.readContract({
      address: ADDRESSES.v4PoolManager,
      abi: POOL_MANAGER_ABI,
      functionName: 'extsload',
      args: [liqSlot],
    }),
  ]);
  const sqrtPriceX96 = BigInt(word) & ((1n << 160n) - 1n);
  if (sqrtPriceX96 === 0n) return { skipped: 'pool not initialized' };
  const liquidity = BigInt(liqWord) & ((1n << 128n) - 1n);

  const ratio = (Number(sqrtPriceX96) / 2 ** 96) ** 2; // currency1 per currency0
  const wageIsCurrency0 =
    process.env.WEIGHHOUSE_V4_WAGE_IS_CURRENCY0 === 'true';
  const priceEth = wageIsCurrency0 ? ratio : 1 / ratio;
  const eth = await ethUsd();
  const priceUsd = eth == null ? null : priceEth * eth;

  // Kedalaman likuiditas = 2 x nilai sisi ETH dari cadangan virtual rentang aktif:
  //   amount0 = L / sqrtP,  amount1 = L * sqrtP  (sqrtP = sqrtPriceX96 / 2^96).
  // Ini aproksimasi kedalaman rentang aktif, bukan TVL penuh.
  const sqrtP = Number(sqrtPriceX96) / 2 ** 96;
  const ethSideWei = wageIsCurrency0
    ? Number(liquidity) * sqrtP
    : Number(liquidity) / sqrtP;
  const liquidityUsd =
    eth == null || liquidity === 0n ? null : 2 * (ethSideWei / 1e18) * eth;

  const { error } = await db.from('price_snapshots').upsert(
    {
      taken_at: new Date().toISOString(),
      price_eth: priceEth,
      price_usd: priceUsd,
      liquidity_usd: liquidityUsd,
      source: 'onchain',
    },
    { onConflict: 'taken_at' },
  );
  if (error) throw new Error(`price_snapshots upsert: ${error.message}`);
  return { priceEth, priceUsd, liquidityUsd };
}
