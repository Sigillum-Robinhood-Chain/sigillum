import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Part } from "@/components/landing/copy";

/** Kerangka section landing (sigillum: `.sec`). `hero` dan `foot` mengikuti `.hero` / `.foot`. */
export function Section({
  id,
  variant = "default",
  className,
  children,
}: {
  id?: string;
  variant?: "default" | "hero" | "foot";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative flex flex-col px-gutter",
        variant === "default" &&
          "min-h-screen justify-center pt-[110px] pb-[90px] min-[560px]:py-[140px]",
        variant === "hero" &&
          "min-h-screen justify-end pt-[110px] pb-14 min-[560px]:pt-[140px]",
        variant === "foot" &&
          "min-h-[90vh] justify-end pt-[110px] pb-10 min-[560px]:pt-[140px]",
        className
      )}
    >
      {children}
    </section>
  );
}

/** Render teks berformat dari copy.ts. */
export function Rich({ parts }: { parts: Part[] | string }) {
  if (typeof parts === "string") return <>{parts}</>;
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return <span key={i}>{p}</span>;
        if ("em" in p) return <em key={i}>{p.em}</em>;
        return (
          <em key={i} className="font-display text-[1.12em] italic text-gold-2">
            {p.i}
          </em>
        );
      })}
    </>
  );
}

/** Judul section (sigillum: h2). `<em>` di dalamnya otomatis italic emas. */
export function H2({
  parts,
  size = "default",
  className,
}: {
  parts: Part[];
  size?: "default" | "foot";
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "rv my-[22px] font-display font-normal tracking-[-0.012em] [&_em]:italic [&_em]:text-gold-2",
        size === "default"
          ? "max-w-[16ch] text-[clamp(40px,5.4vw,82px)] leading-[1.02]"
          : "max-w-[18ch] text-[clamp(44px,6.6vw,110px)] leading-[1.02]",
        className
      )}
    >
      <Rich parts={parts} />
    </h2>
  );
}

export function Lede({
  parts,
  className,
}: {
  parts: Part[] | string;
  className?: string;
}) {
  return (
    <p className={cn("rv d1 max-w-[56ch] text-[clamp(16px,1.25vw,19px)] text-ink-2", className)}>
      <Rich parts={parts} />
    </p>
  );
}

/** Label kecil mono di atas angka/judul kartu. */
export const MONO_LABEL = "font-mono uppercase text-ink-3";
