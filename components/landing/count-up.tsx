"use client";

import { useEffect, useRef } from "react";

const DELAY_MS = 900; // sigillum: mulai +0,9 dtk (setelah loader)
const DURATION_MS = 1800;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

function decimalsOf(n: number) {
  return Number.isInteger(n) ? 0 : 2;
}

/** Angka hero yang menghitung naik dari 0 ke `value` (ease-out kuartik 1,8 dtk).
 *  Nilai akhir sudah ada di HTML hasil SSR (tanpa JS / reduced-motion tetap benar);
 *  animasi hanya menulis `textContent` span ini, jadi tidak ada state React dan tidak ada
 *  hydration mismatch. Beri `key={value}` di pemanggil bila nilainya bisa berubah. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const decimals = decimalsOf(value);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let timer = 0;
    el.textContent = fmt(0);
    timer = window.setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / DURATION_MS);
        el.textContent = fmt(value * easeOutQuart(p));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      el.textContent = fmt(value);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fmt hanya bergantung pada `decimals` (turunan value)
  }, [value]);

  return <span ref={ref}>{fmt(value)}</span>;
}
