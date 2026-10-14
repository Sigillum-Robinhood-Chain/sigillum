"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useActiveSection } from "@/components/landing/use-active-section";

export const NAV_LINKS = [
  { href: "/", label: "The City" },
  { href: "/jobs", label: "Job Board" },
  { href: "/weighhouse", label: "Weighhouse" },
] as const;

/** Di `/` nav memuat anchor section landing (CP5) yang menyala saat section-nya di layar. */
const LANDING_LINKS = [
  { href: "#districts", label: "Districts", section: "districts" },
  { href: "#economy", label: "Economy", section: "economy" },
  { href: "#ledger", label: "Ledger", section: "ledger" },
  { href: "/jobs", label: "Jobs" },
  { href: "/weighhouse", label: "Weighhouse" },
] as const;

export interface NavItem {
  href: string;
  label: string;
  section?: string;
}

export function navItemsFor(pathname: string): readonly NavItem[] {
  return pathname === "/" ? LANDING_LINKS : NAV_LINKS;
}

export function isNavActive(pathname: string, href: string, activeSection?: string | null, section?: string) {
  if (section) return activeSection === section;
  if (href.startsWith("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Hook gabungan untuk SiteNav & menu mobile: daftar link + section aktif. */
export function useNavState() {
  const pathname = usePathname();
  const items = navItemsFor(pathname);
  const active = useActiveSection(
    LANDING_LINKS.flatMap((l) => ("section" in l ? [l.section] : [])),
    pathname === "/"
  );
  return { pathname, items, active };
}

/** Nav desktop di header (sigillum: `.nav ul`): mono 11px uppercase, link aktif emas.
 *  Disembunyikan di bawah 860px -- di sana SiteHeader menampilkan menu ringkas. */
export function SiteNav() {
  const { pathname, items, active } = useNavState();

  return (
    <nav aria-label="Primary" className="hidden min-[860px]:block">
      <ul className="flex gap-[clamp(18px,2.4vw,30px)]">
        {items.map((l) => {
          const on = isNavActive(pathname, l.href, active, "section" in l ? l.section : undefined);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={on ? (l.href.startsWith("#") ? "location" : "page") : undefined}
                className={cn(
                  "font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 hover:text-gold-2",
                  on ? "text-gold-2" : "text-ink-3"
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
