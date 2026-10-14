"use client";

import { useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  DAY_MODES,
  getDayMode,
  getServerDayMode,
  setDayMode,
  subscribeDayMode,
  type DayMode,
} from "@/lib/city/day-mode";

const ICON = "size-3.5";

const OPTIONS: { mode: DayMode; label: string; icon: ReactNode }[] = [
  {
    mode: "auto",
    label: "Auto",
    // Setengah matahari / setengah bulan: mengikuti jam lokal.
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className={ICON} fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    mode: "day",
    label: "Day",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className={ICON} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
      </svg>
    ),
  },
  {
    mode: "night",
    label: "Night",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className={ICON} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    ),
  },
];

/** Pemilih pencahayaan kota: Auto (jam lokal) / Day / Night. Pilihan disimpan per browser
 *  (lib/city/day-mode.ts) dan langsung dibaca scene 3D. Pola radiogroup: panah kiri/kanan
 *  memindah pilihan, Tab masuk/keluar grup sekali. */
export function DayToggle({ className }: { className?: string }) {
  const mode = useSyncExternalStore(subscribeDayMode, getDayMode, getServerDayMode);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = DAY_MODES[(DAY_MODES.indexOf(mode) + step + DAY_MODES.length) % DAY_MODES.length];
    setDayMode(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="City lighting"
      onKeyDown={onKey}
      className={cn(
        "panel-glass pointer-events-auto fixed right-[max(16px,var(--spacing-gutter))] bottom-4 z-30 flex gap-0.5 rounded-full p-1",
        className
      )}
    >
      {OPTIONS.map((o) => {
        const on = mode === o.mode;
        return (
          <button
            key={o.mode}
            ref={(el) => {
              refs.current[o.mode] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => setDayMode(o.mode)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-300",
              on ? "bg-gold/15 text-gold-2" : "text-ink-3 hover:text-ink"
            )}
          >
            {o.icon}
            <span className="max-[420px]:sr-only">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
