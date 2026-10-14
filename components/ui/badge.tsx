import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Gaya Sigillum (.step .tag): pill outline, mono 9.5px, uppercase, spasi lebar. */
export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border border-line-2 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-3",
        className
      )}
    >
      {children}
    </span>
  );
}
