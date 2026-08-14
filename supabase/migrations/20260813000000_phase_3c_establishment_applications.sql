-- EducPAY Phase 3C: establishment registration, review, activation metadata and tenant isolation.

do $$
begin
  create type public.establishment_status as enum ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.responsible_account_status as enum ('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  official_name text not null,
  establishment_type text not null,
  levels text[] not null default '{}',
  address text not null,
  city text not null,
  province text not null,
  phone text not null,
  official_email text not null,
  school_year text not null,
  status public.establishment_status not null default 'PENDING_REVIEW',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.establishment_applications (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  reference text not null unique,
  status public.establishment_status not null default 'PENDING_REVIEW',
  principal_first_name text not null,
  principal_last_name text not null,
  principal_email text not null,
  principal_phone text not null,
  principal_function text not null,
  edit_token_hash text not null,
  rejection_reason text,
  responsible_user_id uuid references auth.users(id),
  responsible_account_status public.responsible_account_status not null default 'PENDING_ACTIVATION',
  activation_expires_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.establishment_applications(id) on delete cascade,
  action text not null,
  actor_id uuid references auth.users(id),
  old_status text,
  new_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.establishment_applications(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists establishment_id uuid references public.establishments(id);

create or replace function public.set_establishment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists establishments_set_updated_at on public.establishments;
create trigger establishments_set_updated_at
before update on public.establishments
for each row execute function public.set_establishment_updated_at();

drop trigger if exists applications_set_updated_at on public.establishment_applications;
create trigger applications_set_updated_at
before update on public.establishment_applications
for each row execute function public.set_establishment_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  requested_establishment_id text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'DIRECTOR');
  if requested_role not in ('DIRECTOR', 'ACCOUNTANT', 'PARENT') then
    requested_role := 'DIRECTOR';
  end if;
  requested_establishment_id := new.raw_user_meta_data ->> 'establishment_id';

  insert into public.profiles (
    id, role, first_name, last_name, phone, establishment_id,
    must_change_password, is_active
  )
  values (
    new.id,
    requested_role::public.app_role,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    case
      when requested_establishment_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then requested_establishment_id::uuid
      else null
    end,
    true,
    false
  )
  on conflict (id) do update set
    establishment_id = excluded.establishment_id,
    first_name = coalesce(excluded.first_name, profiles.first_name),
    last_name = coalesce(excluded.last_name, profiles.last_name),
    phone = coalesce(excluded.phone, profiles.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create unique index if not exists establishments_active_official_email_idx
on public.establishments (lower(official_email))
where status in ('PENDING_REVIEW', 'APPROVED');

create unique index if not exists applications_active_principal_email_idx
on public.establishment_applications (lower(principal_email))
where status in ('PENDING_REVIEW', 'APPROVED');

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

alter table public.establishments enable row level security;
alter table public.establishment_applications enable row level security;
alter table public.application_history enable row level security;
alter table public.notifications enable row level security;

drop policy if exists establishments_admin_all on public.establishments;
create policy establishments_admin_all on public.establishments
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists establishments_tenant_select on public.establishments;
create policy establishments_tenant_select on public.establishments
for select to authenticated
using (public.is_establishment_member(id));

drop policy if exists applications_admin_all on public.establishment_applications;
create policy applications_admin_all on public.establishment_applications
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists applications_tenant_select on public.establishment_applications;
create policy applications_tenant_select on public.establishment_applications
for select to authenticated
using (public.is_establishment_member(establishment_id));

drop policy if exists history_admin_or_tenant_select on public.application_history;
create policy history_admin_or_tenant_select on public.application_history
for select to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.establishment_applications a
    where a.id = application_id
      and public.is_establishment_member(a.establishment_id)
  )
);

drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
for select to authenticated
using (recipient_profile_id = auth.uid());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
for update to authenticated
using (recipient_profile_id = auth.uid())
with check (recipient_profile_id = auth.uid());

revoke all on public.establishments from anon;
revoke all on public.establishment_applications from anon;
revoke all on public.application_history from anon;
revoke all on public.notifications from anon;
grant select on public.establishments to authenticated;
grant select on public.establishment_applications to authenticated;
grant select on public.application_history to authenticated;
grant select, update on public.notifications to authenticated;