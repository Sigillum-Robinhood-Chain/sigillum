/** Jembatan antara scene 3D (lib/city/sigillum-scene.ts) dan komponen landing
 *  (kartu district, drawer Mind). Singleton sisi klien; aman diimpor dari server component
 *  karena tidak menyentuh `window` saat dimuat.
 *
 *  Arah 1 (landing -> scene): focusDistrict / focusMind / clearFocus.
 *  Arah 2 (scene -> landing): onPickMind (klik menara), onDistrict (label diklik, atau sorotan
 *  dihapus karena section berganti). Perintah yang datang sebelum scene siap disimpan dan
 *  dijalankan begitu scene terdaftar. */
import type { DistrictId } from "@/types/domain";

export interface SceneControls {
  focusDistrict(id: DistrictId): void;
  focusMind(id: string): void;
  clear(): void;
}

type Pending =
  | { kind: "district"; id: DistrictId }
  | { kind: "mind"; id: string }
  | { kind: "clear" }
  | null;

let scene: SceneControls | null = null;
let pending: Pending = null;
const pickListeners = new Set<(mindId: string) => void>();
const districtListeners = new Set<(id: DistrictId | null) => void>();

function run(c: SceneControls, p: NonNullable<Pending>) {
  if (p.kind === "district") c.focusDistrict(p.id);
  else if (p.kind === "mind") c.focusMind(p.id);
  else c.clear();
}
function send(p: NonNullable<Pending>) {
  if (scene) run(scene, p);
  else pending = p;
}

export const cityBus = {
  register(c: SceneControls | null) {
    scene = c;
    if (c && pending) {
      const p = pending;
      pending = null;
      run(c, p);
    }
  },
  focusDistrict: (id: DistrictId) => send({ kind: "district", id }),
  focusMind: (id: string) => send({ kind: "mind", id }),
  clearFocus: () => send({ kind: "clear" }),

  /** Dipanggil scene. */
  emitPickMind(id: string) {
    pickListeners.forEach((l) => l(id));
  },
  emitDistrict(id: DistrictId | null) {
    districtListeners.forEach((l) => l(id));
  },

  onPickMind(l: (mindId: string) => void) {
    pickListeners.add(l);
    return () => void pickListeners.delete(l);
  },
  onDistrict(l: (id: DistrictId | null) => void) {
    districtListeners.add(l);
    return () => void districtListeners.delete(l);
  },
};
