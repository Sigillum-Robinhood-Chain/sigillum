import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";

/** Kepala halaman aplikasi (CP7): eyebrow mono + judul serif, opsional lede & aksi di kanan.
 *  `<em>` di dalam `title` otomatis serif italic emas (sama dengan judul section landing).
 *  Pembungkus `MotionHeader` (dipasang pemanggil) membuatnya ikut stagger `MotionPage`. */
export function PageHead({
  eyebrow,
  title,
  lede,
  action,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3",
        className
      )}
    >
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 break-words font-display text-[clamp(30px,3.4vw,46px)] font-normal leading-[1.05] tracking-[-0.012em] text-ink [&_em]:italic [&_em]:text-gold-2">
          {title}
        </h1>
        {lede && (
          <p className="mt-2.5 max-w-[62ch] text-[13.5px] text-ink-2">{lede}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
