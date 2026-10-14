"use client";

import { useState, type CSSProperties } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Panel } from "@/components/ui/panel";
import { H2, Lede, Section } from "@/components/landing/section";
import { ECONOMY } from "@/components/landing/copy";
import { WAGE_SPLIT, WAGE_UNIT } from "@/lib/currency";

const R = 84;
const C = 2 * Math.PI * R;
const DEFAULT_WAGE = 100;
const SLIDER = { min: 10, max: 5000 };

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Ekonomi: kalkulator + donut interaktif (CP5). Slider mengubah nominal tiap bagian;
 *  hover/fokus segmen donut <-> baris legend saling menyorot dan teks tengah ikut berubah.
 *  Persen SELALU dari WAGE_SPLIT (lib/currency.ts), bukan angka hardcode. */
export function Economy() {
  const [wage, setWage] = useState(DEFAULT_WAGE);
  const [active, setActive] = useState<number | null>(null);
  const segs = ECONOMY.segments.map((s, i) => {
    const pct = WAGE_SPLIT[s.key];
    const before = ECONOMY.segments
      .slice(0, i)
      .reduce((sum, p) => sum + WAGE_SPLIT[p.key], 0);
    return {
      ...s,
      pct,
      len: (C * pct) / 100 - 3, // celah 3 satuan antar segmen (sigillum)
      offset: -((C * before) / 100),
      amount: (wage * pct) / 100,
    };
  });
  const fill = ((wage - SLIDER.min) / (SLIDER.max - SLIDER.min)) * 100;

  return (
    <Section id="economy">
      <div className="grid grid-cols-1 items-center gap-[clamp(30px,5vw,80px)] min-[1100px]:grid-cols-[1.05fr_1fr]">
        <div>
          <Eyebrow className="rv">{ECONOMY.eyebrow}</Eyebrow>
          <H2 parts={ECONOMY.title} />
          <Lede parts={ECONOMY.lede} />

          <Panel ticks className="rv d2 mt-[18px]">
            <div className="px-[30px] py-7">
              <label
                htmlFor="wage-sim"
                className="flex justify-between font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-3"
              >
                {ECONOMY.calcLabel}
                <b className="font-medium text-gold-2">
                  {fmt(wage)} {WAGE_UNIT}
                </b>
              </label>
              <input
                id="wage-sim"
                type="range"
                className="range-gold"
                min={SLIDER.min}
                max={SLIDER.max}
                step={10}
                value={wage}
                onChange={(e) => setWage(Number(e.target.value))}
                aria-label="SGUM amount"
                style={{ "--p": `${fill}%` } as CSSProperties}
              />
              <div className="grid grid-cols-2 gap-2.5 min-[560px]:grid-cols-4">
                {segs.map((s) => (
                  <div
                    key={s.key}
                    style={{ "--c": s.color } as CSSProperties}
                    className="border-t border-[var(--c)] pt-2.5"
                  >
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-3">
                      {s.label}
                    </span>
                    <b className="mt-1 block font-display text-[26px] font-normal">
                      {fmt(s.amount)}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <Panel ticks className="rv d1">
          <div className="grid grid-cols-1 items-center justify-items-center gap-[34px] p-9 min-[860px]:grid-cols-[auto_1fr] min-[860px]:justify-items-stretch">
            <svg
              viewBox="0 0 220 220"
              role="img"
              aria-label="Split of one sealed SGUM"
              className="block h-auto w-[min(260px,52vw)]"
            >
              <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(238,232,220,.06)" strokeWidth="16" />
              <g transform="rotate(-90 110 110)">
                {segs.map((s, i) => (
                  <circle
                    key={s.key}
                    cx="110"
                    cy="110"
                    r={R}
                    fill="none"
                    stroke={s.hex}
                    strokeWidth={active === i ? 15 : 10}
                    strokeDasharray={`${s.len} ${C - s.len}`}
                    strokeDashoffset={s.offset}
                    tabIndex={0}
                    aria-label={`${s.label} ${s.pct}%`}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-300"
                    style={{
                      filter: `drop-shadow(0 0 6px ${s.hex})`,
                      opacity: active === null || active === i ? 1 : 0.3,
                    }}
                  />
                ))}
              </g>
              <text x="110" y="104" textAnchor="middle" fill="#EEE8DC" fontFamily="var(--font-display)" fontSize="40">
                {active === null ? "100%" : `${segs[active].pct}%`}
              </text>
              <text x="110" y="128" textAnchor="middle" fill="rgba(238,232,220,.62)" fontFamily="var(--font-mono)" fontSize="8.5" letterSpacing="2.4">
                {active === null ? ECONOMY.donutLabel : segs[active].label.toUpperCase()}
              </text>
            </svg>

            <ul className="w-full list-none">
              {segs.map((s, i) => (
                <li
                  key={s.key}
                  style={{ "--c": s.color } as CSSProperties}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  className={`grid grid-cols-[12px_1fr_auto] transition-opacity duration-300 ${active !== null && active !== i ? "opacity-40" : ""} items-center gap-3 border-b border-line-2 py-[13px] text-sm text-ink-2 last:border-b-0`}
                >
                  <i aria-hidden className="size-2.5 rounded-[2px] bg-[var(--c)] shadow-[0_0_12px_var(--c)]" />
                  <span>
                    {s.label}
                    <small className="block text-xs text-ink-3">{s.note}</small>
                  </span>
                  <b className="font-mono text-[13px] font-medium text-ink">{s.pct}%</b>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
