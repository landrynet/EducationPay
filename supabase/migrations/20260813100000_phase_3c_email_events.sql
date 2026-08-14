-- EducPAY Phase 3C: auditable email events for transactional notifications.
-- Supabase Auth remains the delivery mechanism for activation and recovery links.

do $$
begin
  create type public.email_event_status as enum ('PENDING', 'SENT', 'FAILED');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.establishment_applications(id) on delete cascade,
  type text not null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  status public.email_event_status not null default 'PENDING',
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_events_application_id_idx
on public.email_events (application_id, created_at desc);

create index if not exists email_events_pending_idx
on public.email_events (status, created_at)
where status = 'PENDING';

alter table public.email_events enable row level security;
revoke all on public.email_events from anon;
revoke all on public.email_events from authenticated;