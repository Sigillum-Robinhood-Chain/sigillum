import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Label kecil mono uppercase dengan garis gradien emas di kiri (sigillum: .eyebrow).
 *  Gayanya ada di globals.css (`.eyebrow`). */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("eyebrow", className)}>{children}</span>;
}
