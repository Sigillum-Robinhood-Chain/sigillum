import type { DistrictId } from '@/types/domain';

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
  status: 'idle' | 'working' | 'review';
}

export interface SceneDistrict {
  id: DistrictId;
  /** Nama tampilan (Cognition, Ledger, ...). */
  name: string;
  color: string;
}

/** Kamera per section (sigillum: atribut `data-cam="r,h,lx,ly,lz"` + `data-labels`).
 *  Kunci = id section di components/landing/*. Section yang tidak ada di halaman diabaikan. */
export const SECTION_CAMS: Record<
  string,
  { cam: [number, number, number, number, number]; labels?: boolean }
> = {
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

/** Pose matahari menurut jam lokal browser. Busur matahari memakai jendela terang yang sama dengan
 *  `daylightAt` (05:15 sampai 18:45): terbit di timur (+x), tengah hari paling tinggi dan condong ke
 *  arah kamera (+z), terbenam di barat (-x).
 *  - `el`   : elevasi (rad), rendah di pagi/sore sehingga bayangan panjang, tinggi saat siang.
 *  - `az`   : azimut (rad) dari +z ke +x.
 *  - `warm` : 0 = putih siang, 1 = oranye keemasan (matahari rendah).
 *  `forceDay` = mode Day dikunci tetapi jam sedang malam: pakai pose pagi (09:00) supaya tetap bercahaya. */
export interface SunPose {
  el: number;
  az: number;
  warm: number;
}

const DAWN_H = 5.25;
const DUSK_H = 18.75;
const DEG = Math.PI / 180;

export function sunPoseAt(d: Date, forceDay = false): SunPose {
  const real = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const inDay = real >= DAWN_H && real <= DUSK_H;
  const h = inDay ? real : forceDay ? 9 : real < 12 ? DAWN_H : DUSK_H;
  const t = (h - DAWN_H) / (DUSK_H - DAWN_H);
  const el = (9 + (68 - 9) * Math.sin(Math.PI * t)) * DEG;
  const az = 80 * DEG * (1 - 2 * t);
  const k = Math.min(1, Math.max(0, (el - 10 * DEG) / (50 * DEG - 10 * DEG)));
  const warm = 1 - k * k * (3 - 2 * k);
  return { el, az, warm };
}

/** Vektor arah ke matahari (belum dinormalkan tidak perlu: sudah satuan). */
export function sunDirectionOf(p: SunPose): [number, number, number] {
  const c = Math.cos(p.el);
  return [c * Math.sin(p.az), Math.sin(p.el), c * Math.cos(p.az)];
}
