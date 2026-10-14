import Image from "next/image";
import Link from "next/link";

/** Logo Sigillum: monogram S emas (public/logo-mark.png, latar transparan).
 *  Tinggi diatur lewat `className` (mis. `h-8`); lebar mengikuti rasio gambar. */
export function SiteMark({
  className,
}: {
  className?: string;
  /** Dipertahankan agar pemanggil lama tidak error; PNG tidak memakai stroke. */
  strokeWidth?: number;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={203}
      height={320}
      aria-hidden="true"
      priority
      className={className ?? "h-8 w-auto"}
    />
  );
}

/** Logo header: monogram S + teks SIGILLUM (sigillum: .brand). Tautan ke `/`.
 *  Sengaja bukan <h1> -- header kini global, jadi tiap halaman memegang <h1>-nya sendiri. */
export function SiteLogo() {
  return (
    <Link
      href="/"
      aria-label="Sigillum home"
      className="flex items-center gap-3 text-gold"
    >
      <SiteMark className="h-9 w-auto" />
      <span className="font-mono text-[13px] font-medium tracking-[0.34em] text-ink">
        SIGILLUM
      </span>
    </Link>
  );
}
