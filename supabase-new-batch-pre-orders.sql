-- ============================================================
-- Tables: new_batch_orders + new_batch_order_items
-- Jersey DLOB New Batch pre-order (multi-item support)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop old single-row table if it exists
drop table if exists public.new_batch_pre_orders cascade;

-- ── Order header ──────────────────────────────────────────────
create table if not exists public.new_batch_orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Customer info
  nama          text not null,
  no_wa         text not null,

  -- Totals
  total_harga   integer not null,
  jumlah_item   integer not null default 1,

  -- Status
  status        text not null default 'pending'
                  check (status in ('pending','confirmed','paid','produced','delivered','cancelled'))
);

-- ── Order line items ──────────────────────────────────────────
create table if not exists public.new_batch_order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.new_batch_orders(id) on delete cascade,
  created_at    timestamptz not null default now(),

  warna         text not null check (warna in ('biru', 'kuning', 'merah')),
  ukuran        text not null, -- 'XS'..'3XL', 'Kids S'..'Kids XL', 'Balita XS'..'Balita XL'
  lengan        text not null default 'pendek' check (lengan in ('pendek', 'panjang')),
  nama_punggung text,
  tanpa_nama_punggung boolean not null default false,
  harga         integer not null
);

-- Migration helper if table already exists
alter table if exists public.new_batch_order_items drop constraint if exists new_batch_order_items_ukuran_check;

-- ── Row Level Security ────────────────────────────────────────
alter table public.new_batch_orders enable row level security;
alter table public.new_batch_order_items enable row level security;

-- Anyone can INSERT orders (public pre-order form)
create policy "Allow public insert orders"
  on public.new_batch_orders for insert
  to anon, authenticated with check (true);

create policy "Allow public insert items"
  on public.new_batch_order_items for insert
  to anon, authenticated with check (true);

-- Only service role can SELECT
create policy "Service role select orders"
  on public.new_batch_orders for select
  to service_role using (true);

create policy "Service role select items"
  on public.new_batch_order_items for select
  to service_role using (true);
