"use client";

import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Panel, PanelScroll } from "@/components/ui/panel";
import { formatClockUTC } from "@/components/landing/ledger-events";
import { cn } from "@/lib/cn";

/** Satu baris Ledger Wall. Semua teks, tidak ada HTML: judul job diisi bebas oleh user dan
 *  React meng-escape-nya, jadi tidak perlu escape manual / dangerouslySetInnerHTML. */
export interface LedgerRow {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Badge tipe (Vault, Sigil, Reactor, ...). */
  label: string;
  /** Warna badge (nilai CSS: var(--color-*) atau hex). */
  color: string;
  text: string;
  /** Baris pribadi user ini ("You earned ..."): diberi aksen emas. */
  mine?: boolean;
}

/** Ledger Wall (sigillum: `.feed`): header mono + penanda live, tiap baris = waktu mono (UTC),
 *  badge tipe berwarna berbentuk pill, lalu teks. Event baru turun dari atas dengan kilau emas
 *  yang memudar; render awal dari server tidak dianimasikan. */
export function LedgerWall({
  events,
  className,
}: {
  events: LedgerRow[];
  className?: string;
}) {
  return (
    <Panel ticks className={cn(className)}>
      <div className="flex items-center justify-between border-b border-line-2 px-5 py-3.5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-ink-3">
          Ledger Wall · UTC
        </span>
        <span className="inline-flex items-center gap-[7px] font-mono text-[10px] uppercase tracking-[0.2em] text-ice">
          <i
            aria-hidden
            className="size-1.5 animate-beacon rounded-full bg-ice shadow-[0_0_10px_var(--color-ice)]"
          />
          Live
        </span>
      </div>
      <PanelScroll>
        {events.length === 0 ? (
          <p className="px-5 py-7 text-center text-[13px] text-ink-3">
            Nothing carved into the wall yet.
          </p>
        ) : (
          <ol className="list-none">
            {/* `layout="position"`: baris lain bergeser halus saat event baru masuk di atas. */}
            <AnimatePresence initial={false}>
              {events.map((e, i) => (
                <motion.li
                  key={e.id}
                  layout="position"
                  initial={{ opacity: 0, y: -14, backgroundColor: "rgba(214,182,118,0.08)" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "rgba(214,182,118,0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
                  style={{ "--c": e.color } as CSSProperties}
                  className={cn(
                    "grid grid-cols-[58px_74px_1fr] gap-x-3 border-b border-line-2 px-5 py-3 text-[13px] leading-[1.5] text-ink-2",
                    e.mine && "shadow-[inset_2px_0_0_var(--color-gold)]"
                  )}
                  {...(i === 0 ? { "data-latest": true } : {})}
                >
                  <time
                    dateTime={e.at}
                    className="pt-0.5 font-mono text-[10.5px] text-ink-3"
                  >
                    {formatClockUTC(e.at)}
                  </time>
                  <span className="self-start rounded-full border border-[color-mix(in_srgb,var(--c)_40%,transparent)] py-[3px] text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--c)]">
                    {e.label}
                  </span>
                  <span className={cn(e.mine && "text-ink")}>{e.text}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </PanelScroll>
    </Panel>
  );
}
