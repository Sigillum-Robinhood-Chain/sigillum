import { deriveAgentStats, deriveRank, deriveWardStats } from "@/lib/agent-stats";
import { summarizeStakes, type StakeItem } from "@/lib/patronage";
import type { AgentStatus, DistrictId, Rank } from "@/types/domain";

/** Pangkat yang tampil di landing: lead = "steward" (istilah Sigillum untuk Warden). */
export type MindRank = "steward" | Exclude<Rank, "warden">;

/** Satu mind (agent) untuk kartu district + drawer di landing. Semua angka turunan data nyata. */
export interface LandingMind {
  id: string;
  name: string;
  code: string;
  district: DistrictId;
  rank: MindRank;
  isLead: boolean;
  description: string;
  status: AgentStatus;
  jobsSealed: number;
  /** Wage kotor dari job `paid` (sama dengan Revenue 30D di dashboard lama). */
  revenue: number;
  rating: number | null;
  patrons: number;
  staked: number;
  bond: number;
}

interface AgentLike {
  id: string;
  name: string;
  code: string;
  district: DistrictId;
  is_lead: boolean;
  description: string;
  bond_wage?: number | string | null;
}

interface JobLike {
  agent_id: string | null;
  district: DistrictId;
  status: string;
  budget_usdc: number | string;
  rating?: number | null;
}

/** Aturan sama dengan dashboard lama (sudah dihapus di CP10):
 *  - status mind = job working/review miliknya (review menang atas working)
 *  - angka mind = job miliknya; angka Steward (lead) = seluruh district-nya (deriveWardStats)
 *  - rank non-lead = deriveRank(jobsSealed, rating), BUKAN kolom agents.rank (angka demo seed)
 *  Hanya MEMBACA lib/agent-stats & lib/patronage; tidak mengubah logikanya. */
export function deriveLandingMinds(input: {
  agents: AgentLike[];
  jobs: JobLike[];
  stakes: StakeItem[];
}): LandingMind[] {
  const toJob = (j: JobLike) => ({
    status: j.status,
    budgetUsdc: Number(j.budget_usdc),
    rating: j.rating ?? null,
    agentId: j.agent_id,
  });

  const status = new Map<string, AgentStatus>();
  for (const j of input.jobs) {
    if (!j.agent_id) continue;
    if (j.status !== "working" && j.status !== "review") continue;
    const cur = status.get(j.agent_id);
    if (j.status === "review" || cur !== "review") {
      status.set(j.agent_id, j.status === "review" ? "review" : "working");
    }
  }

  return input.agents.map((a) => {
    const stats = a.is_lead
      ? deriveWardStats(input.jobs.filter((j) => j.district === a.district).map(toJob))
      : deriveAgentStats(input.jobs.filter((j) => j.agent_id === a.id).map(toJob));
    const patron = summarizeStakes(input.stakes, a.id, null);
    return {
      id: a.id,
      name: a.name,
      code: a.code,
      district: a.district,
      rank: a.is_lead ? "steward" : deriveRank(stats.jobsSealed, stats.rating),
      isLead: a.is_lead,
      description: a.description,
      status: status.get(a.id) ?? "idle",
      jobsSealed: stats.jobsSealed,
      revenue: stats.revenue30d,
      rating: stats.rating,
      patrons: patron.stakerCount,
      staked: patron.stakedWage,
      bond: Number(a.bond_wage ?? 0),
    };
  });
}
