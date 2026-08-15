-- EduPAY: fix director activation sync
-- This migration makes the server-side activation path explicit and allows
-- service-role updates to the profiles table during app approval.

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
    or coalesce(current_setting('request.jwt.claim.sub', true), '') = ''
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

drop trigger if exists profiles_prevent_privilege_changes on public.profiles;
create trigger profiles_prevent_privilege_changes
before update on public.profiles
for each row execute function public.prevent_profile_privilege_changes();

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
