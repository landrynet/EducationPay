-- EducPAY Phase 4: Role Isolation, Multi-Tenant Architecture and RLS Enforcement
-- Strict separation between SUPER_ADMIN (platform only) and ESTABLISHMENT_ADMIN / DIRECTOR (single-tenant only).

-- 1. Extend app_role enum with future roles if not already present
do $$
begin
  alter type public.app_role add value if not exists 'ESTABLISHMENT_ADMIN';
  alter type public.app_role add value if not exists 'TUTOR';
exception
  when others then null;
end
$$;

-- 2. Secure privilege enforcement trigger function
-- Clients cannot tamper with role, is_active or establishment_id.
-- Server functions running as postgres / service_role are allowed.
create or replace function public.prevent_profile_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
  jwt_claims jsonb;
  is_service_role_request boolean;
begin
  jwt_role := lower(coalesce(current_setting('request.jwt.claim.role', true), ''));
  jwt_claims := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
  is_service_role_request := (
    current_user = 'postgres'
    or current_user = 'supabase_admin'
    or session_user = 'postgres'
    or session_user = 'supabase_admin'
    or jwt_role = 'service_role'
    or lower(coalesce(jwt_claims->>'role', '')) = 'service_role'
    or lower(coalesce(current_setting('role', true), '')) = 'service_role'
  );

  if (
      (new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.establishment_id is distinct from old.establishment_id)
      and not is_service_role_request
  ) then
    raise exception 'Profile role, active status and establishment are managed server-side';
  end if;

  return new;
end;
$$;

-- 3. Director Profile Activation (executed server-side with elevated privileges)
create or replace function public.activate_director_profile(p_user_id uuid, p_establishment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    role = 'DIRECTOR'::public.app_role,
    establishment_id = p_establishment_id,
    is_active = true,
    must_change_password = false,
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;
end;
$$;

-- 4. Helper function to check if the current user belongs to a specific establishment
create or replace function public.is_establishment_member(target_establishment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and establishment_id = target_establishment_id
      and is_active = true
  );
$$;

-- 5. Helper function to get current user establishment_id
create or replace function public.auth_establishment_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select establishment_id from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- 6. Helper function to check if current user is SUPER_ADMIN
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text = 'SUPER_ADMIN'
      and is_active = true
  );
$$;

-- 7. Multi-tenant RLS Policies Enforcement

-- Profiles: Users can ONLY see and update their own profile row.
-- Super Admin does NOT have blanket SELECT * across arbitrary user profiles containing tenant internal data.
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own_activation on public.profiles;
create policy profiles_update_own_activation on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Establishments:
-- Super Admin manages tenant metadata (code, name, status, etc.).
-- Establishment Admin / Members only see their own establishment.
alter table public.establishments enable row level security;

drop policy if exists establishments_admin_all on public.establishments;
create policy establishments_admin_all on public.establishments
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists establishments_tenant_select on public.establishments;
create policy establishments_tenant_select on public.establishments
for select to authenticated
using (public.is_establishment_member(id));

-- Establishment Applications:
-- Super Admin manages registration requests (tenants).
-- Establishment Admin only sees their own establishment's application.
alter table public.establishment_applications enable row level security;

drop policy if exists applications_admin_all on public.establishment_applications;
create policy applications_admin_all on public.establishment_applications
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists applications_tenant_select on public.establishment_applications;
create policy applications_tenant_select on public.establishment_applications
for select to authenticated
using (
  responsible_user_id = auth.uid()
  or public.is_establishment_member(establishment_id)
);

-- Notifications:
-- Users can only read and update their own notifications.
alter table public.notifications enable row level security;

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
for select to authenticated
using (recipient_profile_id = auth.uid());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
for update to authenticated
using (recipient_profile_id = auth.uid())
with check (recipient_profile_id = auth.uid());

-- 8. Grants
revoke all on public.profiles from anon;
revoke all on public.establishments from anon;
revoke all on public.establishment_applications from anon;
revoke all on public.notifications from anon;

grant select, update on public.profiles to authenticated;
grant select on public.establishments to authenticated;
grant select on public.establishment_applications to authenticated;
grant select, update on public.notifications to authenticated;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_establishment_member(uuid) to authenticated;
grant execute on function public.auth_establishment_id() to authenticated;
