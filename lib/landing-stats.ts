import type { JobStatus } from "@/types/enums";

/** Lima angka di panel hero landing. Semuanya turunan data nyata Supabase. */
export interface LandingStats {
  /** Treasury (Grid reserve + Civic fund): tithe + patron cut tanpa staker, dari wage_splits. */
  treasury: number;
  /** SGUM yang sedang terkunci di Vault: job open / working / review. */
  held: number;
  /** Total yang dibakar di Reactor, dari wage_splits. */
  burned: number;
  /** Job berstatus `paid`. */
  sealed: number;
  /** Mind yang sedang memegang job working/review. */
  working: number;
  /** Jumlah mind (baris `agents`). */
  total: number;
}

interface JobLike {
  agent_id: string | null;
  status: JobStatus;
  budget_usdc: number | string;
}

/** Aturan sama persis dengan dashboard lama (sudah dihapus di CP10):
 *  - held    = jumlah budget job open | working | review
 *  - sealed  = job paid
 *  - working = agent berbeda yang punya job working | review
 *  Dipisah dari komponen supaya mudah diuji dan tidak menarik Supabase ke bundle klien. */
export function deriveLandingStats(input: {
  agentCount: number;
  jobs: JobLike[];
  totals: { burned: number; treasury: number };
}): LandingStats {
  let held = 0;
  let sealed = 0;
  const busy = new Set<string>();

  for (const j of input.jobs) {
    if (j.status === "paid") sealed += 1;
    if (j.status === "open" || j.status === "working" || j.status === "review") {
      held += Number(j.budget_usdc);
    }
    if ((j.status === "working" || j.status === "review") && j.agent_id) {
      busy.add(j.agent_id);
    }
  }

  return {
    treasury: input.totals.treasury,
    held,
    burned: input.totals.burned,
    sealed,
    working: busy.size,
    total: input.agentCount,
  };
}
