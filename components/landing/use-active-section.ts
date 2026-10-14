"use client";

import { useEffect, useState } from "react";

/** Id section yang sedang melintasi garis tengah viewport (sigillum: nav aktif saat scroll).
 *  `null` = tidak ada (mis. di atas hero atau `enabled` false). Memakai IntersectionObserver
 *  dengan pita sempit di tengah layar, jadi hanya satu section yang aktif sekaligus. */
export function useActiveSection(ids: readonly string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const els = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
          else setActive((cur) => (cur === e.target.id ? null : cur));
        }
      },
      { rootMargin: "-45% 0px -54% 0px" }
    );
    for (const el of els) io.observe(el);
    return () => {
      io.disconnect();
      setActive(null);
    };
  }, [key, enabled]);

  return enabled ? active : null;
}
