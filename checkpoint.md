# CHECKPOINT: Redesain Wagehold → gaya Sigillum

> Dokumen kerja untuk redesain **bertahap**. Satu checkpoint = satu sesi kerja = satu commit.
> Jangan mulai checkpoint berikutnya sebelum yang sebelumnya dicentang dan di-commit.

- **Proyek sumber:** `Wagehold-main` (Next.js 16 App Router, React 19, Tailwind v4 `@theme`, motion, three@0.184, wagmi/viem, Supabase)
- **Referensi desain:** `sigillum.html` (satu halaman, CSS vanilla, Three.js r160 via CDN, ±99 KB)
- **Prinsip utama:** ubah **tampilan**, jangan ubah **logika**. Kontrak, API route, skema DB, dan enum tidak disentuh.

---

## 0. Status ringkas

| CP | Nama | Risiko | Status |
|----|------|--------|--------|
| 0 | Baseline & keputusan | Rendah | ☐ |
| 1 | Design tokens & font | Rendah | ☑ |
| 2 | Komponen UI dasar | Rendah | ◐ kode selesai, menunggu verifikasi lokal |
| 3 | Shell global (nav, logo, loader, footer) | Sedang | ◐ kode selesai, menunggu verifikasi lokal |
| 4 | Landing page: struktur statis | Sedang | ◐ kode selesai, menunggu verifikasi lokal |
| 5 | Landing page: interaksi & data nyata | Sedang | ◐ kode selesai, menunggu verifikasi lokal |
| 6 | Istilah baru (rename tampilan) | Sedang | ◐ kode selesai, menunggu verifikasi lokal |
| 7 | Restyle halaman aplikasi | Sedang | ◐ kode selesai, menunggu verifikasi lokal |
| 8 | Restyle City Dashboard | Tinggi | ◐ kode selesai, menunggu verifikasi lokal |
| 9 | Port scene 3D | **Tertinggi** | ◐ kode selesai, menunggu verifikasi lokal |
| 10 | Responsif, a11y, performa, bersih-bersih | Rendah | ◐ kode selesai, menunggu verifikasi lokal (build/lint/Lighthouse/visual belum bisa dijalankan di sandbox) |

Status: ☐ belum · ◐ sedang jalan · ☑ selesai & di-commit

---

## 0.1 Keputusan terkunci (dari CP0)

1. **FE ubah total mengikuti `sigillum.html`. BE tidak diubah sama sekali.**
2. **Brand & istilah UI:** Sigillum penuh (Mind, District, Vault, Sigil, Reactor, Grid reserve, Civic fund).
3. **Yang berubah hanya judul/brand app (Sigillum). Nama gedung tetap.** Nama gedung = nama agent/building dari DB (`agents.name`, `agents.code`), dipakai apa adanya. **Nama 20 agent di `sigillum.html` (Archon, Whale Radar, dst.) TIDAK dipakai.** Identitas teknis BE juga tetap Wagehold: nama kontrak (`WageholdStrongbox`, `WageholdSplitter`), API route, tabel/kolom DB, enum, ABI.
4. **Mode siang/malam otomatis dipertahankan** (dari `city-scene.tsx` lama). Scene HTML aslinya hanya malam, jadi sistem `daylightAt()` lama harus dicangkokkan ke scene hasil port (tambahan kerja di CP9).
5. **Logo:** segel SVG dari `sigillum.html`. `public/logo.png` dan `app/icon.png` / `apple-icon.png` tidak disentuh kecuali Anda minta.
6. **Struktur:** satu pengalaman. `/` adalah kota 3D ala HTML dengan fitur dashboard (job board, ledger, profil Mind, stake, wallet) menyatu di dalamnya. Tidak ada landing terpisah dan tidak ada `/city`.
7. **Scene 3D:** port dari `sigillum.html` (three r160 → three 0.184), kamera mengikuti scroll.

**Dampak ke rencana:**
- **CP4/CP5:** section landing dibangun langsung di `app/page.tsx` (bukan `/landing`).
- **CP8:** bukan "restyle dashboard lama", tapi *melebur* fitur dashboard ke dalam pengalaman kota: panel melayang, drawer Mind, ledger feed, stake/payout, wallet.
- **CP9:** wajib opsi B (port). Karena `/` bergantung pada scene, pertimbangkan membuat scene lebih awal (lihat catatan urutan di bawah).
- `components/realtime-city-dashboard.tsx` dan `components/city-scene.tsx` lama dipertahankan sampai pengganti siap, baru dihapus di CP10.

> **Catatan urutan:** karena `/` jadi kota 3D, saya sarankan scene dibuat sebagai *spike* kecil sebelum CP4 (kanvas + 5 district + 20 gedung dari data nyata, tanpa kamera scroll) agar tidak ada kejutan di akhir. Ini bisa jadi CP3.5 bila Anda setuju.

---

## 1. Hasil analisis (ringkas)

### 1.1 Perbedaan mendasar

| Aspek | Wagehold sekarang | sigillum.html |
|---|---|---|
| Karakter | Dashboard padat, panel kartu | Landing sinematik, scroll-driven |
| Latar | `#121626` (biru-ungu gelap) | `#05070d` (hampir hitam) |
| Aksen | Emas `#e6c36a` | Emas `#D6B676` / `#F0DCB0` + es `#A8C4DE` + ember `#C98762` |
| Font display | Bricolage Grotesque | Instrument Serif (italic untuk penekanan) |
| Font body | IBM Plex Sans | Geist (weight 300) |
| Font mono | Martian Mono | Geist Mono, uppercase, letter-spacing lebar |
| Panel | `rounded-panel` 10px, solid | Kaca (`backdrop-blur`), sudut siku, **tick emas di pojok** |
| Tombol | Radius 7px | Pill (999px), mono uppercase, primary bergradien emas |
| 3D | `city-scene.tsx` 2029 baris, three 0.184 | Scene sendiri, three 0.160, kamera mengikuti scroll (`data-cam`) |

### 1.2 Pemetaan istilah (hanya label tampilan)

| Lama | Baru | Catatan |
|---|---|---|
| Wagehold | Sigillum | brand |
| Wright | Mind | `Steward` untuk lead |
| Ward | District | nama tiap district juga berubah (lihat 1.3) |
| Strongbox | Vault | contract name `WageholdStrongbox` **tetap** |
| Set the seal | Press the Sigil | |
| Furnace | Reactor | |
| Lamp Oil (20%) | Grid reserve | |
| Tithe (10%) | Civic fund | |
| Counting House | (tentukan di CP0) | tidak muncul di HTML |
| Council | Council | tetap |

### 1.3 District

| id di DB/kode (TETAP) | Nama lama | Nama baru | Warna lama | Warna baru |
|---|---|---|---|---|
| `research` | Research Ward | Cognition | `#5fb3b0` | `#4FA3F7` |
| `onchain` | Chain Ward | Ledger | `#e0a458` | `#F2BE4A` |
| `creative` | Craft Ward | Signal | `#d9776b` | `#A47CFF` |
| `security` | Watch Ward | Sentinel | `#9c8be0` | `#2FD39B` |
| `community` | Hearth Ward | Commons | `#8dbf7f` | `#FF6F59` |

> ⚠️ HTML memakai key `craft/watch/hearth`, kode memakai `creative/security/community`. **Pakai key yang ada di kode.** Jangan rename enum atau kolom DB.
> ⚠️ Warna lama ada di `globals.css` dan dicerminkan sebagai hex di `types/domain.ts` (`WARD_COLOR_HEX`). Keduanya harus diubah bersamaan.

### 1.4 Yang TIDAK boleh disentuh

- `contracts/**`, `supabase/migrations/**`, `types/database.ts`, `types/enums.ts`
- `app/api/**`, `lib/web3/**`, `lib/identity/**`, `lib/supabase/**`, `lib/agents/**`, `proxy.ts`
- Nama fungsi/ABI seperti `createJob`, `approve`, `pullAndSplit`
- Split **60/20/10/10** (hanya labelnya yang berubah)

### 1.5 Hal yang belum diverifikasi

- Nama 20 agent di `sigillum.html` (Archon, Diligence Engine, dst.) **belum dicocokkan** dengan seed di `supabase/migrations/0002` dan `0008`. Anggap data HTML hanya contoh; **sumber kebenaran tetap Supabase**.
- Angka statistik hero (Treasury 158, Burned 23, dst.) di HTML hardcoded. Di aplikasi harus diambil dari data nyata.
- Link di HTML mengarah ke `wagehold.tech` dan org GitHub `Wagehold-Robinhood-Chain`. Perlu diganti ke route internal.

---

## CP0: Baseline & keputusan

**Tujuan:** titik aman untuk kembali, dan semua keputusan arsitektur dikunci sebelum menulis kode.

- [ ] `git init` (jika belum) → commit "baseline sebelum redesain" → `git tag pre-sigillum`
- [ ] Buat branch `redesign/sigillum`
- [ ] `npm install && npm run build && npm run lint` lolos di baseline (catat error bawaan jika ada)
- [ ] Screenshot halaman utama: `/`, `/jobs`, `/jobs/new`, `/agents/[id]`, `/weighhouse`, `/login` → simpan di `docs/before/`
- [ ] **Putuskan** (isi di bawah):

| Keputusan | Pilihan | Rekomendasi | Dipilih |
|---|---|---|---|
| Brand | Ganti jadi "Sigillum" / tetap "Wagehold" | Ikut HTML | ☑ Sigillum penuh di UI; identitas BE tetap Wagehold |
| Letak landing | (a) Ganti `/` · (b) route baru `/landing`, dashboard tetap di `/` | **(b) dulu**, pindahkan setelah CP8 | ☑ Satu pengalaman: `/` = kota 3D ala HTML, fitur dashboard menyatu |
| Dashboard lama | Dipertahankan di `/city` atau tetap di `/` | `/city` setelah landing jadi `/` | ☑ Tidak ada `/city`; dilebur ke `/` |
| Rename istilah | Hanya UI / UI + README | UI dulu, README di CP10 | ☐ |
| Scene 3D | Port scene HTML / restyle scene lama | Restyle scene lama (CP9) | ☑ Port scene HTML (CP9 opsi B) |
| Logo | Segel SVG di HTML / `public/logo.png` | SVG segel | ☑ Segel SVG |

