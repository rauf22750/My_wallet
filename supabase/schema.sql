-- Run once in the Supabase SQL Editor.
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
revoke all on public.wallets from anon;
grant select, insert, update, delete on public.wallets to authenticated;
drop policy if exists "Read own wallet" on public.wallets;
create policy "Read own wallet" on public.wallets for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own wallet" on public.wallets;
create policy "Create own wallet" on public.wallets for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own wallet" on public.wallets;
create policy "Update own wallet" on public.wallets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own wallet" on public.wallets;
create policy "Delete own wallet" on public.wallets for delete to authenticated using ((select auth.uid()) = user_id);

-- Admin role is set only by a trusted database administrator, never user metadata.
drop policy if exists "Admin reads all wallets" on public.wallets;
create policy "Admin reads all wallets" on public.wallets for select to authenticated using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
-- Administrators manage accounts and read wallets; only members write wallet data.
drop policy if exists "Create own wallet" on public.wallets;
create policy "Create own wallet" on public.wallets for insert to authenticated
with check ((select auth.uid()) = user_id and coalesce((select auth.jwt())->'app_metadata'->>'role','user') <> 'admin');
drop policy if exists "Update own wallet" on public.wallets;
create policy "Update own wallet" on public.wallets for update to authenticated
using ((select auth.uid()) = user_id and coalesce((select auth.jwt())->'app_metadata'->>'role','user') <> 'admin')
with check ((select auth.uid()) = user_id and coalesce((select auth.jwt())->'app_metadata'->>'role','user') <> 'admin');
drop policy if exists "Delete own wallet" on public.wallets;
create policy "Delete own wallet" on public.wallets for delete to authenticated
using ((select auth.uid()) = user_id and coalesce((select auth.jwt())->'app_metadata'->>'role','user') <> 'admin');
