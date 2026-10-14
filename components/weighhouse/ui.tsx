"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "good" | "warn" | "muted";

const TONE: Record<Tone, string> = {
  good: "border-good/40 text-good",
  warn: "border-warn/40 text-warn",
  muted: "border-line-2 text-ink-3",
};

/** Pill kecil bergaya mono. `tone` menentukan warna (good = hijau, warn = kuning). */
export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em]",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-3.5 py-6 text-center text-[12.5px] text-faint">{children}</p>;
}

/**
 * Tooltip rumus (brief §6: tiap angka punya hover tooltip berisi rumus + link Blockscout).
 * Muncul saat hover atau fokus keyboard; link ada di dalam tooltip.
 */
export function Tip({
  children,
  formula,
  href,
}: {
  children: ReactNode;
  formula: string;
  href?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-ink-3/60 uppercase outline-none focus-visible:text-gold-2"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-panel border border-line bg-surface p-2.5 text-left text-[11.5px] normal-case leading-snug tracking-normal text-ink-2 shadow-lg"
        >
          {formula}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block text-gold hover:underline"
            >
              View on Blockscout ↗
            </a>
          )}
        </span>
      )}
    </span>
  );
}