**Selesai bila:** tag `pre-sigillum` ada, tabel keputusan terisi, build baseline hijau.
**Commit:** `chore: baseline before sigillum redesign`

---

## CP1: Design tokens & font  ☑ SELESAI (dilanjutkan ke CP2 oleh user; build/lint lokal diasumsikan lolos)

**Tujuan:** ganti "kulit" global tanpa mengubah layout satu pun komponen.

**File yang diubah (4):**

| File | Perubahan |
|---|---|
| `app/globals.css` | `@theme` ditulis ulang, base body, `::selection`, utilitas `.ticks` `.panel-glass` `.eyebrow` |
| `app/layout.tsx` | Font → Instrument Serif / Geist / Geist Mono; `viewport` (theme-color + color-scheme) |
| `types/domain.ts` | `WARD_COLOR_HEX` → warna district baru |
| `components/weighhouse/weighhouse-client.tsx` | `WARD_DOT` → warna district baru (5 baris) |

**Checklist:**

- [x] `@theme`: token baru ditambahkan, **nama lama dipertahankan** (bg, surface, surface-2, line, text, muted, faint, gold, gold-ink, good, warn, crit, ward-*)
- [x] Token baru: `ink`, `ink-2/3/4`, `gold-2`, `ice`, `lav`, `ember`, `line-2`, `glass`, `--spacing-gutter` (→ `px-gutter`)
- [x] `bg` `#05070d`, `surface` `#0a0e16`, `surface-2` `#10151f`
- [x] `line` → `rgba(214,182,118,.20)` (emas tipis), `muted` → ink-2 (.70), `faint` → ink-3 (.44)
- [x] Warna district baru di **tiga tempat**: `globals.css`, `WARD_COLOR_HEX`, `WARD_DOT` (tabel 1.3)
- [x] `layout.tsx`: `Instrument_Serif` (400, normal+italic), `Geist` & `Geist_Mono` (variable, seluruh weight). Nama variabel `--font-*-family` dipertahankan
- [x] `body`: `font-weight:300`, antialiased, `font-synthesis-weight:none` (mencegah faux-bold pada Instrument Serif yang hanya punya weight 400)
- [x] `::selection` emas
- [x] Utilitas `.ticks`, `.eyebrow`, `.panel-glass` di `@layer components` (belum dipakai komponen mana pun, baru dipakai CP2)
- [x] `theme-color` `#05070d` lewat `export const viewport` (cara Next 16, bukan `<meta>` manual)
- [x] `--radius-panel` 10px → **2px** (hampir siku seperti HTML; struktur panel tidak berubah)

**Sengaja DITUNDA (bukan lupa):**

- `body` `font-size:16px` dan `line-height:1.6` milik HTML **belum diterapkan**. Dashboard lama padat, dan elemen tanpa ukuran eksplisit akan bergeser. Ukuran ini ditetapkan per-section di landing (CP4); keputusan ukuran global diambil di CP10.
- `scroll-behavior:smooth` pada `html`: dikerjakan bersama nav di CP3.

**Efek visual yang WAJAR terlihat setelah CP1** (bukan bug):

- Latar jauh lebih gelap/hitam; border jadi keemasan tipis.
- Heading `font-display` kini serif tipis (weight 400). Heading kecil bisa terlihat ringan sampai dirapikan di CP2/CP7.
- Warna district berubah (lihat 1.3): gedung di scene lama ikut berubah karena memakai `WARD_COLOR_HEX`.
- Teks `muted/faint` lebih terang dari sebelumnya.

**Warna hardcoded yang sengaja belum disentuh** (muncul sebagai ketidakselarasan sementara):

| Lokasi | Nilai | Ditangani di |
|---|---|---|
| `ui/button.tsx`, `job-card.tsx`, `wallet-connect.tsx` | `#46507a` (hover border), `#d97a4a` | CP2 / CP7 |
| `ui/status-pill.tsx` | `#2A3050` | CP2 |
| `revenue-split.tsx` | `#6C7392` | CP6 / CP7 |
| `weighhouse-client.tsx` (`C`, `BUCKET_COLOR`), `charts.tsx` | `#5FB3B0 #56608A #E6C36A #E27070 ...` | CP7 |
| `city-scene.tsx` | palet langit/kabut/cahaya sendiri | CP9 |
| `login-form.tsx` | warna logo Google | **tidak diubah** (brand pihak ketiga) |

**Terverifikasi (di lingkungan saya):**

- [x] `npm install` + `tsc --noEmit`: **0 error**
- [x] Nama font & weight valid terhadap `font-data.json` milik Next
- [x] Tailwind mengompilasi semua kelas baru (`bg-bg`, `text-ink-3`, `border-line-2`, `bg-glass`, `px-gutter`, `bg-ward-*`, `.ticks`, `.eyebrow`, `.panel-glass`, dst.)

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` hijau (saya tidak bisa menjalankannya: `next/font/google` perlu mengunduh font dari Google, diblokir di lingkungan saya)
- [ ] `npm run lint` hijau
- [ ] Cek visual di browser: `/`, `/jobs`, `/jobs/new`, `/agents/[id]`, `/weighhouse`, `/login`, `/dev/components`
- [ ] Font tampil benar (serif untuk judul, bukan fallback Times)
- [ ] Wallet connect & flow job tetap jalan (CP1 tidak menyentuh logikanya)
- [ ] Bandingkan dengan screenshot `docs/before/`

**Selesai bila:** semua halaman tetap tampil & berfungsi, hanya warna/font berubah. Build hijau.
**Rollback:** `git revert` commit ini.
**Commit:** `style: sigillum tokens and fonts`

---

## CP2: Komponen UI dasar  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Tujuan:** primitif visual baru. Halaman lain otomatis ikut berubah tanpa disentuh.

**File yang diubah / baru (8):**

| File | Perubahan |
|---|---|
| `components/ui/button.tsx` | Pill mono uppercase; varian `default`/`primary`/`ghost`; ukuran `small`/`default`/`large`; prop `arrow`; ekspor `buttonClasses()` & `ButtonArrow` |
| `components/ui/panel.tsx` | Varian `glass` (default) / `solid`; prop `ticks`; `PanelHeader` judul serif |
| `components/ui/chip.tsx` | Pill outline mono |
| `components/ui/badge.tsx` | Pill outline mono 9.5px uppercase |
| `components/ui/status-pill.tsx` | Pill outline + titik bercahaya; hapus `#2A3050` |
| `components/ui/progress-bar.tsx` | Garis 2px emas + glow; tambah `role="progressbar"` + aria |
| `components/ui/eyebrow.tsx` | **BARU**, memakai `.eyebrow` dari CP1 |
| `app/dev/components/page.tsx` | Galeri uji: tipografi, palet, semua varian |

`empty-state.tsx` tidak diubah (sudah memakai token `faint` yang otomatis ikut berubah di CP1).

**Checklist:**

- [x] `Button`: pill, mono uppercase, `tracking-[.18em]`
- [x] Varian `primary` (gradien `gold-2→gold` + glow), `ghost` (border `line`, hover emas); `default` = tampil sama dengan `ghost` (nama lama dipertahankan agar pemanggil lama tidak rusak)
- [x] Ukuran: `small` (nama lama dipertahankan, **bukan** `sm`), `default` (lebih ringkas dari HTML), **`large`** = ukuran asli tombol HTML untuk CTA landing
- [x] Prop `arrow` + helper `buttonClasses()` agar `<Link>`/`<a>` bisa tampil seperti tombol (dipakai CP3/CP4)
- [x] Style `disabled` (opacity .5, cursor not-allowed)
- [x] `Panel`: latar kaca (`.panel-glass`) + border `line-2`; `variant="solid"`; `ticks`
- [x] Saat `ticks` aktif, pemotongan `overflow-hidden` dipindah ke pembungkus dalam supaya tick di -1px tidak terpotong
- [x] `PanelHeader`: judul `font-display` 19px, border `line-2`
- [x] `Chip`, `Badge`, `StatusPill`: pill outline mono
- [x] `ProgressBar`: 2px, glow emas (sebelumnya hijau `good`)
- [x] `Eyebrow` baru
- [x] `/dev/components`: galeri tipografi, palet 16 swatch, semua varian tombol/chip/badge/status/progress/panel

**Perubahan perilaku yang perlu Anda ketahui:**

- Teks tombol kini **uppercase mono**. Label panjang di area sempit (mis. kartu job) bisa lebih lebar dari sebelumnya. Periksa kartu job dan form.
- Tombol `default`/`small` memakai font lebih kecil (11px / 10px) tapi padding lebih besar, jadi tinggi sedikit berubah.
- Panel default kini **glass**: di atas latar `#05070d` ia hampir menyatu dengan halaman dan hanya dibatasi border. Ini disengaja (gaya HTML, nanti melayang di atas scene 3D). Bila terlalu menyatu di halaman form/daftar sebelum CP7, ganti default `variant` ke `"solid"` di `panel.tsx`.
- `cn()` di repo ini hanya `clsx` (tanpa tailwind-merge). `className` yang bentrok dengan kelas bawaan (mis. `border-[#d97a4a]` di `wallet-connect.tsx`, `border-gold/40` di `weighhouse-client.tsx`) hasilnya tergantung urutan CSS. Masalah ini sudah ada sebelum CP2; periksa tampilan dua tempat itu.
- `ProgressBar` berubah dari hijau ke emas.

**Terverifikasi (di lingkungan saya):**

