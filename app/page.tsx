import { createClient } from "@/lib/supabase/server";
import {
  getWageSplitTotals,
  listAgents,
  listJobs,
  listRecentEvents,
  listStakes,
} from "@/lib/supabase/queries";
import { deriveLandingStats, type LandingStats } from "@/lib/landing-stats";
import { deriveLandingMinds, type LandingMind } from "@/lib/landing-minds";
import type { LandingEvent } from "@/components/landing/ledger-events";
import { CityShell } from "@/components/city/city-shell";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { Hero } from "@/components/landing/hero";
import { Thesis } from "@/components/landing/thesis";
import { Districts } from "@/components/landing/districts";
import { Protocol } from "@/components/landing/protocol";
import { Economy } from "@/components/landing/economy";
import { Charter } from "@/components/landing/charter";
import { LedgerPreview } from "@/components/landing/ledger-preview";
import { Foundations } from "@/components/landing/foundations";
import { Closing } from "@/components/landing/closing";

// Data landing dibaca per request (bukan di-cache saat build), sama seperti dashboard lama.
export const revalidate = 0;

interface LandingData {
  stats: LandingStats;
  minds: LandingMind[];
  events: LandingEvent[];
}

/** Data landing dari Supabase (CP5): angka hero, mind per district (drawer), event ledger.
 *  Hanya MEMANGGIL query yang sudah ada (lib/supabase/queries.ts). Bila Supabase tidak
 *  terjangkau / env belum diisi, kembalikan null: hero "—", district tanpa daftar mind,
 *  ledger memakai contoh; seluruh halaman tetap terbuka. */
async function loadLanding(): Promise<LandingData | null> {
  try {
    const supabase = await createClient();
    const [agentsRes, jobsRes, totals, stakes, events] = await Promise.all([
      listAgents(supabase),
      listJobs(supabase),
      getWageSplitTotals(supabase),
      listStakes(supabase),
      listRecentEvents(supabase, 40), // banyak event perantara disaring di feed, jadi ambil lebih
    ]);
    if (agentsRes.error || jobsRes.error) return null;
    const agents = agentsRes.data ?? [];
    const jobs = jobsRes.data ?? [];
    return {
      stats: deriveLandingStats({ agentCount: agents.length, jobs, totals }),
      minds: deriveLandingMinds({ agents, jobs, stakes }),
      events: events.map((e) => ({
        id: e.id,
        jobId: e.job_id,
        at: e.at,
        type: e.type,
        note: e.note,
        title: e.job_title,
      })),
    };
  } catch {
    return null;
  }
}

// CP4 (redesain Sigillum): `/` = landing bergaya sigillum.html. CP9: latar kota 3D (CityShell)
// di belakang section, kamera mengikuti scroll. Dashboard lama (/city) dihapus di CP10;
// stake & job board tetap lewat /agents/[id] dan /jobs.
export default async function Home() {
  const data = await loadLanding();

  return (
    <>
      <CityShell minds={data?.minds ?? []} />
      <RevealObserver />
      {/* Tanpa JS, .rv akan tetap tersembunyi (opacity 0): tampilkan saja. */}
      <noscript>
        <style>{".rv{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      {/* Ukuran dasar 16px / 1.6 milik sigillum.html, hanya untuk landing (body global tetap 14px). */}
      <main className="city-main text-base leading-[1.6]">
        <Hero stats={data?.stats ?? null} />
        <Thesis />
        <Districts minds={data?.minds ?? []} />
        <Protocol />
        <Economy />
        <Charter />
        <LedgerPreview initialEvents={data?.events ?? []} />
        <Foundations />
        <Closing />
      </main>
    </>
  );
}
