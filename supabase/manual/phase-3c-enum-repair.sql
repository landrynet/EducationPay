alter type public.establishment_status
  add value if not exists 'PENDING_REVIEW';

alter type public.establishment_status
  add value if not exists 'APPROVED';

alter type public.establishment_status
  add value if not exists 'REJECTED';

alter type public.establishment_status
  add value if not exists 'SUSPENDED';