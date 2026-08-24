-- Rendered only by provisioning/provision-app.ts after strict identifier validation.
-- This creates no monkeyOS registry or state tables.
begin;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = '__DEV_ROLE__') then
    create role __DEV_ROLE__ nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = '__RUNTIME_ROLE__') then
    create role __RUNTIME_ROLE__ nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$roles$;

create schema if not exists __APP_SCHEMA__;
revoke all on schema __APP_SCHEMA__ from public, anon;
grant usage, create on schema __APP_SCHEMA__ to __DEV_ROLE__;
grant usage on schema __APP_SCHEMA__ to __RUNTIME_ROLE__, authenticated, service_role;

create table if not exists __APP_SCHEMA__.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists members_created_by_idx on __APP_SCHEMA__.members(created_by);

create table if not exists __APP_SCHEMA__.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  record_id text,
  before_data jsonb,
  after_data jsonb
);
create index if not exists audit_log_occurred_at_idx on __APP_SCHEMA__.audit_log(occurred_at desc);
create index if not exists audit_log_actor_idx on __APP_SCHEMA__.audit_log(actor_user_id);
create index if not exists audit_log_entity_record_idx on __APP_SCHEMA__.audit_log(entity, record_id);

create table if not exists __APP_SCHEMA__.work_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);
create index if not exists work_items_created_by_idx on __APP_SCHEMA__.work_items(created_by);
create index if not exists work_items_status_created_idx on __APP_SCHEMA__.work_items(status, created_at desc);

create or replace function __APP_SCHEMA__.is_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from __APP_SCHEMA__.members where user_id = (select auth.uid()));
$$;

create or replace function __APP_SCHEMA__.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from __APP_SCHEMA__.members
      where user_id = (select auth.uid()) and role = 'admin'
    );
$$;

create or replace function __APP_SCHEMA__.audit_membership_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into __APP_SCHEMA__.audit_log(actor_user_id, action, entity, record_id, before_data, after_data)
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

drop trigger if exists members_audit_trigger on __APP_SCHEMA__.members;
create trigger members_audit_trigger
after insert or update or delete on __APP_SCHEMA__.members
for each row execute function __APP_SCHEMA__.audit_membership_change();

create or replace function __APP_SCHEMA__.protect_last_admin()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
    and (select count(*) from __APP_SCHEMA__.members where role = 'admin') <= 1 then
    raise exception 'cannot remove the final application admin' using errcode = '23514';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists members_last_admin_trigger on __APP_SCHEMA__.members;
create trigger members_last_admin_trigger before update or delete on __APP_SCHEMA__.members
for each row execute function __APP_SCHEMA__.protect_last_admin();

