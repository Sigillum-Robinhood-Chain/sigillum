import type { DistrictId } from "@/types/domain";

/** Satu mind di scene. `district` = kunci DistrictId di kode/DB (bukan indeks). */
export interface SceneMind {
  id: string;
  /** Nama & kode gedung dari DB, dipakai apa adanya (keputusan CP0 #3). */
  name: string;
  code: string;
  district: DistrictId;
  isLead: boolean;
  /** Wage kotor dari job paid; menentukan tinggi menara dan kilaunya. */
  revenue: number;
  status: "idle" | "working" | "review";
}

export interface SceneDistrict {
  id: DistrictId;
  /** Nama tampilan (Cognition, Ledger, ...). */
  name: string;
  color: string;
}

/** Kamera per section (sigillum: atribut `data-cam="r,h,lx,ly,lz"` + `data-labels`).
 *  Kunci = id section di components/landing/*. Section yang tidak ada di halaman diabaikan. */
export const SECTION_CAMS: Record<string, { cam: [number, number, number, number, number]; labels?: boolean }> = {
  top: { cam: [64, 30, 0, 7, 0], labels: true },
  manifesto: { cam: [34, 5, 0, 16, 0] },
  districts: { cam: [80, 76, 0, 0, 0], labels: true },
  protocol: { cam: [30, 22, 0, 16, 0] },
  economy: { cam: [50, 10, 0, 20, 0] },
  charter: { cam: [96, 48, 0, 6, 0] },
  ledger: { cam: [56, 20, 0, 8, 0] },
  build: { cam: [72, 36, 0, 4, 0] },
  end: { cam: [130, 64, 0, 0, 0] },
};

/** Siang/malam mengikuti jam lokal browser (sama dengan scene lama):
 *  0 = malam penuh, 1 = siang penuh; fajar ~05:15-06:45, senja ~17:15-18:45. */
export function daylightAt(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  const ss = (a: number, b: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  return Math.min(1, Math.max(0, ss(5.25, 6.75, h) - ss(17.25, 18.75, h)));
}