- [x] `tsc --noEmit`: 0 error
- [x] Tailwind mengompilasi 25 kelas kunci (`bg-linear-to-b`, `from-gold-2`, `border-line-2`, `h-0.5`, `shadow-[...]`, `group-hover:translate-x-[3px]`, `disabled:opacity-50`, `.panel-glass`, `.ticks`, dst.)

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` dan `npm run lint` hijau
- [ ] `/dev/components`: semua varian tampil benar, tick emas terlihat di pojok panel `ticks`
- [ ] Hover tombol: `primary` terangkat + glow, `ghost` border jadi emas, panah bergeser
- [ ] Tombol `disabled` tidak bisa diklik dan tampil redup
- [ ] Halaman lama (`/jobs`, `/jobs/new`, `/agents/[id]`, `/weighhouse`, `/login`) tidak patah: tombol, chip, status, progress tampil rapi
- [ ] Animasi stagger `Panel` di dalam `MotionPage` tetap jalan (tidak ada kedip aneh karena `backdrop-filter`)

**Selesai bila:** `/dev/components` menampilkan semua komponen sesuai gaya HTML; halaman lain tidak patah.
**Commit:** `style: ui primitives (button, panel, chip, eyebrow)`

---

## CP3: Shell global  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Tujuan:** nav, logo, loader, footer konsisten di semua halaman.

**File:** `components/site-nav.tsx`, `components/site-logo.tsx`, `components/motion/primitives.tsx`, `app/layout.tsx`; baru: `components/site-header.tsx`, `components/site-footer.tsx`, `components/loader.tsx`

- [x] `site-logo.tsx`: SVG segel (path 24-gigi + lingkaran putus-putus + segitiga) dari HTML + teks `SIGILLUM` mono `tracking-[.34em]`
- [x] Header `fixed`, transparan di atas → `solid` + blur setelah `scrollY > 40` (hook `useScrolled`)
- [x] Nav link: mono 11px uppercase `tracking-[.22em]`, pill aktif lama diganti warna emas
- [x] Tombol ikon bulat (X, GitHub) + CTA "Post a job"; `WalletConnect` tetap, hanya di-restyle
- [x] Loader layar penuh (segel berputar, bar bergerak, fade-out) → hanya dipakai di landing/city
- [x] Footer seragam: tautan, disclaimer ("Not financial advice…")
- [x] Nav mobile (<860px): link disembunyikan, sediakan menu ringkas (HTML hanya menyembunyikan; di aplikasi nyata butuh akses ke Jobs & Weighhouse)

**Catatan:** saat ini tiap page merender headernya sendiri. Boleh dipindah ke `layout.tsx` di langkah ini atau tetap per-page (pilih yang paling kecil risikonya).

**Keputusan implementasi (CP3):**

- Header **dipindah ke `app/layout.tsx`** (`<SiteHeader />` di dalam `Web3Provider`, karena memuat `WalletConnect`). Halaman tidak lagi merender `SiteLogo`/`SiteNav`/`WalletConnect`; kontainer halaman diberi `px-3 pt-[78px] pb-3` (menggantikan `p-3`).
- Halaman aplikasi setinggi layar dengan scroll di kontainer dalam, jadi `useScrolled` mendengar `scroll` dengan **capture** (scroll window maupun kontainer dalam).
- Footer **tidak** di layout (akan menambah scroll di bawah layar); `SiteFooter` dipakai per halaman menggantikan `MotionFooter` lama. Prop `note` = baris khusus halaman, `children` = isi tambahan (mis. `CaBlock` di Weighhouse).
- Loader hanya dipasang di `/` (`realtime-city-dashboard.tsx`), menutup sendiri setelah 1,4 dtk (maks 8 dtk). Prop `ready` disiapkan untuk scene 3D (CP9).
- Nav diberi link ke **Weighhouse** (tadinya hanya The City & Job Board), sesuai catatan CP3.
- Ikon X dipindah dari `wallet-connect.tsx` ke header; ikon GitHub baru. `GITHUB_URL` ditambahkan di `lib/social.ts` (override: `NEXT_PUBLIC_GITHUB_URL`).
- `wallet-connect.tsx`: warna hardcoded `#46507a` / `#d97a4a` dihapus (pakai `line-2`, `gold`, `ember`); badge simulasi & tombol disabled jadi pill mono; tombol putus jadi bulat.
- `html{scroll-behavior:smooth}` ditambahkan di `globals.css` (ditunda dari CP1).
- Tagline "Work sealed. Wages shared." di header halaman dihapus (tidak ada di HTML). Header `MotionHeader` hanya dipertahankan di dashboard (StatBar) dan Weighhouse (pemilih rentang waktu).
- Teks disclaimer footer mengikuti HTML (memakai istilah Mind/Sigil); label lain di UI baru berganti di CP6.
- `components/motion/primitives.tsx` tidak perlu diubah.

**File CP3:** baru `site-header.tsx`, `site-footer.tsx`, `loader.tsx`; diubah `site-logo.tsx`, `site-nav.tsx`, `wallet-connect.tsx`, `app/layout.tsx`, `app/globals.css`, `lib/social.ts`, `app/jobs/new/page.tsx`, `app/agents/[id]/page.tsx`, `app/login/page.tsx`, `components/realtime-job-board.tsx`, `components/realtime-job-detail.tsx`, `components/realtime-city-dashboard.tsx`, `components/weighhouse/weighhouse-client.tsx`.

**Terverifikasi (di lingkungan saya):**

