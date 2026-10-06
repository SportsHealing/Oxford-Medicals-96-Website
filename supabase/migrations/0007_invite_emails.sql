-- Remember when an invitation email was last sent to each invited address.
alter table public.allowed_emails add column if not exists invite_sent_at timestamptz;
