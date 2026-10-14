"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { SiteMark } from "@/components/site-logo";

const MIN_MS = 1400; // tampil minimal, supaya tidak berkedip
const MAX_MS = 8000; // batas aman: tutup walau `ready` tak pernah true (sigillum: timeout 8 detik)
const FADE_MS = 1200;

/** Loader layar penuh (sigillum: `.loader`): segel berputar, bar bergerak, fade-out.
 *  - Tanpa prop `ready`: menutup sendiri setelah MIN_MS.
 *  - Dengan `ready`: menutup setelah `ready` true DAN MIN_MS lewat (mis. scene 3D siap).
 *  Hanya dipasang di halaman kota (`/`). Putaran/bar memakai `motion`, jadi otomatis
 *  mati bila OS meminta reduced-motion (MotionConfig di layout). */
export function Loader({ ready }: { ready?: boolean }) {
  const [minElapsed, setMinElapsed] = useState(false);
  const [forced, setForced] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setMinElapsed(true), MIN_MS);
    const b = setTimeout(() => setForced(true), MAX_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const done = forced || (minElapsed && ready !== false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), FADE_MS + 100);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={done}
      className={cn(
        "fixed inset-0 z-50 grid place-items-center bg-bg transition-[opacity,visibility] duration-[1200ms] ease-in-out",
        done && "invisible opacity-0"
      )}
    >
      <div className="text-center">
        <motion.div
          className="mx-auto mb-[22px] size-[54px] text-gold"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
        >
          <SiteMark className="size-full" strokeWidth={1.1} />
        </motion.div>
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-ink-3">
          Pressing the Sigil
        </div>
        <div className="mx-auto mt-[18px] h-px w-[180px] overflow-hidden bg-line-2">
          <motion.i
            className="block h-full w-2/5 bg-linear-to-r from-transparent via-gold to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "260%" }}
            transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}