- [x] `eslint` pada file CP3: 0 error/warning
- [x] `tsc --noEmit`: 0 error di luar `weighhouse-client.tsx` (lihat catatan di bawah)
- [x] Tailwind mengompilasi kelas baru (`min-[860px]:*`, `min-[560px]:*`, `pt-[78px]`, `backdrop-blur-[18px]`, `bg-ember/10`, `duration-[1200ms]`, dst.)

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` dan `npm run lint` hijau
- [ ] Header tampil di `/`, `/jobs`, `/jobs/new`, `/jobs/[id]`, `/agents/[id]`, `/weighhouse`, `/login`; transparan di atas, solid setelah scroll
- [ ] Menu mobile (<860px): buka/tutup, Esc, otomatis menutup saat pindah halaman
- [ ] Connect wallet / badge simulasi tampil rapi di header (lebar 390px tidak meluap)
- [ ] Loader muncul sekali di `/` lalu fade-out; tidak ada warning hydration
- [ ] Konten halaman tidak tertutup header (`pt-[78px]`), terutama `/weighhouse` dan dashboard
- [ ] Footer tidak memotong panel di halaman setinggi layar

**Catatan zip:** `Wagehold-*.zip` yang diunggah tidak memuat `components/weighhouse/{charts,format,ui}`, `lib/weighhouse/metrics`, `lib/web3/addresses`, maupun `app/weighhouse/`, jadi `tsc` pada `weighhouse-client.tsx` gagal di lingkungan saya (bukan akibat CP3). Zip itu juga masih memuat `/login`, padahal sudah dihapus di proyek Anda; kemungkinan zip lebih lama dari proyek lokal.

**Selesai bila:** header/footer baru tampil di semua route, wallet connect tetap jalan.
**Commit:** `style: global header, footer, logo, loader`

---

## CP4: Landing page: struktur statis  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Tujuan:** semua section HTML jadi komponen React **tanpa** animasi dan tanpa data live dulu.

**File baru:** `app/landing/page.tsx` (atau `app/page.tsx` sesuai CP0), `components/landing/*`

Urutan section (ikuti HTML):

- [x] `hero.tsx`: eyebrow, H1 "Minds do the work. *Humans* press the seal.", lede, 2 CTA, hint, panel 5 stat
- [x] `thesis.tsx`: 3 kartu "Law 01–03" (coret frasa lama → judul emas)
- [x] `districts.tsx`: grid 5 kartu district (data dari `DISTRICT_ORDER`, bukan hardcode)
- [x] `protocol.tsx`: 6 langkah, garis timeline + "flow" bercahaya
- [x] `economy.tsx`: kalkulator + donut (statis dulu)
- [x] `charter.tsx`: 4 pasal (I–IV), angka romawi serif italic
- [x] `ledger-preview.tsx`: panel feed (statis dulu)
- [x] `foundations.tsx`: 6 kartu (Vault, Splitter, Verification, Network, Minds, Stack)
- [x] `closing.tsx`: "Nothing is final until it is *sealed*."
- [x] Pindahkan teks ke satu file `components/landing/copy.ts` agar mudah diedit
- [x] Ganti semua link `wagehold.tech/...` → `next/link` ke route internal
- [x] Latar sementara: gradien `no-webgl` dari HTML (belum ada 3D)

**Catatan angka:** HTML menulis "46 / 46 Forge tests"; README menyebut 46 (24 + 22). Cocok, tapi **verifikasi ulang sebelum rilis**, jangan salin buta.

**Keputusan implementasi (CP4):**

- Sesuai CP0, landing dibangun langsung di **`app/page.tsx`** (bukan `/landing`). Akibatnya `/` kini landing statis; dashboard lama **tidak lagi di-route** sampai dilebur di CP8. Halaman lamanya disimpan di `app/_legacy-dashboard/page.tsx` (folder berawalan `_` = bukan route) berikut query-nya; `realtime-city-dashboard.tsx` dan `city-scene.tsx` tidak disentuh. Hapus folder itu di CP10. Untuk memulihkan sementara: salin isinya kembali ke `app/page.tsx`.
- Semua teks ada di `components/landing/copy.ts`. Rich text memakai `{ em }` (italic emas) dan `{ i }` (serif kecil).
- **Tidak ada angka palsu:** 5 stat hero tampil "—" (nilai nyata di CP5). Ledger preview berisi contoh statis berlabel "Sample", **tanpa nama agent** dari HTML (keputusan CP0 #3).
- Persen split di Economy, Protocol (langkah 06), Ledger, dan Foundations diambil dari `WAGE_SPLIT` (`lib/currency.ts`), bukan hardcode 60/20/10/10.
- Kartu district: urutan `DISTRICT_ORDER`, warna `WARD_COLOR_HEX`, kunci = `DistrictId` kode (bukan `craft/watch/hearth` milik HTML). Teks "formerly …" ditulis tetap di `copy.ts` (bukan dari `WARD_LABEL`, yang berganti di CP6).
- Ditunda ke CP5 (bukan lupa): daftar mind di kartu district, tombol "Return to overview", hover/klik sorot, slider & donut interaktif (slider kini `disabled`), reveal on scroll, counter, drawer, feed nyata, highlight nav per section. Label feed "Sample" diganti "Streaming" saat feed nyata terpasang.
- Link `wagehold.tech/...` diganti `next/link` ke `/jobs/new`, `/jobs`, `/weighhouse`; X dan GitHub dari `lib/social.ts`.
- `<Loader />` dipasang di `app/page.tsx`. Latar sementara = gradien `no-webgl` HTML (div `fixed -z-10`).
- Ukuran dasar 16px/1.6 milik HTML hanya di `<main>` landing; body global tetap 14px (keputusan CP1).
- `globals.css`: tambah keyframes `flow` dan `beacon` (lewat `@theme`) dan kelas `.range-gold`.
- Angka "46 / 46 Forge tests" dan chain ID 4663/46630 disalin dari HTML. Chain ID cocok dengan `lib/web3/chains.ts`; **jumlah tes belum diverifikasi ulang** (ada di `copy.ts` → `FOUNDATIONS.testsPassing`).

**File CP4:** baru `components/landing/{copy.ts,section.tsx,hero,thesis,districts,protocol,economy,charter,ledger-preview,foundations,closing}.tsx` dan `app/_legacy-dashboard/page.tsx`; diubah `app/page.tsx`, `app/globals.css`.

**Terverifikasi (di lingkungan saya):**

- [x] `eslint` pada `components/landing`, `app/page.tsx`, `app/_legacy-dashboard`: bersih
- [x] `tsc --noEmit`: 0 error di luar `weighhouse-client.tsx` (masalah zip yang sudah dicatat di CP3)
- [x] Tailwind mengompilasi 23 kelas kunci (grid responsif `min-[560/860/1100px]`, `animate-flow`, `animate-beacon`, `.range-gold`, gradien timeline, `hover:border-[var(--c)]`, dst.)

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` dan `npm run lint` hijau
- [ ] `/` menampilkan 9 section berurutan, tanpa error hydration, loader muncul sekali
- [ ] Bandingkan visual dengan `sigillum.html` per section di lebar 1440 / 1100 / 860 / 560 / 390px
- [ ] Tick emas di pojok panel, garis timeline + cahaya "flow" bergerak (≥1100px), titik hint berdenyut
- [ ] Panel kaca terbaca di atas latar gradien (tanpa 3D masih sangat gelap, wajar)
- [ ] Semua tautan: `/jobs/new`, `/jobs`, `/weighhouse`, `#districts`, X, GitHub
- [ ] Anchor `#districts` tidak tertutup header fixed

**Selesai bila:** halaman landing tampil lengkap secara visual, belum interaktif.
**Commit:** `feat(landing): static sections`

---

## CP5: Landing page: interaksi & data nyata  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Tujuan:** landing hidup, angka berasal dari Supabase, tanpa error hydration.

**Checklist:**

- [x] Reveal on scroll: `reveal-observer.tsx` (IntersectionObserver) + kelas `.rv d1-d5` di section/kartu/panel; reduced-motion = langsung tampil; `<noscript>` menampilkan semuanya
- [x] Counter angka hero: `count-up.tsx` (ease-out kuartik 1,8 dtk, mulai +0,9 dtk; nilai akhir sudah ada di SSR; hanya menulis `textContent`, tanpa state)
- [x] Hero stats data nyata: `app/page.tsx` → `lib/landing-stats.ts`; Supabase gagal → "—"; "Minds at work" tampil `n / total` dari jumlah mind sebenarnya
- [x] Kalkulator wage: slider 10-5000 (step 10), tiap bagian dari `WAGE_SPLIT`
- [x] Donut SVG: hover/fokus segmen ↔ legend saling menyorot, teks tengah ikut berubah
- [x] Kartu district: klik judul/kartu → sorot (yang lain meredup) + tombol "Return to overview"; tiap kartu mendaftar mind-nya (Steward di atas, titik berdenyut bila working/review)
- [x] Drawer profil Mind (`mind-drawer.tsx`): slide dari kanan, backdrop blur, tutup via Esc / klik luar / tombol, fokus terkunci (Tab/Shift+Tab) dan dikembalikan ke pemicu, scroll halaman dikunci, `role="dialog" aria-modal`
- [x] Ledger preview: event nyata (`listRecentEvents`) + hook `useRealtimeChanges('job_events')` yang sudah ada; fallback ke contoh berlabel "Sample" bila kosong, label "Streaming" bila nyata
- [x] Nav: highlight section aktif saat scroll (`use-active-section.ts`)

**Keputusan implementasi (CP5):**

- Zip yang diunggah **belum memuat** `reveal-observer.tsx`, `count-up.tsx`, hero berdata, dan kalkulator interaktif (padahal tercatat selesai); semuanya ditulis ulang di sesi ini. Salin seluruh file CP5 ke proyek lokal Anda, timpa versi lama bila ada.
- Data landing dimuat satu kali di `app/page.tsx` (`loadLanding`): `listAgents`, `listJobs`, `getWageSplitTotals`, `listStakes`, `listRecentEvents(40)`. Hanya memanggil query yang ada; tidak ada perubahan di `lib/supabase/**`.
- Angka per mind (sealed, revenue, rating, rank) diturunkan dari job nyata dengan aturan dashboard lama (`lib/landing-minds.ts` memakai `lib/agent-stats` & `lib/patronage`). Steward = angka seluruh district. Rank non-lead dari `deriveRank`, bukan kolom `agents.rank`.
- Teks feed dibangun dari `type` event + judul job dengan istilah Sigillum (`ledger-events.ts`); `note` dari DB (masih berisi Strongbox/Furnace/...) **tidak ditampilkan**, hanya angka WAGE-nya yang diambil. Event perantara (selecting, reading_brief, drafting, checking, finalizing, revision_started, split_pending, split_record_failed, error) dan tipe tak dikenal **disembunyikan** dari preview. Judul job dirender sebagai teks React (ter-escape).
- Jam feed memakai **UTC** (deterministik; zona lokal memicu hydration mismatch). Header feed menulis "UTC".
- Payload Realtime hanya membawa `job_id`, jadi judul job yang belum dikenal diambil sekali lewat `supabase.from('jobs').select('title')` di klien (RLS baca sama dengan query biasa).
- Nav di `/` berganti: **Districts · Economy · Ledger · Jobs · Weighhouse** (anchor section menyala saat scroll). Halaman lain tetap The City · Job Board · Weighhouse. Menu mobile memakai daftar yang sama dan menutup saat link diklik. Menyentuh `site-nav.tsx` dan `site-header.tsx` (file CP3, perubahan kecil).
- Drawer dirender lewat portal ke `<body>` (menghindari kontainer ber-transform `.rv`).
- Tautan "Commission a mind" di drawer menuju `/jobs/new` tanpa memilih mind (form lama belum menerima parameter agent).

**File CP5:** baru `lib/landing-minds.ts`, `components/landing/{reveal-observer,count-up,mind-drawer}.tsx`, `components/landing/{ledger-events,use-active-section}.ts`; diubah `app/page.tsx`, `components/landing/{hero,economy,districts,ledger-preview,section,thesis,protocol,charter,foundations,closing}.tsx`, `components/site-nav.tsx`, `components/site-header.tsx`.

**BELUM terverifikasi, mohon dicek di komputer Anda** (lingkungan saya tanpa `node_modules` dan tanpa jaringan, jadi `tsc`/`eslint`/`build` tidak bisa dijalankan):

- [ ] `npm run lint` dan `npm run build` hijau (kemungkinan koreksi kecil tipe, mis. `rating` pada baris job, `payload.new` pada hook Realtime)
- [ ] `/`: tidak ada warning hydration (counter, jam feed, portal drawer)
- [ ] Hero: angka menghitung naik setelah loader; Supabase dimatikan → "—" dan halaman tetap tampil
- [ ] Kalkulator: slider menggeser nominal; donut/legend saling menyorot; fokus keyboard pada segmen
- [ ] District: klik kartu menyorot + "Return to overview"; klik mind membuka drawer; Esc, klik luar, Tab terkunci, fokus kembali ke tombol mind
- [ ] Ledger: buat job di mode simulasi → baris baru muncul tanpa reload; DB kosong → "Sample"
- [ ] Nav: link menyala saat scroll melewati Districts / Economy / Ledger; muat di lebar 860-1100px tanpa meluap; menu mobile
- [ ] Reveal: elemen muncul saat scroll; reduced-motion & tanpa JS tetap tampil
- [ ] Halaman lain (`/jobs`, `/weighhouse`) tidak berubah kecuali nav

**Selesai bila:** landing hidup, angka berasal dari Supabase, tidak ada error hydration.
**Commit:** `feat(landing): interactions and live data`

---

## CP6: Istilah baru (rename tampilan)  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Tujuan:** ganti label di UI saja. Satu sumber kebenaran supaya mudah diubah lagi.

**Checklist:**

- [x] `lib/terms.ts` (`TERMS`): brand, agent/agents, steward, district, vault, seal, sealAction, reactor, gridReserve, civicFund, footerNote, tagline, description
- [x] `WARD_LABEL` → Cognition, Ledger, Signal, Sentinel, Commons; `RANK_LABEL.warden` → "Steward" (key `warden` tetap, itu enum)
- [x] Teks komponen diganti (daftar di bawah). Jalur Set the seal → **Press the Sigil**, "Awaiting seal" → **Awaiting Sigil**, Lamp Oil/Tithe/Furnace → **Grid reserve/Civic fund/Reactor**, Strongbox → **Vault**, Wright → **Mind**, Warden → **Steward**, Ward → **District**, Counting House → **Treasury**
- [x] `RevenueSplitData` (`lampOilPct`, `tithePct`, `furnacePct`): nama field tetap, hanya label yang diganti
- [x] `metadata` di `layout.tsx` memakai `TERMS` (judul "Sigillum: Work sealed. Wages shared.")
- [x] Catatan footer "No coin leaves the Vault without a human Sigil." lewat `TERMS.footerNote` di 7 halaman
- [x] `grep` pada `app/` (di luar `app/api`) dan `components/`: sisa hanya nama variabel/tipe/key internal, komentar, dan teks yang sengaja dibiarkan (lihat bawah)

**Keputusan implementasi (CP6):**

- Counting House (tidak ada di HTML) → **Treasury**, sama dengan label hero landing.
- Hanya string yang **terlihat user** yang diganti. Komentar kode berbahasa Indonesia, nama variabel (`wardJobs`, `inStrongbox`, `WrightProfilePanel`, `WARD_LABEL`, `WARD_DOT`, `FurnaceBlock`, …), nama file (`wright-profile-panel.tsx`, opsional ganti di CP7), key/enum, class `bg-ward-*`, dan id anchor `#seal` tidak diubah.
- Brand "Sigillum" juga dipakai untuk metadata dompet (`web3-provider.tsx`: `name`, `description`). `url`/`icons` tidak disentuh.
- **Weighhouse:** hanya label (judul "Reactor (burn)", baris "Grid reserve 20%", "Civic fund 10%", "Reactor 10%", teks "Vault"/"Reactor is cold"). Nama event on-chain (`JobFunded`, `SealSet`) dan field kontrak (`lampOilAmount`, `titheAmount`) di tooltip dibiarkan karena itu istilah kontrak.
- `city-scene.tsx`: hanya label hall → "Treasury · Civic fund". Palet/geometri tetap sampai CP9.

**Sengaja DIBIARKAN (BE, sesuai 1.4; catat untuk keputusan nanti):** teks yang dibuat server/log masih memakai istilah lama dan akan tetap terlihat di beberapa tempat:

| Lokasi | Contoh teks lama |
|---|---|
| `app/api/**` (pesan error) | "Rate the Wright (1-5) before setting the seal", "A Warden routes work…", "…not in the Ward you selected", "No Wright is assigned…" |
| `lib/supabase/queries.ts` (note event ledger + error) | "locked in the Strongbox", "Set the seal on-chain…", "Lamp Oil / tithe", actor "Furnace", "burned in the Furnace" |
| `lib/web3/set-the-seal.ts` (pesan ke user) | "Only the wallet that locked this wage can set the seal", "Recording the seal…" |
| `lib/agents/*` (event + prompt LLM) | "The Research Ward sends this brief…", "…stays safe in the Strongbox", "Awaiting your seal", prompt "Wright of the … Ward inside Wagehold" |

Data lama di DB tidak diubah. Bila ingin ikut diganti, putuskan lewat checkpoint terpisah (menyentuh `app/api`, `lib/*`).

**File CP6:** baru `lib/terms.ts`; diubah `types/domain.ts`, `app/layout.tsx`, `app/jobs/new/page.tsx`, `app/agents/[id]/page.tsx`, `app/login/page.tsx` (hanya footer), `app/dev/components/page.tsx`, `components/{agent-profile,city-scene,job-board,job-board-empty,job-card,job-detail,loader,patronage-section,post-job-form,realtime-city-dashboard,realtime-job-board,realtime-job-detail,revenue-split,web3-provider,wright-profile-panel}.tsx`, `components/ui/status-pill.tsx`, `components/weighhouse/weighhouse-client.tsx`.

**BELUM terverifikasi, mohon dicek di komputer Anda** (tanpa `node_modules` di lingkungan saya):

- [ ] `npm run lint` dan `npm run build` hijau
- [ ] `grep -rniE "wright|ward|strongbox|furnace|lamp oil|tithe|set the seal" app components` di luar `app/api`: sisa hanya yang tercatat di atas
- [ ] Alur simulasi: buat job → Press the Sigil → split tampil; tombol, tab ("Awaiting Sigil"), tooltip memakai istilah baru
- [ ] Form `/jobs/new`: label "District", opsi "Let the District's Steward choose", tombol "Lock wage in the Vault"
- [ ] Panel profil Mind dan `/agents/[id]`: chip district baru, "Steward" untuk lead
- [ ] Judul tab browser dan dialog dompet memakai "Sigillum"
- [ ] `/weighhouse`: label baru tampil, angka tidak berubah

**Selesai bila:** tidak ada istilah lama yang terlihat user di UI (di luar teks server yang tercatat).
**Commit:** `refactor(ui): sigillum terminology`

---

## CP7: Restyle halaman aplikasi  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Urutan (kerjakan satu per satu, commit per halaman):**

- [x] `/jobs`: `job-board`, `job-card`, `job-tabs`, `job-board-empty`, `realtime-job-board`
- [x] `/jobs/new`: `post-job-form`, `post-job-client`, `app/jobs/new/page.tsx`
- [x] `/jobs/[id]`: `job-detail`, `realtime-job-detail`
- [x] `/agents/[id]`: `agent-profile`, `agent-function`, `patronage-section`, `revenue-split` (`wright-profile-panel` **dipindah ke CP8**: dipakai dashboard, bukan halaman ini; ganti nama file ditunda)
- [x] `/weighhouse`: `weighhouse-client` saja. `charts`, `ui`, `format` **tidak ada di zip** (lihat catatan), jadi belum disentuh
- [x] `/login`: `login-form`, `app/login/page.tsx`

Untuk tiap halaman:
- Tambahkan `eyebrow` + judul serif di atas
- Panel → kaca + `ticks`
- Tombol & status → pill mono
- Input/select: border `line-2`, fokus emas, tetap `color-scheme: dark`
- **Jangan** ubah handler, state, query, atau alur wallet/escrow

**Penggabungan (sesi ini):** dasar = `Wagehold-cp1-5-merged`; di atasnya ditimpa `Wagehold-cp5-overlay` lalu `Wagehold-cp6-overlay` (tidak ada file yang bentrok selain `checkpoint.md`; dipakai versi CP6 karena paling lengkap), lalu CP7. Pekerjaan CP5 versi saya sebelumnya (yang belum rampung) **dibuang**; yang dipakai adalah CP5 milik Anda.

**Keputusan implementasi (CP7):**

- Dua komponen bersama baru: `components/ui/page-head.tsx` (`PageHead`: eyebrow mono + judul serif, `<em>` = italic emas, lede & aksi opsional; dibungkus `MotionHeader` oleh pemanggil agar ikut stagger) dan `components/ui/field.tsx` (`FIELD_INPUT`, `FIELD_LABEL`, `FIELD_HINT`, `SECTION_LABEL`: border `line-2`, fokus emas + ring tipis, `color-scheme: dark`). `FIELD_INPUT` sengaja **tanpa lebar** (`cn()` tanpa tailwind-merge); pemanggil menambah `w-full` / `w-28`.
- Tiap halaman: `PageHead` di atas, `Panel` utama memakai `ticks`, judul `PanelHeader` yang kembar dengan judul halaman dihapus (judulnya pindah ke `PageHead`, tombol aksinya ikut pindah).
- `/jobs`: `JobBoard` mendapat prop `showHeader` (default `true`). `/jobs` memberi `false`; pemakaian lain (dashboard lama) **tidak berubah**. Judul kartu job kini serif 19px, nilai wage emas mono, meta mono uppercase; tab = mono uppercase dengan garis emas.
- `/jobs/new`: teks klarifikasi "The Gate: …" (aturan lore §8) pindah jadi lede `PageHead`; kotak kuning/ungu `bg-surface-2` dibuang.
- `/jobs/[id]`: judul halaman = judul job (teks React, ter-escape); eyebrow `Job · {District} District`; tombol "← Job board".
- `/agents/[id]`: tombol "Hire {nama}" pindah ke `PageHead`; chip district diberi titik warna district; lebar dari `max-w-xl` → `max-w-2xl`. `StatBar` **tidak diubah** (dipakai dashboard juga; restyle di CP8).
- `RevenueSplit`: palet bar = palet donut/drawer landing (emas / es / lavender / ember), tidak lagi `#6C7392` / `good` / `crit`.
- Warna hardcoded yang dibersihkan: `#46507a` (job-card), `rgba(230,195,106,…)` (emas lama → `214,182,118`), `#6C7392` (revenue-split), palet `C` / `BUCKET_COLOR` / flare di Weighhouse → palet Sigillum.
- Sudut membulat besar (`rounded-md/lg/xl`) diganti `rounded-panel` (2px) di semua file CP7.
- **Tidak ada handler, state, query, atau alur wallet/escrow yang diubah** (hanya JSX/className, plus satu prop `showHeader`).

**Ketidaksesuaian yang ditemukan di zip dan diperbaiki di sini:**

- Catatan CP6 menyebut `components/weighhouse/weighhouse-client.tsx` dan `app/login/page.tsx` sudah berganti istilah/footer, tetapi **overlay CP6 tidak memuat keduanya**. Karena keduanya memang disentuh di CP7, perubahan CP6-nya saya terapkan sekalian: Weighhouse → "Reactor (burn)", "Grid reserve 20%", "Civic fund 10%", "Reactor 10%", "through the Vault", "The Reactor is cold", footer `TERMS.footerNote`; Login → footer `TERMS.footerNote`. Nama event/field kontrak di tooltip (`JobFunded`, `lampOilAmount`, …) tetap.

**File CP7:** baru `components/ui/page-head.tsx`, `components/ui/field.tsx`; diubah `components/{realtime-job-board,job-board,job-tabs,job-card,job-board-empty,post-job-form,post-job-client,realtime-job-detail,job-detail,agent-profile,agent-function,patronage-section,revenue-split,login-form}.tsx`, `components/ui/empty-state.tsx`, `components/weighhouse/weighhouse-client.tsx`, `app/jobs/new/page.tsx`, `app/agents/[id]/page.tsx`, `app/login/page.tsx`.

**Sengaja tidak disentuh:** `wright-profile-panel.tsx`, `stat-bar.tsx`, `ledger-wall.tsx`, `sparkline.tsx` (CP8); `city-scene.tsx` (CP9).

**Zip belum lengkap (masalah bawaan, bukan akibat CP7):** tidak ada `components/weighhouse/{charts,format,ui}`, `lib/weighhouse/metrics`, `lib/web3/addresses`, `app/weighhouse/`, `app/api/weighhouse/**`, dan tabel `chain_events` belum ada di `types/database.ts`. Akibatnya `tsc` melaporkan **14 error, semuanya di `weighhouse-client.tsx`, jumlah & jenisnya sama persis dengan sebelum CP7** (5 modul hilang, 1 nama tabel, 8 parameter `any` turunannya), dan halaman `/weighhouse` **tidak bisa dirender dari zip ini**. Warna di dalam grafik (`BurnChart`, `PriceChart`) ada di `charts.tsx` yang tidak saya punya, jadi belum diselaraskan; kirim file itu bila ingin ikut dikerjakan. Bila proyek lokal Anda lengkap, timpa hanya file CP7 (overlay), jangan seluruh zip.

**Terverifikasi (di lingkungan saya):**

- [x] `tsc --noEmit`: tidak ada error baru; satu-satunya error = 14 error Weighhouse di atas (sama dengan baseline)
- [x] `eslint` pada file CP7: 0 error/warning baru (sisa di proyek: 3 error + 1 warning bawaan di `city-scene.tsx`, `status-check.tsx`, `lib/supabase/realtime.ts`)
- [x] Tailwind mengompilasi 26 kelas kunci CP7 (`font-body`, `placeholder:text-ink-3`, `@3xl:rounded-panel`, `@3xl:hover:border-gold`, `[&_em]:italic`, `bg-ice/lav/ember`, `decoration-line-2`, dst.)

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` dan `npm run lint` hijau
- [ ] Alur simulasi utuh tetap jalan: `/jobs/new` → job muncul di `/jobs` → Mind mengerjakan → Review & Sigil → Press the Sigil → split tampil
- [ ] `/jobs`: judul + tombol "Post a job" di atas; tab, kartu (lebar ≥ 48rem jadi grid), empty state tampil rapi; tidak ada panel yang terpotong di tinggi layar kecil
- [ ] `/jobs/new`: label mono, input fokus emas, dropdown gelap; tombol "Lock wage in the Vault" aktif/nonaktif benar
- [ ] `/jobs/[id]`: judul job panjang tidak merusak layout; Deliverable/Job/Ledger setinggi sama di layar lebar; rating bintang & Send back tetap berfungsi
- [ ] `/agents/[id]`: Hire, stake/unstake, bar split, daftar Sealed jobs
- [ ] `/login`, `/weighhouse` (bila proyek lokal lengkap): tampil rapi, tick emas terlihat
- [ ] Panel kaca di atas latar `#05070d` terbaca (bila terlalu menyatu: `variant="solid"` di `panel.tsx`)
- [ ] `/` dan dashboard lama tidak berubah kecuali bar split (warna baru)
- [ ] Lebar 390px: `PageHead` membungkus rapi, tombol aksi turun ke bawah judul

**Selesai bila (tiap halaman):** alur lengkap tetap jalan (buat job → seal → split) pada mode simulasi.
**Commit:** satu commit per halaman, mis. `style(jobs): sigillum job board`

---

## CP8: Restyle City Dashboard  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Tujuan:** dashboard terlihat gaya Sigillum: kota penuh layar di belakang, panel kaca melayang di atasnya.

**File baru (3):** `components/ui/drawer.tsx`, `components/mind-profile-drawer.tsx`, `app/city/page.tsx`
**Diubah (8):** `app/globals.css`, `components/stat-bar.tsx`, `components/ledger-wall.tsx`, `components/landing/ledger-events.ts`, `components/realtime-city-dashboard.tsx`, `components/agent-profile.tsx`, `app/dev/components/page.tsx`, `app/page.tsx` (hanya komentar)
**Dihapus (2):** `components/wright-profile-panel.tsx` (diganti `mind-profile-drawer.tsx`), `app/_legacy-dashboard/page.tsx` (dipindah ke `app/city/page.tsx`)

- [x] Layout: kanvas kota `fixed` penuh layar (mulai 64px di bawah header agar kontrol/legenda scene tidak tertutup), panel kaca melayang: Ledger Wall kiri-bawah, Job Board kanan, deretan statistik di bawah. Wadah HUD `pointer-events-none`, tiap panel mengaktifkannya lagi, jadi kota tetap bisa diputar/diklik di sela panel
- [x] `.veil` (vignette) + `.scan` (garis tipis opacity .05, `mix-blend-mode: overlay`) di `globals.css`, `fixed`, `pointer-events-none`, di atas scene dan di bawah HUD. `.veil` memakai vignette simetris + gradien atas (HUD ada di kiri dan kanan, bukan satu kolom seperti HTML)
- [x] `stat-bar` → gaya `.stat`: panel kaca bertick, sel dipisah garis, label mono 10px, angka serif besar, satuan emas (`unit`). Animasi gulir saat angka berubah dipertahankan. Varian `inline` = tampilan lama, dipakai `agent-profile.tsx`
- [x] `ledger-wall` → gaya `.feed`: header mono + penanda Live, baris `waktu (UTC) | badge tipe berwarna | teks`, event baru turun dengan kilau emas yang memudar. Baris pribadi "You earned" diberi garis emas di kiri
- [x] Panel profil Mind → drawer (`.drawer`): kaca gelap + blur 22px, garis emas kiri, tombol tutup bulat, nama serif 46px, kotak "Current job" bertint emas. Stake/unstake, Bond, Hire, Full profile tetap
- [x] `useRealtimeChanges`, `useIdentity`, `useWageBalance`, dan semua state/handler di `realtime-city-dashboard.tsx` tidak diubah; hanya JSX layout, pembentukan baris ledger, dan state `selectedId`

**Keputusan implementasi (CP8):**

- **Route sementara `/city`.** `/` sekarang landing (CP4/CP5) dan dashboard tidak punya route sejak CP4, jadi tidak bisa dicoba. Isi `app/_legacy-dashboard` dipindah ke `app/city/page.tsx`. Ini menyimpang dari keputusan CP0 #6 ("tidak ada `/city`"); anggap **sementara**, dihapus saat dashboard dilebur ke `/` (CP9). Tautan nav tidak ditambah.
- **Drawer tertutup sampai gedung diklik.** Dulu panel kiri selalu terbuka dengan Mind revenue tertinggi. Menutup drawer (tombol / Esc) juga menghapus sorotan gedung.
- **Drawer non-modal** (tanpa backdrop, tanpa kunci scroll/fokus): gedung lain tetap bisa diklik dan isinya berganti. Drawer landing (CP5) tetap modal. Dua implementasi fokus/Esc kini ada (`landing/mind-drawer.tsx` dan `ui/drawer.tsx`); satukan di CP10.
- **Ledger Wall tanpa HTML.** Baris dibangun dari `type` event + judul job lewat `describeWallEvent` (tambahan di `landing/ledger-events.ts`), dengan istilah Sigillum. `note` dari DB tidak ditampilkan karena masih memuat istilah lama (Strongbox/Furnace/...; sumbernya `lib/`/`app/api` yang tidak boleh diubah). Akibatnya `dangerouslySetInnerHTML` dan `escapeHtml` tidak lagi dipakai di dashboard; `types/domain.ts` `LedgerEvent` dan `lib/escape-html.ts` kini tak terpakai (hapus di CP10).
- Ledger Wall sekarang benar-benar dirender di dashboard (dulu hanya 4 baris ringkas menumpuk di dasar kota; komponen `LedgerWall` tidak dipakai). Mini-stack lama dihapus.
- Waktu di Ledger Wall dalam **UTC** (deterministik, menghindari hydration mismatch).
- Layar <1024px: HUD bisa di-scroll, 34vh teratas dibiarkan terbuka untuk kota, urutan: statistik → Job Board → Ledger.
- `sparkline.tsx` tidak diubah: tidak dipakai di dashboard, hanya di `/dev/components`, dan sudah memakai token emas.
- Kontrol scene (legenda district, tombol Auto/rotate) masih gaya terang milik `city-scene.tsx` (CP9).

**Terverifikasi (di lingkungan saya):**

- [x] `tsc --noEmit`: tidak ada error baru (hanya 14 baris bawaan di `weighhouse-client.tsx`, modul Weighhouse tidak ada di zip)
- [x] `eslint components app lib`: tidak ada error/warning baru (3 error + 2 warning bawaan di `city-scene.tsx`, `status-check.tsx`, `lib/supabase/realtime.ts`, tidak disentuh)
- [x] Tailwind mengompilasi semua kelas baru (`.veil`, `.scan`, `max-lg:order-*`, `lg:grid-cols-[minmax(0,460px)_...]`, `bg-gold/[0.04]`, `w-[min(430px,100vw)]`, dst.)
- [x] Render server `StatBar` + `LedgerWall` (16 tipe event): tanpa error; judul job berisi `<b>` ter-escape jadi teks

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` dan `npm run lint` hijau
- [ ] `/city` di 1440 / 1100 / 860 / 390px: kota penuh layar, panel tidak menutupi kontrol scene (kanan-atas) dan legenda (kiri-atas), kota tetap bisa diputar di sela panel
- [ ] Mode siang (langit terang) di bawah `.veil`: teks panel tetap terbaca (palet siang dirapikan di CP9)
- [ ] Klik gedung → drawer meluncur dari kanan; klik gedung lain → isi berganti; Esc / tombol ✕ menutup dan sorotan gedung hilang
- [ ] Stake / unstake di drawer (mode simulasi) berjalan; angka pool dan "Staked by patrons" ikut berubah lewat Realtime
- [ ] Event baru masuk di Ledger Wall (buat job → seal): baris turun dari atas, badge tipe benar
- [ ] Job Board (kanan): Set Sigil / Send back tetap jalan
- [ ] Statistik bawah berubah dengan animasi gulir; "Your wallet" muncul hanya di mode wallet
- [ ] Performa: beberapa `backdrop-filter` di atas canvas WebGL; turunkan ke `variant="solid"` bila FPS jatuh

**Selesai bila:** dashboard terlihat gaya Sigillum, realtime & stake/payout tetap bekerja.
**Commit:** `style(dashboard): sigillum city dashboard`

---

## CP9: Scene 3D (**risiko tertinggi, kerjakan terakhir**)  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Dua pendekatan, pilih di CP0:**

**A. Restyle scene lama (disarankan).** Pertahankan `city-scene.tsx`; ubah:
- [ ] Palet langit/kabut/cahaya menuju `#05070d` + emas/es
- [ ] Warna gedung per district (hex baru)
- [ ] Label district → pill kaca (`.dlabel`) dengan titik berwarna
- [ ] Tooltip hover (`.tip`) gaya mono + nama serif
- [ ] Hapus/ganti elemen yang spesifik "Counting House" bila diputuskan di CP0

**B. Port scene HTML.** Scene HTML memakai three r160, `OrbitControls`, kamera mengikuti `data-cam` per section. Perlu:
- [ ] Pindahkan ke komponen client + `dynamic(() => import(...), { ssr:false })`
- [ ] Sesuaikan ke three 0.184 (cek perubahan API: renderer, color management, `examples/jsm` → `three/examples/jsm`)
- [ ] Sinkronkan kamera dengan scroll
- [ ] Hubungkan data nyata (tinggi gedung = revenue; saat ini `1.2 + revenue30d/2150`)
- [ ] Bersihkan semua geometry/material/listener saat unmount (hindari memory leak)

Untuk keduanya:
- [ ] Fallback `no-webgl` (gradien) bila WebGL gagal / timeout 8 detik
- [ ] `prefers-reduced-motion`: matikan auto-rotate
- [ ] Mobile: turunkan `devicePixelRatio`, kurangi jumlah objek
- [ ] Cek FPS (target ≥ 45 di laptop menengah)

**Selesai bila:** scene stabil, tidak bocor memori, fallback bekerja.
**Commit:** `feat(scene): sigillum city scene`


### Hasil CP9 (opsi B: port scene HTML)

**File baru (6):** `lib/city/sigillum-scene.ts` (port scene, ±900 baris), `lib/city/scene-config.ts` (tipe, kamera per section, `daylightAt`), `lib/city/bus.ts` (jembatan scene <-> landing), `components/city/city-stage.tsx` (kanvas, label, tooltip), `components/city/city-shell.tsx` (Loader + `next/dynamic` ssr:false + fallback gradien + veil)
**Diubah (4):** `app/page.tsx` (`<CityShell minds=... />` menggantikan Loader + gradien sementara; `<main className="city-main">`), `components/landing/districts.tsx` (kartu/drawer terhubung ke scene), `app/globals.css` (`.city-*`, `.veil-landing`, `.dlabel`, `.city-tip`), `checkpoint.md`
**Tidak disentuh:** `city-scene.tsx` lama + `/city` (lihat keputusan di bawah), semua BE.

- [x] Port: gedung instancing + shader jendela/lantai, spire Vault + cincin + orb, paket data, lalu lintas, debu & bintang, bloom (three 0.184, `three/examples/jsm/...`)
- [x] Data nyata: menara = baris `agents` (4 slot per district, steward di slot terdekat; kelebihan >4 per district tidak punya menara). Tinggi 0.85x-1.2x desain slot, naik halus mengikuti revenue (saturasi ~1500 WAGE); kilau dasar: mind `working/review` = 0.5, selain itu naik dengan akar revenue (maks 0.3). Nama/kode menara di tooltip = `agents.name` / `agents.code`, lewat `textContent` (tanpa innerHTML)
- [x] Kamera mengikuti scroll (`SECTION_CAMS`, id section `top, manifesto, districts, protocol, economy, charter, ledger, build, end`); label district muncul di `top` & `districts`
- [x] Interaksi dua arah: klik kartu/judul district -> kamera terbang ke district; klik nama mind -> drawer + kamera ke menara + cincin penanda; klik menara di kota -> buka drawer; klik label district -> sorot kartu; pindah section menghapus sorotan district; tutup drawer kembali ke sorotan district / overview
- [x] **Siang/malam otomatis** (keputusan CP0 #4): uniform `uDay` dari jam lokal (fajar 05:15-06:45, senja 17:15-18:45, transisi mulus). Mengatur langit, kabut, matahari (arah ikut naik), hemisphere, rim, exposure, bloom, jendela menyala, titik cahaya, bintang. Bayangan & refleksi dibangun ulang hanya bila siang bergeser >0.06
- [x] Teks terbaca di siang: `.veil-landing::after` menebal mengikuti `--day` (diisi scene)
- [x] Cleanup: semua geometry/material/InstancedMesh/PMREM/composer/renderer di-dispose, listener dilepas, `forceContextLoss`; kanvas dibuat imperatif per mount (aman StrictMode)
- [x] Fallback `no-webgl`: gagal membuat renderer / `webglcontextlost` / tak siap dalam 8,5 dtk -> kanvas dibuang, gradien tetap tampil, loader tertutup, halaman jalan normal
- [x] `prefers-reduced-motion`: auto-rotate mati, waktu animasi diperlambat, perpindahan siang/malam langsung
- [x] Mobile (<=760px): DPR maks 1.3, bayangan 1024, titik/paket/lalu lintas dikurangi, FOV 56, kanvas `touch-action: pan-y`
- [x] Konten landing tidak menangkap pointer kecuali elemen interaktif (`.city-live .city-main`), jadi kota bisa diputar & menaranya diklik di sela konten

**Keputusan implementasi (CP9):**

- **`/city` dan `city-scene.tsx` lama dipertahankan.** Dashboard stake/job board yang dibangun di CP8 hanya ada di `/city`; menghapusnya sekarang memutus fitur stake di drawer. Landing `/` sudah menampilkan data nyata + drawer Mind dengan "Full profile" ke `/agents/[id]`. Nasib `/city` (hapus, atau ganti sceneNya dengan scene baru) diputuskan di CP10.
- Data mind di scene adalah snapshot render server (`revalidate = 0`). Status/revenue tidak bergerak lewat Realtime di `/` (ledger preview tetap realtime).
- Tidak ada `.veil`/`.scan` CP8 di landing; landing memakai `.veil-landing` (vignette + gradien kiri seperti `sigillum.html`).

**Terverifikasi (di lingkungan saya):**

- [x] `tsc --noEmit`: 0 error di luar `weighhouse-client.tsx`; `eslint lib/city components/city components/landing app/page.tsx`: bersih
- [x] Scene dibundel dengan esbuild dan dijalankan di Chromium headless (WebGL software): semua shader terkompilasi tanpa error, frame pertama tergambar (`ready`), 20 menara + kota + Vault tampil; diuji malam (22:00) dan siang (12:00); `focusMind` / `focusDistrict` memindah kamera dan menyorot menara; `dispose()` tidak melempar error
- [ ] *(tidak bisa di sandbox: Google Fonts tidak terjangkau)* `npm run build` penuh

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run build` dan `npm run lint` hijau
- [ ] `/`: loader menutup setelah kota tampil; scroll menggerakkan kamera di tiap section; tidak ada error di console / hydration
- [ ] FPS di laptop menengah (target >= 45) dan di HP; bila berat: turunkan `PR` / `mapSize` / matikan bloom di `sigillum-scene.ts`
- [ ] Klik menara membuka drawer; klik kartu district menerbangkan kamera; "Return to overview" kembali; Esc menutup drawer dan kamera kembali
- [ ] Teks landing terbaca di siang (ubah jam sistem ke 12:00) dan di malam
- [ ] Matikan WebGL (flag browser) atau reduced-motion: gradien tampil, halaman tetap bisa dipakai, kota tidak berputar
- [ ] Panel/kartu dan tombol tetap bisa diklik; wheel/scroll dan sentuhan di atas kota tetap menggulir halaman
- [ ] Pindah halaman lalu kembali ke `/`: tidak ada kebocoran (jumlah konteks WebGL di DevTools tidak bertambah)

**Commit:** `feat(scene): sigillum city scene`

---

## CP10: Responsif, a11y, performa, bersih-bersih  ◐ KODE SELESAI, MENUNGGU VERIFIKASI LOKAL

**Batasan sesi ini:** registry npm diblokir kebijakan jaringan sandbox, jadi `npm install`, `next build`, ESLint, tsc penuh, Lighthouse, dan screenshot tidak bisa dijalankan. Yang dicek di sini hanya sintaks file yang diubah (`ts.transpileModule`, 0 error), keseimbangan kurung CSS, resolusi semua impor `@/…` (hanya 2 modul Weighhouse yang memang tidak ada di zip), dan perhitungan kontras. **Semua butir yang butuh browser/build tetap tercentang kosong di bawah.**

**Diubah (9):** `app/globals.css`, `app/layout.tsx`, `app/page.tsx` (komentar), `components/ui/drawer.tsx`, `components/landing/mind-drawer.tsx`, `components/landing/districts.tsx`, `components/landing/economy.tsx`, `components/job-tabs.tsx`, `types/domain.ts`, `README.md`, 3 komentar di `lib/` (`landing-stats.ts`, `landing-minds.ts`, `city/scene-config.ts`)
**Dihapus (6):** `app/city/page.tsx`, `components/realtime-city-dashboard.tsx`, `components/city-scene.tsx`, `components/city-scene.three.tsx.bak`, `components/mind-profile-drawer.tsx`, `lib/escape-html.ts`

- [x] **Kontras:** `ink-3` / `faint` .44 → **.58** (3,7:1 → 5,2–5,8:1 di atas bg/surface-2/kaca terang; AA 4,5:1). `ink-4` (.22 ≈ 1,7:1) kini **hanya dekorasi**; dua pemakaian sebagai teks (label "formerly …" di kartu district, angka di `job-tabs`) dipindah ke `ink-3`. Label tengah donut .45 → .62
- [x] **Fokus:** aturan global `:focus-visible` emas (CP1) sudah ada dan tidak ditimpa `outline-none` kecuali segmen donut (yang menandai fokus lewat tebal garis + teks tengah)
- [x] **Drawer disatukan:** `landing/mind-drawer.tsx` kini memakai `ui/drawer.tsx` (`modal`). Perbaikan di `Drawer`: `onClose` lewat ref (sebelumnya prop yang berubah tiap render, mis. `close` di `districts.tsx`, memicu effect ulang dan mengingat pemicu fokus yang salah), latar `inert` selama modal terbuka, isi terakhir dipertahankan saat animasi keluar. Lebar 460 → 430px (sama dengan `.drawer` di sigillum.html)
- [x] **Reduced-motion:** reveal, counter, scene, StatusPill, MotionConfig sudah ditangani (CP5/CP8/CP9). Tambahan: cahaya `animate-flow` di Protocol disembunyikan (jika animasi dipaksa selesai ia akan diam di ujung kanan)
- [x] **Font:** `display: "swap"` eksplisit untuk ketiganya; Geist Mono `preload: false` (hanya label kecil). Subset sudah `latin` saja. Instrument Serif hanya weight 400; Geist/Geist Mono variable (satu berkas per gaya, tidak ada weight tak terpakai yang diunduh)
- [x] **Hapus `city-scene.three.tsx.bak`** (cadangan tetap ada di zip CP1–9 dan git Anda)
- [x] **Nasib `/city`: dihapus** sesuai keputusan CP0 #6. Stake/unstake, Bond, dan sealed jobs tetap ada di `/agents/[id]` (tombol "Full profile" di drawer); Job Board dan Press the Sigil di `/jobs`. Ikut dihapus: dashboard lama, scene lama (2029 baris), `mind-profile-drawer`. `StatBar`, `LedgerWall`, `Sparkline` dipertahankan (dipakai `agent-profile` dan galeri `/dev/components`)
- [x] Kode mati: `LedgerEvent` (`types/domain.ts`) dan `lib/escape-html.ts` dihapus (tak ada pemakai)
- [x] **README.md:** catatan antarmuka Sigillum + tabel istilah (kode vs UI), layout proyek, tumpukan font/3D, bagian aksesibilitas & motion, langkah buka `/`. Nama kontrak/DB/ABI tetap Wagehold
- [ ] `WEIGHHOUSE_NOTES.md` **tidak ada di zip** (hanya `README.md` dan `E2E_TESTNET.md`): belum diperbarui. Kirim berkasnya bila ingin ikut diperbarui
- [ ] Screenshot "after" di `docs/after/` dan perbandingan dengan `docs/before/`: butuh browser + build, kerjakan di komputer Anda

**BELUM terverifikasi, mohon dicek di komputer Anda:**

- [ ] `npm run lint && npm run build` hijau (tidak ada lagi referensi ke `components/city-scene`, `realtime-city-dashboard`, `mind-profile-drawer`, `app/city`; bila build mengeluh, cek impor yang tertinggal)
- [ ] Uji lebar 360 / 560 / 860 / 1100 / 1440 px di `/`, `/jobs`, `/jobs/new`, `/jobs/[id]`, `/agents/[id]`, `/weighhouse`, `/login`: tidak ada scroll horizontal (pindai statis: tabel Weighhouse sudah dibungkus `overflow-x-auto`, drawer `w-[min(430px,100vw)]`)
- [ ] Drawer Mind (di `/`): buka dari kartu dan dari menara; Tab/Shift+Tab berputar di dalam; Esc dan klik di luar menutup; fokus kembali ke tombol/kartu pemicu; Tab tidak menjangkau header/halaman di belakang; scroll halaman terkunci
- [ ] Keyboard: seluruh halaman bisa dijelajah dengan Tab; cincin fokus emas terlihat di tombol, tautan, kartu district, segmen donut, slider
- [ ] Kontras: teks kecil (label mono, "formerly …", hint) terbaca di malam dan di siang (jam sistem 12:00) di atas scene
- [ ] Reduced-motion (OS atau DevTools "Emulate prefers-reduced-motion"): konten langsung tampil, angka hero tidak menghitung, kota tidak berputar, tidak ada glow di timeline Protocol
- [ ] Font: judul serif tampil (bukan Times), tidak ada lompatan layout besar saat font masuk (CLS)
- [ ] Lighthouse mobile: Performance ≥ 80, Accessibility ≥ 95. Bila Performance kurang: turunkan `PR` / `mapSize` / matikan bloom di `lib/city/sigillum-scene.ts`, atau turunkan jumlah panel `backdrop-filter`
- [ ] axe / Lighthouse a11y: perhatikan peran `dialog`, label tombol, dan kontras teks di atas panel kaca

**Catatan keputusan:** `/dev/components` (galeri uji) masih ada. Hapus atau lindungi (mis. `notFound()` di production) sebelum rilis publik bila tidak ingin terekspos.

**Commit:** `chore: polish, a11y, docs for sigillum redesign`

---

## 2. Aturan kerja per sesi

1. Buka dokumen ini, ambil **satu** checkpoint.
2. Kerjakan hanya file yang tercantum di checkpoint itu.
3. Jalankan `npm run lint && npm run build`.
4. Cek manual di browser (desktop + lebar 390px).
5. Commit dengan pesan yang tertera → centang kotak → isi log di bawah.
6. Bila rusak: `git revert <hash>`. Jangan menumpuk perbaikan di checkpoint lain.

## 3. Log perubahan

| Tanggal | CP | Commit | Catatan / masalah |
|---|---|---|---|
| 2026-10-13 | 0 | (isi hash) | Keputusan terkunci: Sigillum penuh, `/` = kota 3D + dashboard menyatu, port scene HTML, siang/malam dipertahankan, logo segel SVG |
| 2026-10-13 | 1 | (isi hash) | Token & font. 4 file. tsc bersih. Body 16px ditunda |
| 2026-10-13 | 2 | (isi hash) | Primitif UI. 8 file (1 baru). tsc bersih; build/lint/visual menunggu verifikasi lokal |
| 2026-10-13 | 3 | (isi hash) | Shell global: header di layout, footer per halaman, loader di `/`. 16 file (3 baru). eslint & tsc bersih di file CP3; build/visual menunggu verifikasi lokal |
| 2026-10-13 | 4 | (isi hash) | Landing statis di `app/page.tsx`, 9 section + copy.ts. 12 file baru, 2 diubah. Dashboard lama dipindah ke `app/_legacy-dashboard` (tidak di-route). eslint & tsc bersih; build/visual menunggu verifikasi lokal |
| 2026-10-14 | 5 | (isi hash) | Landing interaktif: reveal, counter, kalkulator+donut, district+drawer Mind, ledger nyata+realtime, nav aktif. 8 file baru, 14 diubah. Zip belum memuat 5 butir pertama, ditulis ulang. Belum dijalankan (tanpa node_modules); build/lint/visual menunggu verifikasi lokal |
| 2026-10-14 | 6 | (isi hash) | Istilah Sigillum: `lib/terms.ts`, WARD_LABEL/RANK_LABEL, ±25 file diubah (hanya teks tampil). Teks dari `app/api`, `lib/supabase`, `lib/web3`, `lib/agents` sengaja tidak diubah (dicatat). Belum dijalankan; build/lint menunggu verifikasi lokal |
| 2026-10-14 | 7 | (isi hash) | Restyle halaman aplikasi: PageHead + field bersama, 6 halaman, 2 file baru + 19 diubah. Overlay CP5/CP6 digabung ke merged cp1-5 lebih dulu. CP6 yang tertinggal di weighhouse-client & login ikut diterapkan. tsc/eslint: tidak ada error baru; zip tidak memuat modul Weighhouse (14 error bawaan). Build/visual menunggu verifikasi lokal |
| 2026-10-14 | 8 | (isi hash) | Dashboard kota: kanvas penuh + HUD kaca, veil/scan, StatBar/LedgerWall/drawer Mind bergaya Sigillum. 3 file baru, 8 diubah, 2 dihapus. Route sementara `/city`. tsc/eslint: tidak ada error baru. Build/visual menunggu verifikasi lokal |
| 2026-10-14 | 9 | (isi hash) | Port scene 3D: `lib/city/*`, `components/city/*`, kamera mengikuti scroll, siang/malam, fallback no-webgl. Dibundel & dijalankan di Chromium headless (shader OK). Build penuh menunggu verifikasi lokal |
| 2026-10-14 | 10 | (isi hash) | Polish: kontras ink-3 .58, drawer disatukan (`ui/drawer` + inert), `/city` + scene lama + kode mati dihapus (6 berkas), font swap, README. Sandbox tanpa akses npm: build/lint/Lighthouse/visual BELUM dijalankan |
| | | | |

## 4. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Rename istilah menyentuh logika/DB | Fitur rusak | Rename **hanya label**; enum, kolom, ABI tetap (1.4) |
| Warna district dobel (CSS + hex di `domain.ts`) | Warna tidak sinkron | Ubah keduanya dalam satu commit (CP1) |
| `city-scene.tsx` 2029 baris | Regresi 3D, memory leak | Dikerjakan terakhir; pilih restyle, bukan tulis ulang |
| Tailwind v4 `@theme` vs CSS custom property HTML | Kelas tidak terbentuk | Definisikan token di `@theme`, bukan `:root` biasa |
| `backdrop-filter` berat di perangkat lemah | FPS turun | Batasi jumlah panel blur, sediakan fallback solid |
| SSR hydration (counter, tema siang/malam, `window`) | Warning/mismatch | Komponen client + `useEffect`, `dynamic ssr:false` untuk 3D |
| `backdrop-filter` di banyak Panel + animasi `transform` motion | Kedip / FPS turun | Pantau di CP7-CP8; fallback `variant="solid"` |
| Teks HTML hardcoded (angka statistik) tampil ke user | Informasi menyesatkan | Wajib dari data nyata (CP5) |
| Scene lama punya mode siang/malam, HTML hanya malam | Palet "Sigillum" dirancang untuk malam; versi siang bisa terlihat janggal | Keputusan: dipertahankan otomatis. Rancang palet siang sendiri di CP9 (langit, kabut, cahaya) dan uji kontras teks overlay di kedua mode |

## 5. Pertanyaan terbuka (jawab sebelum CP4)

1. Brand akhir "Sigillum" atau tetap "Wagehold"?
2. Landing di `/` menggantikan dashboard, atau dashboard tetap di `/`?
3. Mode siang/malam dipertahankan?
4. Konten "Foundations" (46/46 tests, chain ID) tetap ditampilkan di landing?
5. Domain/link sosial final (X, GitHub) apa?
