-- Continuity brain (ACSP-CB/0.1) — schema and functions for Supabase / PostgreSQL ≥ 14.
--
-- Apply with the Supabase CLI (supabase db push) or paste into the SQL editor.
-- The site calls only the four cb_* functions, through PostgREST, with the
-- service-role key, from the server. Tables have row-level security enabled
-- and no policies, so the anon and authenticated roles can read nothing.
--
-- Hash chain (identical to src/lib/continuity/model.ts):
--   hash_v = 'sha256:' || hex(sha256(prev || '|' || v || '|' || content_hash))
--   prev_1 = 'sha256:genesis'
-- content_hash is computed by the application from canonical JSON of the body
-- and re-checked by anyone who replays the log.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.cb_brains (
  code            text primary key check (code ~ '^[0-9A-HJKMNP-TV-Z]{10}$'),
  created_at      timestamptz not null default now(),
  owner_key_hash  text not null,
  head_version    integer not null default 0,
  head_hash       text not null default 'sha256:genesis',
  forgotten_at    timestamptz
);

create table if not exists public.cb_events (
  brain_code    text not null references public.cb_brains(code) on delete cascade,
  v             integer not null check (v >= 1),
  at            timestamptz not null default now(),
  kind          text not null check (kind in ('genesis', 'append')),
  session       text not null check (length(session) between 1 and 60),
  body          jsonb not null check (octet_length(body::text) <= 65536),
  content_hash  text not null,
  prev          text not null,
  hash          text not null,
  primary key (brain_code, v),
  unique (brain_code, content_hash)
);

-- Append-only: events are never updated, and deleted only by cb_forget (the owner's erasure right).
create or replace function public.cb_events_append_only() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'cb_events is append-only';
  end if;
  if tg_op = 'DELETE' and coalesce(current_setting('cb.forget', true), '') <> 'on' then
    raise exception 'cb_events is append-only; use cb_forget';
  end if;
  return coalesce(old, new);
end $$;

drop trigger if exists cb_events_append_only on public.cb_events;
create trigger cb_events_append_only before update or delete on public.cb_events
  for each row execute function public.cb_events_append_only();

alter table public.cb_brains enable row level security;
alter table public.cb_events enable row level security;

create or replace function public.cb_chain(p_prev text, p_v integer, p_content text) returns text
language sql immutable as $$
  select 'sha256:' || encode(extensions.digest(p_prev || '|' || p_v::text || '|' || p_content, 'sha256'), 'hex')
$$;

-- Create a brain with its genesis event.
create or replace function public.cb_create(p_code text, p_owner_key_hash text, p_session text, p_body jsonb, p_content_hash text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  h := cb_chain('sha256:genesis', 1, p_content_hash);
  insert into cb_brains (code, owner_key_hash, head_version, head_hash) values (p_code, p_owner_key_hash, 1, h);
  insert into cb_events (brain_code, v, kind, session, body, content_hash, prev, hash)
    values (p_code, 1, 'genesis', p_session, p_body, p_content_hash, 'sha256:genesis', h);
  return jsonb_build_object('code', p_code, 'v', 1, 'hash', h);
end $$;

-- Append one event. Atomic under concurrent writers (row lock on the brain);
-- idempotent: the same content returns the existing event.
create or replace function public.cb_append(p_code text, p_session text, p_body jsonb, p_content_hash text, p_max_events integer default 100000)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare b cb_brains%rowtype; e cb_events%rowtype; nv integer; h text;
begin
  select * into b from cb_brains where code = p_code for update;
  if not found or b.forgotten_at is not null then
    return jsonb_build_object('error', 'not_found');
  end if;
  select * into e from cb_events where brain_code = p_code and content_hash = p_content_hash;
  if found then
    return jsonb_build_object('v', e.v, 'hash', e.hash, 'duplicate', true);
  end if;
  if b.head_version >= p_max_events then
    return jsonb_build_object('error', 'full');
  end if;
  nv := b.head_version + 1;
  h := cb_chain(b.head_hash, nv, p_content_hash);
  insert into cb_events (brain_code, v, kind, session, body, content_hash, prev, hash)
    values (p_code, nv, 'append', p_session, p_body, p_content_hash, b.head_hash, h);
  update cb_brains set head_version = nv, head_hash = h where code = p_code;
  return jsonb_build_object('v', nv, 'hash', h, 'duplicate', false);
end $$;

-- Read a brain and a window of its events.
create or replace function public.cb_read(p_code text, p_from integer default 1, p_limit integer default 1000)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when b.code is null or b.forgotten_at is not null then null else jsonb_build_object(
    'brain', jsonb_build_object('code', b.code, 'created_at', b.created_at, 'head_version', b.head_version, 'head_hash', b.head_hash, 'forgotten', false),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('v', e.v, 'at', e.at, 'kind', e.kind, 'body', e.body, 'content_hash', e.content_hash, 'prev', e.prev, 'hash', e.hash) order by e.v)
      from cb_events e where e.brain_code = b.code and e.v >= p_from and e.v < p_from + least(p_limit, 5000)
    ), '[]'::jsonb)
  ) end
  from (select 1) one left join cb_brains b on b.code = p_code
$$;

-- Erase a brain's content. Requires the owner key shown once at creation.
create or replace function public.cb_forget(p_code text, p_owner_key_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from cb_brains where code = p_code and owner_key_hash = p_owner_key_hash and forgotten_at is null) then
    return false;
  end if;
  perform set_config('cb.forget', 'on', true);
  delete from cb_events where brain_code = p_code;
  update cb_brains set forgotten_at = now(), head_hash = 'sha256:forgotten' where code = p_code;
  return true;
end $$;

-- Only the server (service role) may call these. Roles are created by Supabase; guarded for plain Postgres.
revoke all on function public.cb_create(text, text, text, jsonb, text) from public;
revoke all on function public.cb_append(text, text, jsonb, text, integer) from public;
revoke all on function public.cb_read(text, integer, integer) from public;
revoke all on function public.cb_forget(text, text) from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on function public.cb_create(text, text, text, jsonb, text) from %I', r);
      execute format('revoke all on function public.cb_append(text, text, jsonb, text, integer) from %I', r);
      execute format('revoke all on function public.cb_read(text, integer, integer) from %I', r);
      execute format('revoke all on function public.cb_forget(text, text) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.cb_create(text, text, text, jsonb, text) to service_role;
    grant execute on function public.cb_append(text, text, jsonb, text, integer) to service_role;
    grant execute on function public.cb_read(text, integer, integer) to service_role;
    grant execute on function public.cb_forget(text, text) to service_role;
  end if;
end $$;
