"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Panel } from "@/components/ui/panel";

export interface Stat {
  label: string;
  value: string;
  /** Satuan kecil emas di belakang angka (sigillum: `.stat .v small`), mis. "WAGE". */
  unit?: string;
  /** Angka beraksen emas (mis. WAGE yang terkunci di Vault). */
  gold?: boolean;
  /** Angka beraksen ember (mis. yang dibakar di Reactor). */
  crit?: boolean;
}

/** Nilai yang bergulir saat berubah (mis. lewat Realtime): angka lama naik keluar, angka baru
 *  naik masuk. `initial={false}` = render awal tanpa animasi. */
function RollingValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span className="relative flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-70%", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={className}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Deretan statistik.
 * - `hud` (default, gaya sigillum `.stat`): panel kaca bertick emas, sel dipisah garis,
 *   label mono kecil, angka serif besar, satuan emas. Dipakai HUD City Dashboard.
 * - `inline`: baris ringkas tanpa panel, untuk di dalam panel lain (profil Mind).
 */
export function StatBar({
  stats,
  variant = "hud",
  className,
}: {
  stats: Stat[];
  variant?: "hud" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex w-full flex-nowrap gap-x-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:ml-auto sm:w-auto sm:flex-wrap sm:gap-y-2 sm:overflow-visible sm:pb-0",
          className
        )}
      >
        {stats.map((s) => (
          <div key={s.label} className="flex shrink-0 flex-col whitespace-nowrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
              {s.label}
            </span>
            <RollingValue
              value={s.unit ? `${s.value} ${s.unit}` : s.value}
              className={cn(
                "font-mono text-[15px] tabular-nums",
                s.gold ? "text-gold" : s.crit ? "text-ember" : "text-ink"
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  const odd = stats.length % 2 === 1;
  return (
    <Panel ticks className={className}>
      <div className="grid grid-cols-2 min-[860px]:grid-flow-col min-[860px]:auto-cols-fr">
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "min-w-0 border-b border-line-2 px-5 py-3.5 odd:border-r min-[860px]:border-b-0 min-[860px]:border-r min-[860px]:last:border-r-0",
              odd && "last:col-span-2 last:border-r-0 min-[860px]:last:col-span-1"
            )}
          >
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.24em] text-ink-3">
              {s.label}
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <RollingValue
                value={s.value}
                className={cn(
                  "font-display text-[clamp(24px,2.3vw,34px)] leading-[1.15] tabular-nums",
                  s.gold ? "text-gold-2" : s.crit ? "text-ember" : "text-ink"
                )}
              />
              {s.unit && (
                <small className="font-mono text-[10.5px] tracking-[0.14em] text-gold">
                  {s.unit}
                </small>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
