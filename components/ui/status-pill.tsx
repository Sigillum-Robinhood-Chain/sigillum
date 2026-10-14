"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import type { AgentStatus } from "@/types/domain";

const LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  working: "Working",
  review: "Awaiting Sigil",
};

export function StatusPill({ status }: { status: AgentStatus }) {
  const reduce = useReducedMotion();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em]",
        status === "idle" && "border-line-2 text-ink-3",
        status === "working" && "border-good/35 text-good",
        status === "review" && "border-warn/40 text-warn"
      )}
    >
      {status !== "idle" && (
        <motion.span
          aria-hidden
          className="size-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]"
          animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
          transition={{ duration: status === "working" ? 1.2 : 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {LABEL[status]}
    </span>
  );
}
