import { TERMS } from "@/lib/terms";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { PageHead } from "@/components/ui/page-head";
import { Button } from "@/components/ui/button";
import { PostJobClient } from "@/components/post-job-client";
import { createClient } from "@/lib/supabase/server";
import { listAgents } from "@/lib/supabase/queries";
import { WARD_LABEL } from "@/types/domain";
import type { DistrictId } from "@/types/domain";
import { MotionHeader, MotionPage } from "@/components/motion/primitives";
import { SiteFooter } from "@/components/site-footer";

const VALID_DISTRICTS = Object.keys(WARD_LABEL) as DistrictId[];

export default async function PostJobPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; agent?: string }>;
}) {
  const { district, agent } = await searchParams;

  // Bangunan yang bisa di-hire langsung: Wright saja (Warden hanya me-routing).
  const supabase = await createClient();
  const { data: agentRows } = await listAgents(supabase);
  const buildings = (agentRows ?? [])
    .filter((a) => !a.is_lead)
    .map((a) => ({ id: a.id, name: a.name, code: a.code, district: a.district }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Datang dari tombol "Hire {nama}" (?agent=) -- prefill bangunan sekaligus Ward-nya.
  // ?district= (Warden / link lama) hanya mem-prefill Ward. Nilai tidak valid diabaikan
  // diam-diam (lihat catatan di PostJobForm).
  const hired = buildings.find((b) => b.id === agent);
  const initialAgentId = hired?.id;
  const initialDistrict = hired
    ? hired.district
    : VALID_DISTRICTS.includes(district as DistrictId)
      ? (district as DistrictId)
      : undefined;

  return (
    <MotionPage className="flex h-screen flex-col gap-3 px-gutter pt-[78px] pb-3">

      <div className="flex flex-1 items-start justify-center overflow-auto py-2">
        <div className="w-full max-w-xl">
          {/* Clarity rule (lore file §8): pertama kali istilah lore muncul
              di layar, sandingkan dengan arti polosnya (jadi lede di bawah). */}
          <MotionHeader className="mb-5">
            <PageHead
              eyebrow="The Gate"
              title={
                <>
                  Post a <em>job</em>
                </>
              }
              lede="The Gate: where clients enter to post jobs. The wage locks in the Vault (escrow) the moment you submit, and stays there until a Mind delivers and you press the Sigil."
              action={
                <Link href="/jobs">
                  <Button size="small">Cancel</Button>
                </Link>
              }
            />
          </MotionHeader>
          <Panel ticks>
            <PostJobClient
              initialDistrict={initialDistrict}
              initialAgentId={initialAgentId}
              buildings={buildings}
            />
          </Panel>
        </div>
      </div>

      <SiteFooter note={TERMS.footerNote} />
    </MotionPage>
  );
}
