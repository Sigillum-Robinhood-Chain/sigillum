import Link from "next/link";

/** Segel Sigillum (SVG dari sigillum.html): cincin 24-gigi, lingkaran putus-putus,
 *  segitiga timbangan. Warna mengikuti `currentColor`. */
export function SiteMark({
  className,
  strokeWidth = 1.4,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M24.00 2.00 L27.94 4.19 L32.42 3.67 L35.22 7.20 L39.56 8.44 L40.80 12.78 L44.33 15.58 L43.81 20.06 L46.00 24.00 L43.81 27.94 L44.33 32.42 L40.80 35.22 L39.56 39.56 L35.22 40.80 L32.42 44.33 L27.94 43.81 L24.00 46.00 L20.06 43.81 L15.58 44.33 L12.78 40.80 L8.44 39.56 L7.20 35.22 L3.67 32.42 L4.19 27.94 L2.00 24.00 L4.19 20.06 L3.67 15.58 L7.20 12.78 L8.44 8.44 L12.78 7.20 L15.58 3.67 L20.06 4.19 Z" />
      <circle cx="24" cy="24" r="15.5" strokeDasharray="1.2 2.2" opacity=".8" />
      <path d="M24 12.5 L27.6 33.5 H20.4 Z" />
      <path d="M16.5 33.5 H31.5" opacity=".7" />
      <circle cx="24" cy="18.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Logo header: segel emas + teks SIGILLUM (sigillum: .brand). Tautan ke `/`.
 *  Sengaja bukan <h1> -- header kini global, jadi tiap halaman memegang <h1>-nya sendiri. */
export function SiteLogo() {
  return (
    <Link
      href="/"
      aria-label="Sigillum home"
      className="flex items-center gap-3 text-gold"
    >
      <SiteMark className="size-7" />
      <span className="font-mono text-[13px] font-medium tracking-[0.34em] text-ink">
        SIGILLUM
      </span>
    </Link>
  );
}
