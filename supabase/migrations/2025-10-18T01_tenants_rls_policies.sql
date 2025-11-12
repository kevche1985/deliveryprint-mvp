-- Enable RLS on tenants table (safe if already enabled)
alter table if exists public.tenants enable row level security;

-- Allow reading tenants to everyone (adjust later if needed)
create policy if not exists tenants_select_all
  on public.tenants
  for select
  using (true);

-- Insert allowed only for admins
create policy if not exists tenants_insert_admins
  on public.tenants
  for insert
  to authenticated
  using (exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  ));

-- Update allowed only for admins
create policy if not exists tenants_update_admins
  on public.tenants
  for update
  to authenticated
  using (exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  ));

-- Delete allowed only for admins
create policy if not exists tenants_delete_admins
  on public.tenants
  for delete
  to authenticated
  using (exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.role = 'admin'
  ));