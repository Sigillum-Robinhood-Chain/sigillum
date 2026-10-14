import { WARD_COLOR_HEX } from '@/types/domain';
import type { DistrictId } from '@/types/domain';

/** Fungsi/tugas agen ditampilkan sebagai callout: garis kiri + tint dengan warna
 *  Ward-nya, label kecil "What it does", dan teks lebih besar & terang supaya
 *  langsung terbaca dibanding chip/statistik di sekitarnya. */
export function AgentFunction({
  description,
  district,
}: {
  description: string;
  district: DistrictId;
}) {
  const color = WARD_COLOR_HEX[district];
  return (
    <div
      className="rounded-r-[2px] border-l-2 py-2.5 pl-3.5 pr-3"
      style={{
        borderLeftColor: color,
        background: `linear-gradient(90deg, ${color}26, ${color}0d)`,
      }}
    >
      <span
        className="font-mono text-[10px] font-medium uppercase tracking-[0.2em]"
        style={{ color }}
      >
        What it does
      </span>
      <p className="mt-1 text-[15px] leading-snug text-ink">
        {description}
      </p>
    </div>
  );
}