create or replace function __APP_SCHEMA__.audit_work_item_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into __APP_SCHEMA__.audit_log(actor_user_id, action, entity, record_id, before_data, after_data)
  values (
    (select auth.uid()),
    'work_item.' || lower(tg_op),
    'work_item',
    coalesce(new.id, old.id)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists work_items_audit_trigger on __APP_SCHEMA__.work_items;
create trigger work_items_audit_trigger
after insert or update or delete on __APP_SCHEMA__.work_items
for each row execute function __APP_SCHEMA__.audit_work_item_change();

create or replace function __APP_SCHEMA__.add_member_by_email(target_email text, target_role text default 'member')
returns __APP_SCHEMA__.members
language plpgsql security definer set search_path = ''
as $$
declare
  matched_user_id uuid;
  added __APP_SCHEMA__.members;
begin
  if (select auth.uid()) is null or not __APP_SCHEMA__.is_admin() then
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
  insert into __APP_SCHEMA__.members(user_id, role, created_by)
  values (matched_user_id, target_role, (select auth.uid()))
  returning * into added;
  return added;
end;
$$;

alter table __APP_SCHEMA__.members enable row level security;
alter table __APP_SCHEMA__.audit_log enable row level security;
alter table __APP_SCHEMA__.work_items enable row level security;

drop policy if exists members_select on __APP_SCHEMA__.members;
create policy members_select on __APP_SCHEMA__.members for select to authenticated
using (user_id = (select auth.uid()) or (select __APP_SCHEMA__.is_admin()));
drop policy if exists members_update on __APP_SCHEMA__.members;
create policy members_update on __APP_SCHEMA__.members for update to authenticated
using ((select __APP_SCHEMA__.is_admin())) with check ((select __APP_SCHEMA__.is_admin()));
drop policy if exists members_delete on __APP_SCHEMA__.members;
create policy members_delete on __APP_SCHEMA__.members for delete to authenticated
using ((select __APP_SCHEMA__.is_admin()) and user_id <> (select auth.uid()));

drop policy if exists audit_select on __APP_SCHEMA__.audit_log;
create policy audit_select on __APP_SCHEMA__.audit_log for select to authenticated
using ((select __APP_SCHEMA__.is_member()));

drop policy if exists work_items_select on __APP_SCHEMA__.work_items;
create policy work_items_select on __APP_SCHEMA__.work_items for select to authenticated
using ((select __APP_SCHEMA__.is_member()));
drop policy if exists work_items_insert on __APP_SCHEMA__.work_items;
create policy work_items_insert on __APP_SCHEMA__.work_items for insert to authenticated
with check ((select __APP_SCHEMA__.is_member()) and created_by = (select auth.uid()));
drop policy if exists work_items_update on __APP_SCHEMA__.work_items;
create policy work_items_update on __APP_SCHEMA__.work_items for update to authenticated
using ((select __APP_SCHEMA__.is_member()))
with check ((select __APP_SCHEMA__.is_member()));
drop policy if exists work_items_delete on __APP_SCHEMA__.work_items;
create policy work_items_delete on __APP_SCHEMA__.work_items for delete to authenticated
using ((select __APP_SCHEMA__.is_admin()));

revoke all on all tables in schema __APP_SCHEMA__ from public, anon, authenticated;
revoke all on all functions in schema __APP_SCHEMA__ from public, anon, authenticated;
grant select on __APP_SCHEMA__.members, __APP_SCHEMA__.audit_log to authenticated;
grant update(role), delete on __APP_SCHEMA__.members to authenticated;
grant select, insert, update(title, description, status, updated_at), delete on __APP_SCHEMA__.work_items to authenticated;
grant usage, select on all sequences in schema __APP_SCHEMA__ to authenticated;
grant execute on function __APP_SCHEMA__.is_member(), __APP_SCHEMA__.is_admin(), __APP_SCHEMA__.add_member_by_email(text, text) to authenticated;

grant select, insert, update, delete on all tables in schema __APP_SCHEMA__ to __DEV_ROLE__;
grant usage, select on all sequences in schema __APP_SCHEMA__ to __DEV_ROLE__;
grant select, insert, update, delete on all tables in schema __APP_SCHEMA__ to __RUNTIME_ROLE__;
grant usage, select on all sequences in schema __APP_SCHEMA__ to __RUNTIME_ROLE__;
alter default privileges in schema __APP_SCHEMA__ grant select, insert, update, delete on tables to __DEV_ROLE__;
alter default privileges in schema __APP_SCHEMA__ grant select, insert, update, delete on tables to __RUNTIME_ROLE__;
alter default privileges in schema __APP_SCHEMA__ grant usage, select on sequences to __DEV_ROLE__, __RUNTIME_ROLE__;

insert into __APP_SCHEMA__.members(user_id, role, created_by)
select id, 'admin', null from auth.users where lower(email) = lower(__INITIAL_ADMIN_EMAIL_SQL__)
on conflict (user_id) do update set role = 'admin';

do $admin$
begin
  if not exists (select 1 from __APP_SCHEMA__.members m join auth.users u on u.id = m.user_id where lower(u.email) = lower(__INITIAL_ADMIN_EMAIL_SQL__) and m.role = 'admin') then
    raise exception 'Initial admin must already exist in Supabase Auth';
  end if;
end
$admin$;

commit;
