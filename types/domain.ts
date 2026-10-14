import type { DistrictId, JobStatus, Rank } from "@/types/enums";

export type { DistrictId, JobStatus, Rank };

export type AgentStatus = "idle" | "working" | "review";

export interface AgentSummary {
  id: string;
  name: string;
  code: string;
  district: DistrictId;
  rank: Rank;
  isLead: boolean;
  status: AgentStatus;
  revenue30d: number;
}

/** Data lengkap untuk Page E (Wright Profile) -- superset dari AgentSummary
 *  yang dipakai City Dashboard, ditambah field yang cuma dibutuhkan di
 *  halaman profil (description, stakerCount, rating, jobsSealed). */
export interface AgentDetail extends AgentSummary {
  description: string;
  /** Jumlah patron = staker $WAGE yang stake-nya > 0 di bangunan ini
   *  (turunan tabel `stakes`, bukan lagi kolom demo `agents.holders`). */
  stakerCount: number;
  /** Total WAGE yang di-stake patron di bangunan ini. */
  stakedWage: number;
  /** WAGE yang dikunci bangunan ini (slashed kalau kalah sengketa). */
  bondWage: number;
  /** null = belum ada job ber-rating (UI: "No ratings yet"). */
  rating: number | null;
  jobsSealed: number;
}

export interface JobSummary {
  id: string;
  title: string;
  district: DistrictId;
  agentCode?: string;
  budgetUsdc: number;
  status: JobStatus;
  progress: number;
  /** Tx hash dari WageholdStrongbox.createJob (Fase 2 item 6) -- null di
   *  job lama / alur simulasi (escrow on-chain belum dikonfigurasi). */
  escrowTx?: string | null;
}

export interface RevenueSplitData {
  patronsPct: number; // 60
  lampOilPct: number; // 20
  tithePct: number; // 10
  furnacePct: number; // 10 (dibakar)
}

export const WARD_LABEL: Record<DistrictId, string> = {
  research: "Cognition",
  onchain: "Ledger",
  creative: "Signal",
  security: "Sentinel",
  community: "Commons",
};

/** Urutan ring di City Dashboard -- sama dengan urutan DISTRICTS di
 *  wagehold-prototype.html supaya tata letak kota tidak berubah. */
export const DISTRICT_ORDER: DistrictId[] = [
  "research",
  "onchain",
  "creative",
  "security",
  "community",
];

/** Sama persis dengan token --color-ward-* di app/globals.css. Three.js
 *  butuh nilai hex mentah (tidak bisa baca variabel CSS/kelas Tailwind),
 *  jadi nilainya diduplikasi di sini secara sengaja -- kalau warna Ward
 *  berubah di globals.css, ubah juga di sini (dan di WARD_DOT pada
 *  components/weighhouse/weighhouse-client.tsx). */
export const WARD_COLOR_HEX: Record<DistrictId, string> = {
  research: "#4FA3F7",
  onchain: "#F2BE4A",
  creative: "#A47CFF",
  security: "#2FD39B",
  community: "#FF6F59",
};

export const RANK_LABEL: Record<Rank, string> = {
  apprentice: "Apprentice",
  journeyman: "Journeyman",
  master: "Master",
  warden: "Steward",
};
