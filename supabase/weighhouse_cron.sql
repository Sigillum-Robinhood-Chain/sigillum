-- Cron Weighhouse di Supabase (pg_cron + pg_net) -- jalankan SEKALI di SQL Editor.
-- Ini BUKAN migrasi: berisi URL dan rahasia milik environment Anda, jadi jangan di-commit
-- dengan nilai asli. Prasyarat: migrasi 0014 sudah jalan, app sudah ter-deploy, dan
-- CRON_SECRET di env Vercel bernilai SAMA dengan yang dimasukkan di bawah.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Simpan URL + rahasia di Vault (terenkripsi, tidak muncul di definisi job).
--    Kalau nama sudah ada (jalan ulang), pakai vault.update_secret(id, ...) atau hapus dulu.
select vault.create_secret('https://GANTI-DOMAIN-ANDA.vercel.app', 'weighhouse_site_url');
select vault.create_secret('GANTI-DENGAN-CRON_SECRET', 'weighhouse_cron_secret');

-- 2. Jadwal tiap menit: memanggil route indexer di app (event + snapshot suplai + harga).
select cron.schedule(
  'weighhouse-index-chain',
  '* * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'weighhouse_site_url')
           || '/api/cron/index-chain',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'weighhouse_cron_secret')
    ),
    timeout_milliseconds := 55000
  );
  $$
);

-- Cek jalannya job dan balasan route:
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
--   select status_code, left(content::text, 300) as body, created from net._http_response order by created desc limit 5;
-- Hentikan:
--   select cron.unschedule('weighhouse-index-chain');
