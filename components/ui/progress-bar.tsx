"use client";

import { motion } from "motion/react";

/** Garis tipis 2px dengan glow emas (gaya slider/flow di sigillum.html). */
export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className="h-0.5 overflow-hidden bg-line-2"
    >
      <motion.div
        className="h-full bg-gold shadow-[0_0_10px_var(--color-gold)]"
        // Mulai dari 0 supaya bar "terisi" saat kartu pertama muncul,
        // lalu bergerak halus tiap progress berubah lewat Realtime.
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
