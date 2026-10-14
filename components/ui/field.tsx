/** Kelas bersama untuk form (CP7), gaya Sigillum: border `line-2`, fokus emas,
 *  tetap `color-scheme: dark` supaya dropdown/angka bawaan browser ikut gelap.
 *  Lebar tidak ditetapkan di sini -- pemanggil menambah `w-full` / `w-28` sendiri
 *  (`cn()` repo ini tanpa tailwind-merge, jadi kelas lebar tidak boleh bentrok). */
export const FIELD_INPUT =
  "rounded-panel border border-line-2 bg-[rgba(5,7,13,0.55)] px-3 py-2.5 font-body text-[13.5px] normal-case tracking-normal text-ink outline-none transition-[border-color,box-shadow] duration-300 [color-scheme:dark] placeholder:text-ink-3 hover:border-line focus-visible:border-gold focus-visible:shadow-[0_0_0_3px_rgba(214,182,118,0.12)] disabled:opacity-50";

/** Label di atas field: mono uppercase kecil. */
export const FIELD_LABEL =
  "flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3";

/** Teks bantu di dalam label (kembali ke huruf biasa). */
export const FIELD_HINT =
  "font-body text-[11.5px] normal-case tracking-normal text-ink-3";

/** Judul kecil mono di dalam panel (pengganti `text-[11px] uppercase tracking-wider text-faint`). */
export const SECTION_LABEL =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3";
