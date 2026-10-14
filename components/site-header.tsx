"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { X_URL, GITHUB_URL } from "@/lib/social";
import { buttonClasses } from "@/components/ui/button-styles";
import { ButtonArrow } from "@/components/ui/button";
import { SiteLogo } from "@/components/site-logo";
import { SiteNav, useNavState, isNavActive } from "@/components/site-nav";
import { WalletConnect } from "@/components/wallet-connect";

/** True setelah halaman di-scroll melewati `threshold` px (sigillum: `.nav.solid`).
 *  Halaman aplikasi memakai kontainer `overflow-auto` sendiri (bukan scroll window),
 *  jadi event `scroll` didengar dengan capture agar scroll kontainer dalam ikut terbaca. */
function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target;
      const y = t instanceof Element ? t.scrollTop : window.scrollY;
      setScrolled(y > threshold || window.scrollY > threshold);
    };
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [threshold]);

  return scrolled;
}

const ICON_BTN =
  "hdr-btn grid size-[38px] shrink-0 place-items-center rounded-full border border-line-2 text-ink-2 transition-all duration-300 hover:border-gold hover:text-gold-2";

function IconLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(ICON_BTN, className)}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5">
        {children}
      </svg>
    </a>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <IconLink href={X_URL} label="Sigillum on X" className={className}>
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2Zm-1.1 18.1h1.7L6.3 3.8H4.5l13.3 16.3Z" />
    </IconLink>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <IconLink href={GITHUB_URL} label="Source on GitHub" className={className}>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </IconLink>
  );
}

/** Header global (di `app/layout.tsx`): fixed, transparan di atas lalu solid + blur
 *  setelah scroll > 40px. Halaman tidak lagi merender logo/nav/wallet sendiri;
 *  cukup beri `pt-[78px]` pada kontainer halaman. */
export function SiteHeader() {
  const pathname = usePathname();
  const { items: navItems, active: activeSection } = useNavState();
  const scrolled = useScrolled();
  // Menu mobile "terbuka untuk path ini": otomatis menutup saat pindah halaman.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const menuOpen = openFor === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "site-header fixed inset-x-0 top-0 z-40 border-b px-gutter transition-[background-color,border-color,padding] duration-500",
        scrolled || menuOpen
          ? "border-line-2 bg-[rgba(5,7,13,0.72)] py-3.5 backdrop-blur-[18px]"
          : "border-transparent py-5"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <SiteLogo />
        <SiteNav />

        <div className="flex min-w-0 items-center gap-3.5">
          <XIcon className="hidden min-[560px]:grid" />
          <GithubIcon className="hidden min-[560px]:grid" />
          <WalletConnect />
          <Link
            href="/jobs/new"
            className={buttonClasses({
              variant: "primary",
              size: "small",
              className: "hidden min-[560px]:inline-flex",
            })}
          >
            Post a job <ButtonArrow />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setOpenFor(menuOpen ? null : pathname)}
            className={cn(ICON_BTN, "min-[860px]:hidden")}
          >
            <span aria-hidden className="relative block h-2.5 w-3.5">
              <span
                className={cn(
                  "absolute left-0 h-px w-full bg-current transition-all duration-300",
                  menuOpen ? "top-1/2 rotate-45" : "top-0"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-px w-full bg-current transition-all duration-300",
                  menuOpen ? "top-1/2 -rotate-45" : "bottom-0"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="mt-3.5 flex flex-col gap-1 border-t border-line-2 pt-3 min-[860px]:hidden"
        >
          {navItems.map((l) => {
            const active = isNavActive(pathname, l.href, activeSection, l.section);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpenFor(null)}
                aria-current={active ? (l.href.startsWith("#") ? "location" : "page") : undefined}
                className={cn(
                  "py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors hover:text-gold-2",
                  active ? "text-gold-2" : "text-ink-2"
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="flex items-center gap-3 pt-2 pb-1">
            <Link
              href="/jobs/new"
              className={buttonClasses({ variant: "primary", size: "small" })}
            >
              Post a job <ButtonArrow />
            </Link>
            <XIcon className="min-[560px]:hidden" />
            <GithubIcon className="min-[560px]:hidden" />
          </div>
        </nav>
      )}
    </header>
  );
}