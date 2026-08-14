-- EducPAY Phase 3B: Super Admin profile and row-level security.
-- Run this migration in the Supabase SQL editor before initializing the first admin.

do $$
begin
  create type public.app_role as enum ('SUPER_ADMIN', 'DIRECTOR', 'ACCOUNTANT', 'PARENT');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'PARENT'::public.app_role,
  first_name text,
  last_name text,
  phone text,
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists must_change_password boolean not null default true,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

create or replace function public.prevent_profile_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
   if (new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.establishment_id is distinct from old.establishment_id)
     and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'Profile role, active status and establishment are managed server-side';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_changes on public.profiles;
create trigger profiles_prevent_privilege_changes
before update on public.profiles
for each row execute function public.prevent_profile_privilege_changes();

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

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own_activation on public.profiles;
create policy profiles_update_own_activation
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;
