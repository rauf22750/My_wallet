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
