"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { itemVariants } from "@/components/motion/primitives";

/** Panel ikut animasi stagger kalau berada di dalam <MotionPage>. Di luar itu
 *  (mis. /dev/components) dia tidak beranimasi sama sekali.
 *
 *  Gaya Sigillum (.panel di sigillum.html):
 *  - `glass` (default): latar transparan + blur, dirancang untuk melayang di atas scene 3D.
 *  - `solid`: latar buram `surface`, untuk daftar padat / form yang butuh keterbacaan penuh.
 *  - `ticks`: tick emas di pojok kiri-atas & kanan-bawah. */
export function Panel({
  children,
  className,
  variant = "glass",
  ticks = false,
}: {
  children: ReactNode;
  className?: string;
  variant?: "glass" | "solid";
  ticks?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "flex min-h-0 flex-col rounded-panel",
        variant === "glass"
          ? "panel-glass"
          : "relative border border-line-2 bg-surface",
        // Tick digambar di -1px (di atas border), jadi tidak boleh terpotong
        // overflow-hidden milik panel itu sendiri. Saat ticks aktif, pemotongan
        // dipindah ke pembungkus di dalam (lihat bawah).
        ticks ? "ticks" : "overflow-hidden",
        className
      )}
    >
      {ticks ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}

export function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line-2 px-3.5 py-3">
      <h2 className="font-display text-[19px] font-normal leading-none tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Wadah scroll di dalam Panel — dipakai untuk daftar panjang (job list, roster).
 *  `layoutScroll` wajib supaya animasi `layout` anak-anaknya tetap akurat saat
 *  daftar sedang di-scroll (dipakai Ledger Wall). */
export function PanelScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div layoutScroll className={cn("min-h-0 flex-1 overflow-auto", className)}>
      {children}
    </motion.div>
  );
}
