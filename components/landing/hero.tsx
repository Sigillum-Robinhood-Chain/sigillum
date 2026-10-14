import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Panel } from "@/components/ui/panel";
import { buttonClasses, ButtonArrow } from "@/components/ui/button";
import { Lede, Rich, Section } from "@/components/landing/section";
import { CountUp } from "@/components/landing/count-up";
import { HERO } from "@/components/landing/copy";
import type { LandingStats } from "@/lib/landing-stats";

/** `stats` = null bila Supabase tidak terjangkau: angka tampil "—", halaman tetap terbuka. */
export function Hero({ stats }: { stats: LandingStats | null }) {
  return (
    <Section id="top" variant="hero">
      <Eyebrow className="rv">{HERO.eyebrow}</Eyebrow>
      <h1 className="my-[26px] max-w-[13.5ch] font-display text-[clamp(46px,7.4vw,124px)] font-normal leading-[0.96] tracking-[-0.012em] [&_em]:italic [&_em]:text-gold-2">
        <Rich parts={HERO.title} />
      </h1>
      <Lede parts={HERO.lede} className="max-w-[52ch]" />

      <div className="mt-[34px] flex flex-wrap gap-3.5">
        <Link href="/jobs/new" className={buttonClasses({ variant: "primary", size: "large" })}>
          {HERO.primaryCta} <ButtonArrow />
        </Link>
        <a href="#districts" className={buttonClasses({ variant: "ghost", size: "large" })}>
          {HERO.ghostCta}
        </a>
      </div>

      <div className="mt-7 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.24em] text-ink-3">
        <i
          aria-hidden
          className="size-1.5 animate-beacon rounded-full bg-gold shadow-[0_0_12px_var(--color-gold)]"
        />
        {HERO.hint}
      </div>

      <Panel ticks className="rv d3 mt-16">
        <div className="grid grid-cols-2 min-[860px]:grid-cols-5">
          {HERO.stats.map((s) => {
            const value = stats ? stats[s.key] : null;
            // "Minds at work" tampil "3 / 20": total = jumlah mind sebenarnya, bukan angka tetap.
            const unit = s.key === "working" ? (stats ? `/ ${stats.total}` : "") : s.unit;
            return (
              <div
                key={s.key}
                className="col-span-1 border-b border-line-2 px-6 py-[22px] odd:border-r last:col-span-2 last:border-r-0 min-[860px]:border-b-0 min-[860px]:border-r min-[860px]:last:col-span-1"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-3">
                  {s.k}
                </div>
                <div className="mt-2 font-display text-[clamp(30px,2.8vw,44px)] leading-[1.1]">
                  {value === null ? (
                    <span aria-label="not available">—</span>
                  ) : (
                    <CountUp key={value} value={value} />
                  )}
                  {unit && (
                    <small className="ml-1.5 font-mono text-[11px] tracking-[0.14em] text-gold">
                      {unit}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </Section>
  );
}
