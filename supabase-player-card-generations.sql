-- Player Card generations table
-- Run this in Supabase SQL Editor before using the Vertex-backed player card flow.

create extension if not exists pgcrypto;

create table if not exists public.player_card_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_name text not null,
  template_id text not null check (template_id in ('official', 'noir')),
  theme_id text not null check (theme_id in ('navy', 'noir', 'emerald', 'crimson', 'violet', 'gold')),
  status text not null default 'processing' check (status in ('processing', 'generated', 'completed', 'failed')),
  source_image_url text,
  background_image_url text,
  final_card_url text,
  generation_prompt text,
  failure_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_player_card_generations_user_id on public.player_card_generations(user_id);
create index if not exists idx_player_card_generations_status on public.player_card_generations(status);
create index if not exists idx_player_card_generations_created_at on public.player_card_generations(created_at desc);

create or replace function public.update_player_card_generations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_player_card_generations_updated_at on public.player_card_generations;
create trigger trg_player_card_generations_updated_at
before update on public.player_card_generations
for each row
execute function public.update_player_card_generations_updated_at();

alter table public.player_card_generations enable row level security;

drop policy if exists "Users can view own player card generations" on public.player_card_generations;
create policy "Users can view own player card generations"
on public.player_card_generations
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own player card generations" on public.player_card_generations;
create policy "Users can insert own player card generations"
on public.player_card_generations
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own player card generations" on public.player_card_generations;
create policy "Users can update own player card generations"
on public.player_card_generations
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
