-- monkeyOS application baseline. Canonical source: monkeyos-platform/supabase/baseline.
-- Synchronized verbatim into every application by `bun run platform:sync`; never edit it in an
-- application repository. `bun run audit:repository` verifies the checksum.
--
-- Every application owns one Supabase project, so it owns the default `public` schema. No
-- identifier below names the application: this file is byte-identical across every monkeyOS app,
-- which is what lets the template test the exact SQL that production runs.

-- `public` ships permissive defaults, so restore a deny-by-default posture before creating
-- anything. In the next statement the first `public` is the schema and the second is the PUBLIC
-- pseudo-role that every role inherits; revoking the schema from PUBLIC is what actually denies
-- `anon`, because a direct revoke from `anon` alone would leave the inherited grant in place.
revoke all on schema public from public, anon;
grant usage on schema public to authenticated, service_role;

-- Supabase grants `anon`/`authenticated` on future tables in `public` via default privileges owned
-- by `postgres`, the role that applies migrations. Counter those defaults so a table added without
-- grants is unreachable rather than exposed. `audit:repository` additionally rejects any table
-- created without row level security.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated;

create table public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index members_created_by_idx on public.members(created_by);

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  record_id text,
  before_data jsonb,
  after_data jsonb
);

create index audit_log_occurred_at_idx on public.audit_log(occurred_at desc);
create index audit_log_actor_idx on public.audit_log(actor_user_id);
create index audit_log_entity_record_idx on public.audit_log(entity, record_id);

create function public.is_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from public.members where user_id = (select auth.uid()));
$$;

create function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.members
      where user_id = (select auth.uid()) and role = 'admin'
    );
$$;

create function public.audit_membership_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_log(actor_user_id, action, entity, record_id, before_data, after_data)
  values (
    (select auth.uid()),
    'membership.' || lower(tg_op),
    'member',
    coalesce(new.user_id, old.user_id)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger members_audit_trigger after insert or update or delete on public.members
for each row execute function public.audit_membership_change();

create function public.protect_last_admin()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
    and (select count(*) from public.members where role = 'admin') <= 1 then
    raise exception 'cannot remove the final application admin' using errcode = '23514';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger members_last_admin_trigger before update or delete on public.members
for each row execute function public.protect_last_admin();

create function public.add_member_by_email(target_email text, target_role text default 'member')
returns public.members
language plpgsql security definer set search_path = ''
as $$
declare
  matched_user_id uuid;
  added public.members;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target_email <> btrim(target_email) or target_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    raise exception 'invalid exact email' using errcode = '22023';
  end if;
  if target_role not in ('admin', 'member') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  select id into matched_user_id from auth.users where lower(email) = lower(target_email) limit 1;
  if matched_user_id is null then
    raise exception 'existing Auth user not found' using errcode = 'P0002';
  end if;
  insert into public.members(user_id, role, created_by)
  values (matched_user_id, target_role, (select auth.uid()))
  returning * into added;
  return added;
end;
$$;

alter table public.members enable row level security;
alter table public.audit_log enable row level security;

create policy members_select on public.members for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy members_update on public.members for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy members_delete on public.members for delete to authenticated
using ((select public.is_admin()) and user_id <> (select auth.uid()));

create policy audit_select on public.audit_log for select to authenticated
using ((select public.is_member()));

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant select on public.members, public.audit_log to authenticated;
grant update(role), delete on public.members to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_member(), public.is_admin(), public.add_member_by_email(text, text) to authenticated;
