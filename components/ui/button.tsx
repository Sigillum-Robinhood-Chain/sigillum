"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button-styles";

export type { ButtonSize, ButtonVariant };

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
