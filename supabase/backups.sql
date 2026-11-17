-- Optional but recommended: run once in Supabase (SQL Editor > New query > paste > Run).
-- Keeps dated copies of your data so a mistaken reset or import can be undone from Settings > Recover data.
create table if not exists public.user_backups (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  reason        text,
  expense_count int not null default 0,
  data          jsonb not null
);

alter table public.user_backups enable row level security;

create policy "Users manage only their own backups" on public.user_backups
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on public.user_backups to authenticated;
