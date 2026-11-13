-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- One private row per signed-in user. Row Level Security means each person can only ever read or change their own row.
create table if not exists public.user_data (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users manage only their own data" on public.user_data
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_data to authenticated;
