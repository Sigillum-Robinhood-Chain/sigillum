-- The Weighhouse ($WAGE monitor) -- brief Wagehold-Weighhouse-devbrief.md §5.4.
-- Jalankan setelah 0001-0013. Aman dijalankan ulang.
--
-- Semua tabel baru HANYA bisa dibaca browser (policy SELECT publik, data on-chain memang
-- publik). Penulisan hanya lewat cron /api/cron/index-chain dengan service role.

create table if not exists chain_events (
  tx_hash text not null,
  log_index int not null,
  block_number bigint not null,
  block_time timestamptz not null,
  contract text not null,
  event text not null,
  chain_job_id text,
  amount numeric(78,0),
  args jsonb not null,
  primary key (tx_hash, log_index)
);
create index if not exists chain_events_event_time_idx on chain_events (event, block_time desc);
create index if not exists chain_events_time_idx on chain_events (block_time desc);
create index if not exists chain_events_job_idx on chain_events (chain_job_id);

create table if not exists price_snapshots (
  taken_at timestamptz primary key,
  price_usd numeric,
  price_eth numeric,
  liquidity_usd numeric,
  volume_wage numeric(78,0),
  source text not null
);

create table if not exists supply_snapshots (
  taken_at timestamptz primary key,
  block_number bigint not null,
  total numeric(78,0),
  burned numeric(78,0),
  curve numeric(78,0),
  lp numeric(78,0),
  locker numeric(78,0),
  strongbox numeric(78,0),
  splitter numeric(78,0),
  treasuries numeric(78,0),
  circulating numeric(78,0)
);

create table if not exists indexer_state (
  key text primary key,
  last_block bigint not null
);

-- jobId on-chain = keccak256(bytes(uuid)); disimpan supaya ledger bisa menaut ke /jobs/[id].
alter table jobs add column if not exists chain_job_id text unique;

-- RLS: baca publik, tulis hanya service role (melewati RLS).
alter table chain_events enable row level security;
alter table price_snapshots enable row level security;
alter table supply_snapshots enable row level security;
alter table indexer_state enable row level security;

drop policy if exists "chain events are publicly readable" on chain_events;
create policy "chain events are publicly readable" on chain_events for select using (true);
drop policy if exists "price snapshots are publicly readable" on price_snapshots;
create policy "price snapshots are publicly readable" on price_snapshots for select using (true);
drop policy if exists "supply snapshots are publicly readable" on supply_snapshots;
create policy "supply snapshots are publicly readable" on supply_snapshots for select using (true);
-- indexer_state: tanpa policy = tidak terbaca browser.

revoke insert, update, delete, truncate on table public.chain_events from anon, authenticated;
revoke insert, update, delete, truncate on table public.price_snapshots from anon, authenticated;
revoke insert, update, delete, truncate on table public.supply_snapshots from anon, authenticated;
revoke all on table public.indexer_state from anon, authenticated;

-- Realtime: ledger dan counter Weighhouse bergerak saat event baru masuk.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chain_events'
  ) then
    alter publication supabase_realtime add table chain_events;
  end if;
end $$;

-- Total per jenis event di satu jendela waktu (dijumlah di Postgres supaya numeric(78,0)
-- tetap presisi dan halaman tidak menarik ribuan baris). p_since null = sepanjang waktu.
create or replace function weighhouse_totals(p_since timestamptz default null)
returns table (
  event text,
  n bigint,
  amount_sum numeric,
  patron_sum numeric,
  lamp_sum numeric,
  tithe_sum numeric,
  burn_sum numeric,
  refund_sum numeric
)
language sql
stable
as $$
  select
    e.event,
    count(*)::bigint,
    coalesce(sum(e.amount), 0),
    coalesce(sum((e.args->>'patronAmount')::numeric), 0),
    coalesce(sum((e.args->>'lampOilAmount')::numeric), 0),
    coalesce(sum((e.args->>'titheAmount')::numeric), 0),
    coalesce(sum((e.args->>'burnAmount')::numeric), 0),
    coalesce(sum((e.args->>'refundAmount')::numeric), 0)
  from chain_events e
  where p_since is null or e.block_time >= p_since
  group by e.event
$$;

grant execute on function weighhouse_totals(timestamptz) to anon, authenticated, service_role;
