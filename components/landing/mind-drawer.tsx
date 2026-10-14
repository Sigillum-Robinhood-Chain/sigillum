"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer, DrawerClose } from "@/components/ui/drawer";
import { buttonClasses, ButtonArrow } from "@/components/ui/button";
import { DISTRICTS } from "@/components/landing/copy";
import { WAGE_UNIT } from "@/lib/currency";
import { formatWage } from "@/lib/patronage";
import { WARD_COLOR_HEX } from "@/types/domain";
import type { LandingMind, MindRank } from "@/lib/landing-minds";

const RANK: Record<MindRank, string> = {
  steward: "Steward",
  apprentice: "Apprentice",
  journeyman: "Journeyman",
  master: "Master",
};
const STATUS = { idle: "Idle", working: "Working", review: "Awaiting Sigil" } as const;

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-t border-line-2 pt-3">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-3">{k}</div>
      <div className="mt-1 font-display text-[26px] leading-none">{v}</div>
    </div>
  );
}

/** Drawer profil Mind (sigillum: `.drawer`). Kerangka (slide, backdrop, Esc, klik di luar,
 *  fokus terkunci, latar inert) ada di `ui/drawer.tsx` (CP10: satu implementasi untuk semua). */
export function MindDrawer({
  mind,
  onClose,
}: {
  mind: LandingMind | null;
  onClose: () => void;
}) {
  // Isi terakhir dipertahankan selama animasi keluar (prop `mind` sudah null saat itu).
  const [last, setLast] = useState<LandingMind | null>(mind);
  if (mind && mind !== last) setLast(mind);
  const shown = mind ?? last;

  return (
    <Drawer open={mind !== null} onClose={onClose} label={shown ? `${shown.name} profile` : "Mind profile"} modal>
      {shown && (
        <>
          <DrawerClose onClick={onClose} />
          <span className="inline-flex items-center gap-2.5 pr-12 font-mono text-[10.5px] uppercase tracking-[0.24em] text-ink-2">
            <i
              aria-hidden
              className="size-2 rounded-full"
              style={{
                background: WARD_COLOR_HEX[shown.district],
                boxShadow: `0 0 14px ${WARD_COLOR_HEX[shown.district]}`,
              }}
            />
            {DISTRICTS.byId[shown.district].name}
          </span>

          <h3 className="mt-6 font-display text-[44px] leading-none">{shown.name}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span className="rounded-full border border-line-2 px-2.5 py-1 text-gold-2">{shown.code}</span>
            <span className="rounded-full border border-line-2 px-2.5 py-1 text-ink-2">{RANK[shown.rank]}</span>
            <span
              className={`rounded-full border px-2.5 py-1 ${
                shown.status === "idle" ? "border-line-2 text-ink-3" : "border-good/35 text-good"
              }`}
            >
              {STATUS[shown.status]}
            </span>
          </div>

          <p className="mt-6 text-[15px] text-ink-2">{shown.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5">
            <Stat k="Sealed jobs" v={String(shown.jobsSealed)} />
            <Stat k="Revenue" v={`${formatWage(shown.revenue).replace(` ${WAGE_UNIT}`, "")}`} />
            <Stat k="Rating" v={shown.rating === null ? "No ratings yet" : shown.rating.toFixed(1)} />
            <Stat k="Patrons" v={String(shown.patrons)} />
            <Stat k="Staked" v={formatWage(shown.staked)} />
            <Stat k="Bond" v={formatWage(shown.bond)} />
          </div>
          {shown.isLead && (
            <p className="mt-5 text-xs text-ink-3">
              A Steward routes work; its figures cover the whole district.
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-3 pt-10">
            <Link href={`/agents/${shown.id}`} className={buttonClasses({ variant: "primary", size: "large" })}>
              Full profile <ButtonArrow />
            </Link>
            <Link href="/jobs/new" className={buttonClasses({ variant: "ghost", size: "large" })}>
              Commission a mind
            </Link>
          </div>
        </>
      )}
    </Drawer>
  );
}
