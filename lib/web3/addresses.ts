import { activeChain } from "@/lib/web3/chains";

/**
 * Sumber kebenaran tunggal alamat on-chain (brief Weighhouse §2).
 * JANGAN menulis alamat langsung di komponen -- impor dari sini.
 *
 * Alamat Strongbox / Splitter / token bisa di-override lewat env supaya rehearsal
 * di testnet tidak perlu mengubah kode; default-nya adalah deploy mainnet.
 */
const env = (v: string | undefined, fallback: string): `0x${string}` =>
  ((v && v.trim()) || fallback) as `0x${string}`;

export const ADDRESSES = {
  /** $WAGE token (CA) */
  wageToken: env(
    process.env.NEXT_PUBLIC_WAGE_TOKEN_ADDRESS,
    "0x1946b849518b87d52985ae1aeeb163a59089f2c8",
  ),
  strongbox: env(
    process.env.NEXT_PUBLIC_STRONGBOX_ADDRESS,
    "0xa6e141F52E156488E08bdE34A81Af1241de2CBEf",
  ),
  splitter: env(
    process.env.WAGEHOLD_SPLITTER_ADDRESS ??
      process.env.NEXT_PUBLIC_SPLITTER_ADDRESS,
    "0x94c173568f2Cf61617B83440DE8F56Baeed39D8c",
  ),
  owner: "0xFb8010fA96d3E8ba91eac316027b36716D3FE991" as `0x${string}`,
  council: "0x606C6aE7421C4c13d9c595AEb703F8E3A8eEAD28" as `0x${string}`,
  lampOilTreasury: "0x9Ce97Ee98e3B48b938903e46f7f6E8466Fc040f1" as `0x${string}`,
  titheTreasury: "0x011b714B35ddf49e874C1A759078be692152d3e5" as `0x${string}`,
  /** Furnace (burn) */
  furnace: "0x000000000000000000000000000000000000dEaD" as `0x${string}`,
  zero: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  deployer: "0x60B31fb1cDf3f3BB8A12B666e82b4F363ecdE0fE" as `0x${string}`,

  // Pons / Uniswap v4 (dari dokumen publik Bitquery -- verifikasi di Blockscout sebelum dipakai).
  ponsFactory: "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e" as `0x${string}`,
  ponsRouter: "0xe33e9e479df8802cb0866d5d05258bec4cf62948" as `0x${string}`,
  ponsMemeHook: "0xe5e702641ea86f4ae6cc3cdaed2b886f976be044" as `0x${string}`,
  ponsLocker: "0x267444d099b10fb5ed7c3cc7b7c767adca574952" as `0x${string}`,
  v4PoolManager: "0x8366a39cc670b4001a1121b8f6a443a643e40951" as `0x${string}`,
} as const;

/** Alamat yang harus diisi tim (brief §9). Kosong = fitur terkait dilewati, bukan error. */
export const WAGE_CURVE = (process.env.WEIGHHOUSE_WAGE_CURVE?.trim() ||
  undefined) as `0x${string}` | undefined;
/** Pool ID Uniswap v4 untuk $WAGE (bytes32). Terisi setelah token graduate. */
export const V4_POOL_ID = (process.env.WEIGHHOUSE_V4_POOL_ID?.trim() ||
  undefined) as `0x${string}` | undefined;
/** Blok deploy Strongbox/Splitter -- indexer mulai dari sini. */
export const DEPLOY_BLOCK = process.env.WEIGHHOUSE_DEPLOY_BLOCK
  ? BigInt(process.env.WEIGHHOUSE_DEPLOY_BLOCK)
  : undefined;

export const WAGE_DECIMALS = 18;
/** Suplai awal tetap (fixed launch). */
export const WAGE_INITIAL_SUPPLY = 1_000_000_000;

/** Link halaman token di Pons (opsional, tanpa tombol beli). */
export const PONS_TOKEN_URL = process.env.NEXT_PUBLIC_PONS_TOKEN_URL?.trim() || undefined;

const EXPLORER = (
  activeChain.blockExplorers?.default.url ?? "https://robinhoodchain.blockscout.com"
).replace(/\/$/, "");

export const explorerAddress = (a: string) => `${EXPLORER}/address/${a}`;
export const explorerToken = (a: string) => `${EXPLORER}/token/${a}`;
export const explorerTx = (h: string) => `${EXPLORER}/tx/${h}`;

/** Pre-flight (brief §2): token yang dipakai app, Splitter/Strongbox, dan Pons harus sama. */
export function wageTokenMatchesCanonical(): boolean {
  return (
    ADDRESSES.wageToken.toLowerCase() ===
    "0x1946b849518b87d52985ae1aeeb163a59089f2c8"
  );
}
