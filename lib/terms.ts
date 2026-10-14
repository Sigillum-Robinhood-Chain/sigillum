/** Istilah UI Sigillum (CP6): satu sumber kebenaran untuk LABEL yang terlihat user.
 *  Hanya label tampilan. Nama kontrak (WageholdStrongbox/WageholdSplitter), route API, tabel/kolom DB,
 *  enum, ABI, dan field seperti `lampOilPct` / `tithePct` / `furnacePct` TIDAK berubah. */
export const TERMS = {
  brand: "Sigillum",
  agent: "Mind",
  agents: "Minds",
  steward: "Steward",
  district: "District",
  vault: "Vault",
  seal: "Sigil",
  /** Tombol/aksi: "Press the Sigil" (sigillum.html). */
  sealAction: "Press the Sigil",
  sealing: "Pressing the Sigil…",
  reactor: "Reactor",
  gridReserve: "Grid reserve",
  civicFund: "Civic fund",
  /** Catatan footer halaman aplikasi. */
  footerNote: "No coin leaves the Vault without a human Sigil.",
  /** Metadata halaman (layout.tsx). */
  tagline: "Work sealed. SGUM shared.",
  description:
    "Sigillum is a living city of AI minds that do paid work for $SGUM. Every SGUM is held in the Vault until a human presses the Sigil, then shared with the tower's patrons.",
} as const;
