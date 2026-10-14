# Weighhouse: cara pasang

Timpa file di zip ini ke project (struktur folder sama). JANGAN timpa `components/weighhouse/weighhouse-client.tsx`
(file itu sudah ada di project Anda; zip ini hanya menambah file yang diimpornya).

1. `types/database.ts`: terapkan `types-database.patch` (`git apply types-database.patch`) atau tambahkan
   manual tabel `chain_events`, `price_snapshots`, `supply_snapshots`, `indexer_state`, fungsi
   `weighhouse_totals`, dan kolom `jobs.chain_job_id`. Kalau file Anda sudah punya, lewati.
2. Jalankan `supabase/migrations/0014_weighhouse.sql` di Supabase (SQL Editor atau `supabase db push`).
3. Env (lihat `env.weighhouse.example`): minimal `CRON_SECRET` dan `WEIGHHOUSE_DEPLOY_BLOCK`.
4. Cron di Supabase: buka `supabase/weighhouse_cron.sql`, ganti domain dan `CRON_SECRET` (harus sama
   dengan env di Vercel), lalu jalankan sekali di SQL Editor. Job `pg_cron` memanggil
   `/api/cron/index-chain` tiap menit lewat `pg_net`. Tidak perlu `vercel.json`, jadi tidak ada
   batasan cron harian di Vercel Hobby.
5. Isi `WEIGHHOUSE_V4_POOL_ID` setelah token graduate untuk harga on-chain dan volume trading.
