import Link from "next/link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buttonClasses, ButtonArrow } from "@/components/ui/button";
import { H2, Section } from "@/components/landing/section";
import { CLOSING } from "@/components/landing/copy";
import { X_URL, GITHUB_URL } from "@/lib/social";

const LINK =
  "font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3 transition-colors duration-300 hover:text-gold-2";

/** Penutup + footer besar landing (sigillum: `footer.foot`). Halaman aplikasi lain
 *  memakai SiteFooter yang ringkas. */
export function Closing() {
  return (
    <Section id="end" variant="foot">
      <Eyebrow className="rv">{CLOSING.eyebrow}</Eyebrow>
      <H2 parts={CLOSING.title} size="foot" />
      <div className="rv d1 mt-3 flex flex-wrap gap-3.5">
        <Link href="/jobs/new" className={buttonClasses({ variant: "primary", size: "large" })}>
          {CLOSING.primaryCta} <ButtonArrow />
        </Link>
        <Link href="/weighhouse" className={buttonClasses({ variant: "ghost", size: "large" })}>
          {CLOSING.ghostCta}
        </Link>
      </div>

      <footer className="mt-[70px] border-t border-line-2 pt-[26px]">
        <div className="flex flex-wrap items-end justify-between gap-[30px]">
          <div className="flex flex-wrap gap-[26px]">
            <Link href="/jobs" className={LINK}>
              Job board
            </Link>
            <Link href="/weighhouse" className={LINK}>
              Weighhouse
            </Link>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
              X / Twitter
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
              GitHub
            </a>
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3">
            {CLOSING.built}
          </div>
        </div>
        <p className="mt-[22px] max-w-[70ch] text-[12.5px] text-ink-3">{CLOSING.disclaimer}</p>
      </footer>
    </Section>
  );
}
