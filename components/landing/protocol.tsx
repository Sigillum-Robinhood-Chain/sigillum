import { Eyebrow } from "@/components/ui/eyebrow";
import { H2, Lede, Section } from "@/components/landing/section";
import { PROTOCOL } from "@/components/landing/copy";
import { WAGE_SPLIT } from "@/lib/currency";
import { cn } from "@/lib/cn";

const SPLIT_TEXT = [
  WAGE_SPLIT.patronsPct,
  WAGE_SPLIT.lampOilPct,
  WAGE_SPLIT.tithePct,
  WAGE_SPLIT.furnacePct,
].join(" / ");

export function Protocol() {
  return (
    <Section id="protocol">
      <Eyebrow className="rv">{PROTOCOL.eyebrow}</Eyebrow>
      <H2 parts={PROTOCOL.title} />
      <Lede parts={PROTOCOL.lede} />
      <ol className="relative mt-[60px] grid list-none grid-cols-2 gap-y-10 min-[560px]:grid-cols-3 min-[1100px]:grid-cols-6 min-[1100px]:gap-y-0">
        {/* Garis timeline + cahaya yang mengalir: hanya saat 6 kolom sebaris */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[21px] hidden h-px bg-[linear-gradient(90deg,transparent,var(--color-line)_8%,var(--color-line)_92%,transparent)] min-[1100px]:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-5 left-0 hidden h-[3px] w-[14%] animate-flow bg-[linear-gradient(90deg,transparent,var(--color-gold-2),transparent)] blur-[0.5px] min-[1100px]:block"
        />
        {PROTOCOL.steps.map((s, i) => (
          <li key={s.n} className={`rv d${Math.min(i, 5)} relative pr-[22px]`}>
            <div
              className={cn(
                "relative z-[1] grid size-[43px] place-items-center rounded-full border bg-bg font-mono text-[11px] text-gold",
                s.key
                  ? "border-gold shadow-[0_0_24px_-4px_var(--color-gold)]"
                  : "border-line"
              )}
            >
              {s.n}
            </div>
            <h4 className="mt-[22px] mb-2 font-display text-[25px] font-normal leading-[1.1]">
              {s.title}
            </h4>
            <p className="text-sm text-ink-2">{s.body.replace("{SPLIT}", SPLIT_TEXT)}</p>
            <span className="mt-3 inline-block rounded-full border border-line-2 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-3">
              {s.tag}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  );
}
