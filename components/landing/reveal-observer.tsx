"use client";

import { useEffect } from "react";

/** Reveal on scroll (sigillum: `.rv` -> `.rv.in`). Menambahkan kelas `in` sekali per elemen
 *  saat masuk viewport. Tanpa JS / IntersectionObserver, atau saat reduced-motion, elemen
 *  tetap tampil (lihat globals.css dan <noscript> di app/page.tsx).
 *  Elemen `.rv` harus punya className yang konstan: React tidak menulis ulang atribut yang
 *  nilainya tidak berubah, jadi kelas `in` aman. */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".rv:not(.in)"));
    if (els.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      for (const el of els) el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

  return null;
}
