"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

// Gaya Sigillum (.btn di sigillum.html): pill, mono, uppercase, letter-spacing lebar.
// `default` dipertahankan sebagai nama lama dan tampil sama dengan `ghost`, supaya
// seluruh pemanggil lama (variant="primary", size="small") tidak perlu diubah.
export type ButtonVariant = "default" | "primary" | "ghost";
export type ButtonSize = "default" | "small" | "large";

const BASE =
  "group inline-flex items-center justify-center gap-2.5 rounded-full border font-mono font-medium uppercase transition-[color,border-color,box-shadow] duration-300 disabled:cursor-not-allowed disabled:opacity-50";

const GHOST =
  "border-line bg-transparent text-ink hover:border-gold hover:text-gold-2";

const VARIANT: Record<ButtonVariant, string> = {
  default: GHOST,
  ghost: GHOST,
  primary:
    "border-transparent bg-linear-to-b from-gold-2 to-gold text-gold-ink " +
    "shadow-[0_0_0_1px_rgba(240,220,176,0.3),0_10px_40px_-10px_rgba(214,182,118,0.55)] " +
    "hover:shadow-[0_0_0_1px_rgba(240,220,176,0.5),0_14px_50px_-8px_rgba(214,182,118,0.75)]",
};

// `large` = ukuran asli tombol di sigillum.html (untuk CTA hero/landing).
// `default` & `small` sengaja lebih ringkas supaya dashboard yang padat tidak membengkak.
const SIZE: Record<ButtonSize, string> = {
  small: "px-3 py-1.5 text-[10px] tracking-[0.16em]",
  default: "px-4 py-2.5 text-[11px] tracking-[0.18em]",
  large: "px-[22px] py-3.5 text-[11.5px] tracking-[0.18em]",
};

/** Kelas tombol untuk elemen selain <Button>, mis. <Link> atau <a> yang tampil seperti tombol. */
export function buttonClasses({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

/** Panah "→" yang bergeser sedikit saat tombol/tautan di-hover (sigillum: .btn .arr).
 *  Parent harus punya kelas `group` -- buttonClasses() & <Button> sudah menyertakannya. */
export function ButtonArrow() {
  return (
    <span
      aria-hidden
      className="transition-transform duration-300 group-hover:translate-x-[3px]"
    >
      →
    </span>
  );
}

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Tambahkan panah "→" di kanan label. */
  arrow?: boolean;
}

export function Button({
  variant = "default",
  size = "default",
  arrow = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {children as ReactNode}
      {arrow && <ButtonArrow />}
    </motion.button>
  );
}
