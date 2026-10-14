import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChipProps {
  children: ReactNode;
  variant?: "default" | "rank" | "sigil";
  className?: string;
}

/** Gaya Sigillum (.chips span): pill outline tipis, mono kecil. */
export function Chip({ children, variant = "default", className }: ChipProps) {
  if (variant === "sigil") {
    return (
      <span
        className={cn(
          "font-mono text-xs tracking-[0.22em] text-gold",
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.1em]",
        variant === "default" && "border-line-2 text-ink-2",
        variant === "rank" && "border-gold/40 text-gold",
        className
      )}
    >
      {children}
    </span>
  );
}
