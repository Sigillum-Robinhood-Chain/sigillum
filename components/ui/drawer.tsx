"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

const noopSubscribe = () => () => {};

/** Drawer sisi kanan (sigillum: `.drawer`): kaca gelap + blur 22px, garis emas di kiri,
 *  slide dari kanan, tombol tutup bulat.
 *  - `modal=false` (default, dipakai dashboard kota): tanpa backdrop & tanpa kunci scroll,
 *    jadi gedung lain / panel lain tetap bisa diklik saat drawer terbuka. Esc menutup.
 *  - `modal=true` (dipakai drawer Mind di landing): backdrop blur, klik di luar menutup, fokus
 *    terkunci, scroll halaman dikunci, dan sisa halaman diberi `inert` (pembaca layar & Tab
 *    tidak bisa menjangkau latar).
 *  Fokus dipindah ke tombol tutup saat terbuka dan dikembalikan ke pemicu saat tertutup.
 *  CP10: satu-satunya implementasi drawer (menggantikan salinan di landing/mind-drawer). */
export function Drawer({
  open,
  onClose,
  label,
  modal = false,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Nama dialog untuk pembaca layar. */
  label: string;
  modal?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  // onClose disimpan di ref: pemanggil boleh meneruskan fungsi baru tiap render tanpa
  // memicu effect (yang akan merebut ulang fokus dan salah mengingat pemicu).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  // false di server & saat hidrasi: portal ke <body> tidak memicu mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    if (modal) html.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    });

    // Modal: jadikan semua anak <body> selain dialog ini `inert`.
    const inerted: Element[] = [];
    if (modal) {
      const root = panelRef.current?.parentElement;
      for (const el of Array.from(document.body.children)) {
        if (el === root || el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.hasAttribute("inert")) continue;
        el.setAttribute("inert", "");
        inerted.push(el);
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (!modal || e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || !panelRef.current.contains(cur))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (cur === last || !panelRef.current.contains(cur))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      if (modal) html.style.overflow = prevOverflow;
      for (const el of inerted) el.removeAttribute("inert");
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [open, modal]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          className={cn("fixed inset-0 z-[60]", !modal && "pointer-events-none")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {modal && (
            <div
              aria-hidden
              onClick={() => onCloseRef.current()}
              className="absolute inset-0 bg-[rgba(5,7,13,0.55)] backdrop-blur-[6px]"
            />
          )}
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal={modal}
            aria-label={label}
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ duration: 0.55, ease: [0.2, 0.75, 0.2, 1] }}
            className={cn(
              "pointer-events-auto absolute inset-y-0 right-0 flex w-[min(430px,100vw)] flex-col overflow-y-auto border-l border-line bg-[rgba(5,8,14,0.86)] px-[30px] pt-[34px] pb-10 backdrop-blur-[22px]",
              className
            )}
          >
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Tombol tutup bulat drawer (sigillum: `.drawer .x`). Memegang fokus awal. */
export function DrawerClose({ onClick, label = "Close profile" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      data-autofocus
      onClick={onClick}
      aria-label={label}
      className="absolute top-[22px] right-[22px] grid size-[38px] place-items-center rounded-full border border-line-2 text-ink-2 transition-all duration-300 hover:border-gold hover:text-gold-2"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 5l14 14M19 5L5 19" />
      </svg>
    </button>
  );
}
