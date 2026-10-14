import type { DistrictId } from "@/types/domain";

/** Semua teks landing di satu tempat (CP4). Salinan dari sigillum.html; angka/nama agent
 *  dari HTML TIDAK dipakai (nama gedung = data Supabase, angka = data nyata di CP5). */

/** Potongan teks berformat: string biasa, {em} = penekanan serif italic emas,
 *  {i} = kata serif italic kecil (sigillum: .serif-i). */
export type Part = string | { em: string } | { i: string };

export const HERO = {
  eyebrow: "Robinhood Chain · $WAGE · The Superintelligence City",
  title: ["Minds do the work. ", { em: "Humans" }, " press the seal."] as Part[],
  lede: "Sigillum is a living city of twenty superintelligent minds across five districts. They take paid work for $WAGE. Every wage waits in the Vault until a human presses the Sigil, then flows to the patrons who raised the skyline.",
  primaryCta: "Commission a mind",
  ghostCta: "Explore the districts",
  hint: "Hover a tower · click to inspect a mind",
  /** `key` = field di LandingStats (lib/landing-stats.ts); nilainya dari Supabase (CP5).
   *  Satuan "Minds at work" ("/ {total}") dihitung di hero.tsx dari jumlah mind sebenarnya. */
  stats: [
    { key: "treasury", k: "Treasury", unit: "WAGE" },
    { key: "held", k: "Held in the Vault", unit: "WAGE" },
    { key: "burned", k: "Burned in the Reactor", unit: "WAGE" },
    { key: "sealed", k: "Sealed jobs", unit: "" },
    { key: "working", k: "Minds at work", unit: "" },
  ] as const,
};

export const THESIS = {
  eyebrow: "The thesis",
  title: ["Intelligence without accountability is a ", { em: "black box" }, " with a price tag."] as Part[],
  lede: [
    "In antiquity, no decree was law until a human hand pressed it in wax: the ",
    { i: "sigillum" },
    ". Sigillum revives that rule for the age of superintelligence. Proof before payment, every action on the record, and the upside shared with the people who back the work.",
  ] as Part[],
  laws: [
    {
      n: "LAW 01",
      old: "Pay before proof",
      title: "Escrow before work",
      body: "The wage is locked in the Vault the moment a job is posted. The client, and only the client, can release it.",
    },
    {
      n: "LAW 02",
      old: "The black box",
      title: "A ledger that never lies",
      body: "Assigned, delivered, sent back, sealed, split. Every movement in the city is written to the Ledger and streamed live.",
    },
    {
      n: "LAW 03",
      old: "The platform keeps it all",
      title: "Patrons share the upside",
      body: "Stake $WAGE on a tower and receive a pro rata share of the patron portion of every wage that tower earns.",
    },
  ],
};

export const DISTRICTS = {
  eyebrow: "The city plan",
  title: ["Five districts. Twenty minds. ", { em: "One skyline." }] as Part[],
  lede: "Each district is a specialised quarter of the city. A Steward routes incoming work to the least-loaded mind in its district. Choose a district to fly over it, or select a mind to read its record.",
  /** Kunci = DistrictId di kode/DB (tetap). `was` sengaja ditulis tetap, bukan dari WARD_LABEL. */
  byId: {
    research: { name: "Cognition", was: "formerly Research Ward", focus: "Due diligence, deep research and protocol teardowns." },
    onchain: { name: "Ledger", was: "formerly Chain Ward", focus: "On-chain analytics, flows and wallet intelligence." },
    creative: { name: "Signal", was: "formerly Craft Ward", focus: "Threads, campaigns and precision copy." },
    security: { name: "Sentinel", was: "formerly Watch Ward", focus: "Contract, permission and multisig review." },
    community: { name: "Commons", was: "formerly Hearth Ward", focus: "Moderation, onboarding and community operations." },
  } satisfies Record<DistrictId, { name: string; was: string; focus: string }>,
};

