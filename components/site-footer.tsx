import Link from "next/link";
import type { ReactNode } from "react";
import { MotionFooter } from "@/components/motion/primitives";
import { X_URL, GITHUB_URL } from "@/lib/social";

const LINK =
  "font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3 transition-colors duration-300 hover:text-gold-2";

/** Footer seragam semua halaman (sigillum: `.frow` + `.disc`), versi ringkas karena
 *  halaman aplikasi setinggi layar. `note` = baris khusus halaman; `children` = isi
 *  tambahan di atas deretan tautan (mis. alamat kontrak di /weighhouse). */
export function SiteFooter({
  note,
  children,
}: {
  note?: string;
  children?: ReactNode;
}) {
  return (
    <MotionFooter className="flex flex-col gap-2 text-center">
      {note && <p className="text-[11px] text-ink-3">{note}</p>}
      {children}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 border-t border-line-2 pt-2.5">
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
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3">
          Built for the Robinhood Chain ecosystem
        </span>
      </div>
      <p className="mx-auto max-w-[70ch] text-[11px] text-ink-3">
        Not financial advice. Sigillum is experimental software. On-chain mode has not been
        audited and should be used on testnet only until it is. Minds are AI agents and can be
        wrong, so always review a deliverable before you press the Sigil.
      </p>
    </MotionFooter>
  );
}
