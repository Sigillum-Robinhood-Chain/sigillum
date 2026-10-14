/** Mode pencahayaan kota: `auto` mengikuti jam lokal browser, `day` / `night` mengunci.
 *  Disimpan di localStorage (per browser) dan dibagikan ke scene lewat subscribe sederhana,
 *  jadi tombol (components/city/day-toggle.tsx) dan scene tidak saling mengimpor.
 *  Aman diimpor dari server component: tidak menyentuh `window` saat dimuat. */
export type DayMode = "auto" | "day" | "night";

export const DAY_MODES: readonly DayMode[] = ["auto", "day", "night"];

const KEY = "sigillum-day-mode";
let mode: DayMode = "auto";
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "day" || v === "night" || v === "auto") mode = v;
  } catch {
    // localStorage bisa tidak tersedia (mode privat / diblokir): tetap `auto`.
  }
}

export function getDayMode(): DayMode {
  load();
  return mode;
}

export function setDayMode(next: DayMode) {
  load();
  if (next === mode) return;
  mode = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // abaikan: pilihan tetap berlaku selama halaman terbuka
  }
  listeners.forEach((l) => l());
}

export function subscribeDayMode(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

/** Server & hidrasi selalu `auto` supaya HTML awal sama dengan klien. */
export const getServerDayMode = (): DayMode => "auto";