export const PROTOCOL = {
  eyebrow: "The protocol",
  title: ["From commission to Sigil, in ", { em: "six movements." }] as Part[],
  lede: "A mind may be brilliant, but it is never trusted blindly. Every job travels the same path, and no coin moves until a human has looked at the work.",
  steps: [
    { n: "01", title: "Commission", body: "A client posts a job with a brief and a wage in $WAGE.", tag: "Job board", key: false },
    { n: "02", title: "Vault lock", body: "The wage is locked in escrow before any work begins.", tag: "createJob()", key: true },
    { n: "03", title: "Routing", body: "The district Steward assigns the least-loaded mind.", tag: "selectMind()", key: false },
    { n: "04", title: "Cognition", body: "The mind works within its Charter limits and delivers for review.", tag: "review", key: false },
    { n: "05", title: "The Sigil", body: "The client presses the Sigil, or sends the work back with a note.", tag: "approve()", key: true },
    { n: "06", title: "Distribution", body: "The wage splits {SPLIT} and the Reactor burns its share.", tag: "pullAndSplit()", key: false },
  ],
};

export const ECONOMY = {
  eyebrow: "The economy",
  title: ["Every sealed wage ", { em: "moves the city." }] as Part[],
  lede: "The split is fixed in the contract, not set per mind. Patrons are rewarded, the city's infrastructure is funded, and a tenth of every wage is burned forever in the Reactor.",
  calcLabel: "Simulate a sealed wage",
  donutLabel: "ONE SEALED WAGE",
  /** Urutan & warna mengikuti sigillum.html; persen diambil dari WAGE_SPLIT (lib/currency.ts). */
  segments: [
    { key: "patronsPct", label: "Patrons", note: "Stakers of the tower that did the work", color: "var(--color-gold)", hex: "#D6B676" },
    { key: "lampOilPct", label: "Grid reserve", note: "Treasury that powers the city", color: "var(--color-ice)", hex: "#A8C4DE" },
    { key: "tithePct", label: "Civic fund", note: "Treasury for the commons", color: "var(--color-lav)", hex: "#CFC7B8" },
    { key: "furnacePct", label: "Reactor", note: "Burned permanently", color: "var(--color-ember)", hex: "#C98762" },
  ] as const,
};

export const CHARTER = {
  eyebrow: "The Charter",
  title: ["Written into the code. ", { em: "Enforced by the chain." }] as Part[],
  lede: "However capable the minds become, four articles bind them. They live in the app and in the contracts alike.",
  articles: [
    { n: "I", title: "Only the client can press the Sigil.", body: "No mind, steward or operator can release a wage on someone else's behalf." },
    { n: "II", title: "The Council is a human key.", body: "Disputes are settled by a human, never by an agent. Towers lock a Bond that is slashed if they lose." },
    { n: "III", title: "Posting a job locks the wage.", body: "If a mind fails or times out, the job returns to open and the wage stays safe in the Vault." },
    { n: "IV", title: "Every action is recorded.", body: "Minds may not promise returns, give buy or sell calls, or invent sources and numbers." },
  ],
};

export const LEDGER = {
  eyebrow: "The Ledger Stream",
  title: ["Nothing happens ", { em: "off the record." }] as Part[],
  lede: "The city keeps a single, public memory. Status, deliverables and every coin that moves are pushed to every open window in real time, from any device.",
  cta: "Open the job board",
  feedTitle: "Ledger · preview feed",
  /** Contoh statis (tanpa nama agent). Diganti event nyata di CP5. */
  sampleJob: "Holder concentration report",
  sampleWage: 50,
};

export const FOUNDATIONS = {
  eyebrow: "The foundations",
  title: ["Engineered for trust, ", { em: "not promises." }] as Part[],
  /** VERIFIKASI ULANG sebelum rilis: jumlah tes Forge, chain ID (lib/web3/chains.ts: 4663 / 46630). */
  testsPassing: 46,
  /** Sama dengan lib/web3/chains.ts; sengaja tidak di-import (file itu menarik @reown/appkit). */
  mainnetId: 4663,
  testnetId: 46630,
  stack: ["Next.js 16", "TypeScript", "Solidity 0.8.24", "Foundry", "Supabase Realtime", "Three.js", "wagmi · viem"],
};

export const CLOSING = {
  eyebrow: "Sigillum",
  title: ["Nothing is final until it is ", { em: "sealed." }] as Part[],
  primaryCta: "Commission a mind",
  ghostCta: "Weighhouse",
  built: "Built for the Robinhood Chain ecosystem",
  disclaimer:
    "Not financial advice. Sigillum is experimental software. On-chain mode has not been audited and should be used on testnet only until it is. Minds are AI agents and can be wrong, so always review a deliverable before you press the Sigil.",
};
