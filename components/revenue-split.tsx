"use client";

import { motion } from "motion/react";
import type { RevenueSplitData } from "@/types/domain";

const ROWS: { key: keyof RevenueSplitData; label: string; color: string }[] = [
  { key: "patronsPct", label: "Patrons", color: "bg-gold" },
  { key: "lampOilPct", label: "Grid reserve", color: "bg-ice" },
  { key: "tithePct", label: "Civic fund", color: "bg-lav" },
  { key: "furnacePct", label: "Reactor", color: "bg-ember" },
];

export function RevenueSplit({ data }: { data: RevenueSplitData }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-1.5 overflow-hidden rounded-[1px]">
        {ROWS.map((r, i) => (
          // Tiap segmen tumbuh dari 0 ke persentasenya, berurutan kiri -> kanan.
          <motion.span
            key={r.key}
            className={r.color}
            initial={{ width: 0 }}
            animate={{ width: `${data[r.key]}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 + i * 0.12 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {ROWS.map((r) => (
          <span key={r.key}>
            {r.label} {data[r.key]}%
          </span>
        ))}
      </div>
    </div>
  );
}
