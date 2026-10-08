-- First-visit sign-up without admin work:
-- * email on the list           -> create a password, in straight away
-- * name on the cohort roster    -> in straight away (admins get an FYI email)
--   with no email known yet
-- * anyone else                  -> request to join; an admin accepts or declines
-- Everyone proves they own their email (emailed code) before any of this runs.
-- Safe to run more than once.

create schema if not exists extensions;
create extension if not exists fuzzystrmatch with schema extensions;

-- ---------------------------------------------------------------
-- The cohort roster: everyone from the class lists, with or without an email.
create table if not exists public.roster (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null check (length(trim(full_name)) > 0),
  other_names    text[] not null default '{}',
  email          text unique check (email = lower(email)),
  specialty      text,
  cohort         text check (cohort in ('clinical', 'preclinical')),
  member_id      uuid unique references public.members (id) on delete set null,
  joined_by_name boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.roster enable row level security;
drop policy if exists "admins manage roster" on public.roster;
create policy "admins manage roster" on public.roster
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Requests to join from people not on the list (and a record of name matches).
create table if not exists public.join_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users (id) on delete cascade,
  email           text not null,
  full_name       text not null,
  previous_name   text,
  kind            text not null default 'request' check (kind in ('request', 'name_match')),
  matched_name    text,
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  admins_notified boolean not null default false,
  decided_by      uuid references public.members (id) on delete set null,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.join_requests enable row level security;
drop policy if exists "admins read join requests" on public.join_requests;
create policy "admins read join requests" on public.join_requests
  for select to authenticated using (public.is_admin());
drop policy if exists "admins delete join requests" on public.join_requests;
create policy "admins delete join requests" on public.join_requests
  for delete to authenticated using (public.is_admin());
drop policy if exists "people read their own request" on public.join_requests;
create policy "people read their own request" on public.join_requests
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------
-- Name matching that copes with titles, middle names, maiden names,
-- nicknames (Tom/Thomas, Jo/Joanne) and one-letter surname typos.
create or replace function public.name_tokens(n text)
returns text[] language sql immutable set search_path = public as $$
  select coalesce(array_agg(t order by ord), '{}')
  from unnest(regexp_split_to_array(
         trim(regexp_replace(
           translate(lower(coalesce(n, '')), 'àáâäãåèéêëìíîïòóôöõøùúûüýçñ', 'aaaaaaeeeeiiiiooooooouuuuycn'),
           '[^a-z]+', ' ', 'g')),
         ' ')) with ordinality as x(t, ord)
  where t <> '' and t not in ('dr', 'mr', 'mrs', 'ms', 'miss', 'prof', 'professor', 'nee', 'born', 'sir', 'dame');
$$;

create or replace function public.first_names_match(a text, b text)
returns boolean language sql immutable set search_path = public as $$
  select a = b
    -- Jo/Joanne, Ken/Kenneth, Chris/Christopher
    or (least(length(a), length(b)) >= 2 and (starts_with(a, b) or starts_with(b, a)))
    -- one-letter spelling differences: Philipa/Philippa, Clare/Claire
    or (length(a) >= 5 and length(b) >= 5 and extensions.levenshtein(a, b) <= 1)
    or exists (
      select 1 from (values
        ('tom', 'thomas'), ('bob', 'robert'), ('bill', 'william'), ('will', 'william'), ('rick', 'richard'),
        ('dick', 'richard'), ('kate', 'catherine'), ('kate', 'katherine'), ('katie', 'catherine'),
        ('cathy', 'catherine'), ('kathy', 'katherine'), ('cath', 'catherine'), ('jim', 'james'),
        ('jamie', 'james'), ('sue', 'susan'), ('susie', 'susan'), ('liz', 'elizabeth'), ('beth', 'elizabeth'),
        ('eliza', 'elizabeth'), ('becky', 'rebecca'), ('sandy', 'alexandra'), ('sasha', 'alexandra'),
        ('ted', 'edward'), ('ned', 'edward'), ('pip', 'philippa'), ('pippa', 'philippa'), ('nicky', 'nicola'),
        ('nicki', 'nicola'), ('nick', 'nicholas'), ('nick', 'nicolas'), ('harry', 'henry'), ('jack', 'john'),
        ('peggy', 'margaret'), ('maggie', 'margaret'), ('meg', 'margaret'), ('jenny', 'jennifer'),
        ('jill', 'gillian'), ('fran', 'frances'), ('frankie', 'frances'), ('tony', 'anthony'), ('andy', 'andrew'),
        ('drew', 'andrew'), ('mike', 'michael'), ('mick', 'michael'), ('ben', 'benjamin'), ('sam', 'samantha'),
        ('sam', 'samuel'), ('greg', 'gregory'), ('jon', 'jonathan'), ('johnny', 'jonathan'), ('dave', 'david'),
        ('steve', 'stephen'), ('steve', 'steven'), ('alfie', 'alfred'), ('joe', 'joseph'), ('vicky', 'victoria'),
        ('sally', 'sarah'), ('debbie', 'deborah'), ('mandy', 'amanda'), ('penny', 'penelope'), ('tess', 'teresa'),
        ('rosie', 'rosemary'), ('gerry', 'gerald'), ('gerry', 'geraldine'), ('nicky', 'nicholas'), ('ali', 'alison')
      ) v(x, y)
      where (a = v.x and b = v.y) or (a = v.y and b = v.x));
$$;

create or replace function public.surnames_match(a text, b text)
returns boolean language sql immutable set search_path = public as $$
  select a = b or (length(a) >= 5 and length(b) >= 5 and extensions.levenshtein(a, b) <= 1);
$$;

-- a's surname is among b's later names, and one of a's given names fits b's first name.
create or replace function public.names_match_tokens(ta text[], tb text[])
returns boolean language sql immutable set search_path = public as $$
  select exists (select 1 from unnest(tb[2:]) s where public.surnames_match(ta[cardinality(ta)], s))
     and exists (select 1 from unnest(ta[1:cardinality(ta) - 1]) g where public.first_names_match(g, tb[1]));
$$;

create or replace function public.names_match(a text, b text)
returns boolean language plpgsql immutable set search_path = public as $$
declare
  ta text[] := public.name_tokens(a);
  tb text[] := public.name_tokens(b);
begin
  if cardinality(ta) < 2 or cardinality(tb) < 2 then
    return false;
  end if;
  return public.names_match_tokens(ta, tb) or public.names_match_tokens(tb, ta);
end;
$$;

create or replace function public.roster_row_matches(r public.roster, p_name text)
returns boolean language sql stable set search_path = public as $$
  select p_name is not null and length(trim(p_name)) > 0 and (
    public.names_match(r.full_name, p_name)
    or exists (select 1 from unnest(r.other_names) o where public.names_match(o, p_name)));
$$;

-- ---------------------------------------------------------------
-- Adding an address to the list grants membership to an existing account
-- (from 0009) and settles any pending request from that address.
create or replace function public.grant_membership_for_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (id, email)
  select u.id, lower(u.email)
  from auth.users u
  where lower(u.email) = new.email
    and not exists (select 1 from public.members m where m.email = lower(u.email))
  on conflict do nothing;

  update public.join_requests
  set status = 'accepted', decided_at = now()
  where email = new.email and status = 'pending';
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- Called by a signed-in person (email already proven with a code).
-- Returns 'member', 'joined_by_name', 'pending' or 'declined'.
create or replace function public.claim_access(p_name text, p_previous_name text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  uid  uuid := auth.uid();
  em   text;
  confirmed timestamptz;
  nm   text := nullif(trim(coalesce(p_name, '')), '');
  prev text := nullif(trim(coalesce(p_previous_name, '')), '');
  hits int;
  hit  public.roster;
  req  public.join_requests;
begin
  if uid is null then
    raise exception 'Please sign in first';
  end if;
  select lower(u.email), u.email_confirmed_at into em, confirmed from auth.users u where u.id = uid;
  if em is null or confirmed is null then
    raise exception 'Please confirm your email address first';
  end if;
  if nm is null then
    raise exception 'Please enter your name';
  end if;
  nm := left(nm, 120);
  prev := left(prev, 120);

  -- Already in, or email on the list.
  if exists (select 1 from public.members where id = uid)
     or exists (select 1 from public.allowed_emails where email = em) then
    insert into public.members (id, email, full_name) values (uid, em, nm) on conflict do nothing;
    update public.members set full_name = nm where id = uid and full_name = '';
    update public.roster set member_id = uid where email = em and member_id is null;
    update public.join_requests set status = 'accepted', decided_at = now() where user_id = uid and status = 'pending';
    return 'member';
  end if;

  -- A request already decided stays decided.
  select * into req from public.join_requests where user_id = uid;
  if found and req.status = 'declined' then
    return 'declined';
  end if;

  -- Name on the roster, no email known for it, not yet claimed: exactly one match.
  select count(*) into hits from public.roster r
  where r.email is null and r.member_id is null
    and (public.roster_row_matches(r, nm) or public.roster_row_matches(r, prev));

  if hits = 1 then
    select * into hit from public.roster r
    where r.email is null and r.member_id is null
      and (public.roster_row_matches(r, nm) or public.roster_row_matches(r, prev));

    insert into public.allowed_emails (email, note) values (em, 'joined by name: ' || hit.full_name)
    on conflict (email) do nothing;
    insert into public.members (id, email, full_name) values (uid, em, nm) on conflict do nothing;
    update public.members set full_name = nm where id = uid and full_name = '';
    update public.roster
    set email = em, member_id = uid, joined_by_name = true,
        other_names = case when lower(hit.full_name) = lower(nm) or nm = any(hit.other_names)
                           then other_names else other_names || nm end
    where id = hit.id;
    insert into public.join_requests (user_id, email, full_name, previous_name, kind, matched_name, status, decided_at)
    values (uid, em, nm, prev, 'name_match', hit.full_name, 'accepted', now())
    on conflict (user_id) do update
      set kind = 'name_match', matched_name = excluded.matched_name, status = 'accepted',
          decided_at = now(), admins_notified = false;
    return 'joined_by_name';
  end if;

  -- Otherwise ask the organisers (once).
  insert into public.join_requests (user_id, email, full_name, previous_name)
  values (uid, em, nm, prev)
  on conflict (user_id) do update
    set full_name = excluded.full_name, previous_name = excluded.previous_name
    where public.join_requests.status = 'pending';
  return 'pending';
end;
$$;

-- Used by the join-requests Edge Function: hands over a new request (or name
-- match) for the admin email, once.
create or replace function public.take_join_notice()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.join_requests;
begin
  update public.join_requests set admins_notified = true
  where user_id = auth.uid() and admins_notified = false
  returning * into r;
  if not found then
    return null;
  end if;
  return jsonb_build_object('full_name', r.full_name, 'previous_name', r.previous_name, 'email', r.email,
                            'kind', r.kind, 'matched_name', r.matched_name, 'status', r.status);
end;
$$;

-- Admin decision. Accepting adds the person to the list, the members and the roster.
create or replace function public.decide_join_request(p_id uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.join_requests;
begin
  if not public.is_admin() then
    raise exception 'Only admins can decide requests';
  end if;
  select * into r from public.join_requests where id = p_id for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if r.status <> 'pending' then
    raise exception 'This request has already been decided';
  end if;

  update public.join_requests
  set status = case when p_accept then 'accepted' else 'declined' end, decided_by = auth.uid(), decided_at = now()
  where id = p_id;

  if p_accept then
    insert into public.allowed_emails (email, note) values (r.email, 'accepted request') on conflict (email) do nothing;
    insert into public.members (id, email, full_name) values (r.user_id, r.email, r.full_name) on conflict do nothing;
    update public.members set full_name = r.full_name where id = r.user_id and full_name = '';
    if not exists (select 1 from public.roster where email = r.email) then
      insert into public.roster (full_name, other_names, email, member_id)
      values (r.full_name, case when r.previous_name is null then '{}' else array[r.previous_name] end, r.email,
              (select id from public.members where id = r.user_id));
    end if;
  end if;

  return jsonb_build_object('email', r.email, 'full_name', r.full_name,
                            'status', case when p_accept then 'accepted' else 'declined' end);
end;
$$;

-- Admin: take away someone's access (for example a wrong name match).
create or replace function public.admin_remove_access(p_member uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m public.members;
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove access';
  end if;
  select * into m from public.members where id = p_member;
  if not found then
    raise exception 'Member not found';
  end if;
  if m.id = auth.uid() then
    raise exception 'You cannot remove your own access';
  end if;
  if m.is_admin then
    raise exception 'Remove their admin role first';
  end if;
  if exists (select 1 from public.photos where uploaded_by = m.id) then
    raise exception 'This person has uploaded photos, so their access cannot be removed here';
  end if;

  update public.roster
  set member_id = null,
      email = case when joined_by_name then null else email end,
      joined_by_name = false
  where member_id = m.id;
  delete from public.allowed_emails where email = m.email;
  insert into public.join_requests (user_id, email, full_name, status, decided_by, decided_at, admins_notified)
  values (m.id, m.email, coalesce(nullif(m.full_name, ''), m.email), 'declined', auth.uid(), now(), true)
  on conflict (user_id) do update set status = 'declined', decided_by = auth.uid(), decided_at = now();
  delete from public.members where id = m.id;
end;
$$;

-- Admin: load names (and emails where known) pasted from the class lists.
-- p_rows: [{"name": "...", "email": "...", "specialty": "...", "cohort": "clinical|preclinical"}]
create or replace function public.admin_import_people(p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  nm text; em text; sp text; co text;
  hit uuid;
  hits int;
  n int;
  added int := 0; linked int := 0; known int := 0; emails_added int := 0;
  to_check text[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'Only admins can import';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    nm := left(nullif(trim(coalesce(item ->> 'name', '')), ''), 120);
    em := nullif(lower(trim(coalesce(item ->> 'email', ''))), '');
    sp := left(nullif(trim(coalesce(item ->> 'specialty', '')), ''), 120);
    co := case lower(trim(coalesce(item ->> 'cohort', ''))) when 'preclinical' then 'preclinical'
                                                          when 'clinical' then 'clinical' end;
    if em is not null and em !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
      to_check := to_check || (coalesce(nm, '(no name)') || ': email not valid (' || em || ')');
      continue;
    end if;
    continue when nm is null and em is null;

    if em is not null then
      insert into public.allowed_emails (email, note) values (em, 'imported list') on conflict (email) do nothing;
      get diagnostics n = row_count;
      emails_added := emails_added + n;

      select id into hit from public.roster where email = em;
      if hit is not null then
        update public.roster
        set specialty = coalesce(specialty, sp), cohort = coalesce(cohort, co),
            other_names = case when nm is null or lower(full_name) = lower(nm) or nm = any(other_names)
                               then other_names else other_names || nm end
        where id = hit;
        known := known + 1;
      elsif nm is not null then
        select count(*) into hits from public.roster r where r.email is null and public.roster_row_matches(r, nm);
        if hits = 1 then
          update public.roster r
          set email = em, specialty = coalesce(r.specialty, sp), cohort = coalesce(r.cohort, co),
              other_names = case when lower(r.full_name) = lower(nm) or nm = any(r.other_names)
                                 then r.other_names else r.other_names || nm end
          where r.email is null and public.roster_row_matches(r, nm);
          linked := linked + 1;
        else
          if hits > 1 then
            to_check := to_check || nm;
          end if;
          insert into public.roster (full_name, email, specialty, cohort) values (nm, em, sp, co);
          added := added + 1;
        end if;
      end if;
    else
      select count(*) into hits from public.roster r where public.roster_row_matches(r, nm);
      if hits = 0 then
        insert into public.roster (full_name, specialty, cohort) values (nm, sp, co);
        added := added + 1;
      else
        update public.roster r
        set specialty = coalesce(r.specialty, sp), cohort = coalesce(r.cohort, co)
        where public.roster_row_matches(r, nm);
        known := known + 1;
        if hits > 1 then
          to_check := to_check || nm;
        end if;
      end if;
    end if;
  end loop;

  -- Link roster entries to people who have already joined, and fill in blank names.
  update public.roster r set member_id = m.id
  from public.members m
  where m.email = r.email and r.member_id is null
    and not exists (select 1 from public.roster x where x.member_id = m.id);
  update public.members m set full_name = r.full_name
  from public.roster r
  where r.member_id = m.id and m.full_name = '';

  return jsonb_build_object('added', added, 'linked', linked, 'already_known', known,
                            'emails_added', emails_added, 'to_check', to_jsonb(to_check));
end;
$$;

-- Only signed-in people may call these; each checks its own rules.
revoke all on function public.claim_access(text, text) from public, anon;
revoke all on function public.take_join_notice() from public, anon;
revoke all on function public.decide_join_request(uuid, boolean) from public, anon;
revoke all on function public.admin_remove_access(uuid) from public, anon;
revoke all on function public.admin_import_people(jsonb) from public, anon;
grant execute on function public.claim_access(text, text) to authenticated;
grant execute on function public.take_join_notice() to authenticated;
grant execute on function public.decide_join_request(uuid, boolean) to authenticated;
grant execute on function public.admin_remove_access(uuid) to authenticated;
grant execute on function public.admin_import_people(jsonb) to authenticated;

-- The Admin list of other sign-in attempts leaves out anyone who has made a request.
create or replace function public.admin_unrecognised_signins()
returns table (email text, first_tried timestamptz, signed_in boolean)
language sql stable security definer set search_path = public as $$
  select lower(u.email), u.created_at, u.last_sign_in_at is not null
  from auth.users u
  where public.is_admin()
    and u.email is not null
    and not exists (select 1 from public.allowed_emails a where a.email = lower(u.email))
    and not exists (select 1 from public.members m where m.id = u.id)
    and not exists (select 1 from public.join_requests j where j.user_id = u.id)
  order by u.created_at desc;
$$;
