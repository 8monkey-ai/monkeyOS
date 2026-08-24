create schema if not exists monkeyos_app_template;
revoke all on schema monkeyos_app_template from public, anon;
grant usage on schema monkeyos_app_template to authenticated, service_role;

create table monkeyos_app_template.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index members_created_by_idx on monkeyos_app_template.members(created_by);

create table monkeyos_app_template.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  record_id text,
  before_data jsonb,
  after_data jsonb
);
create index audit_log_occurred_at_idx on monkeyos_app_template.audit_log(occurred_at desc);
create index audit_log_actor_idx on monkeyos_app_template.audit_log(actor_user_id);
create index audit_log_entity_record_idx on monkeyos_app_template.audit_log(entity, record_id);

create table monkeyos_app_template.work_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);
create index work_items_created_by_idx on monkeyos_app_template.work_items(created_by);
create index work_items_status_created_idx on monkeyos_app_template.work_items(status, created_at desc);

create function monkeyos_app_template.is_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from monkeyos_app_template.members where user_id = (select auth.uid()));
$$;

create function monkeyos_app_template.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from monkeyos_app_template.members
      where user_id = (select auth.uid()) and role = 'admin'
    );
$$;

create function monkeyos_app_template.audit_membership_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into monkeyos_app_template.audit_log(actor_user_id, action, entity, record_id, before_data, after_data)
  values (
    (select auth.uid()), 'membership.' || lower(tg_op), 'member',
    coalesce(new.user_id, old.user_id)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger members_audit_trigger after insert or update or delete on monkeyos_app_template.members
for each row execute function monkeyos_app_template.audit_membership_change();

create function monkeyos_app_template.protect_last_admin()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin')
    and (select count(*) from monkeyos_app_template.members where role = 'admin') <= 1 then
    raise exception 'cannot remove the final application admin' using errcode = '23514';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger members_last_admin_trigger before update or delete on monkeyos_app_template.members
for each row execute function monkeyos_app_template.protect_last_admin();

create function monkeyos_app_template.audit_work_item_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into monkeyos_app_template.audit_log(actor_user_id, action, entity, record_id, before_data, after_data)
  values (
    (select auth.uid()), 'work_item.' || lower(tg_op), 'work_item',
    coalesce(new.id, old.id)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger work_items_audit_trigger after insert or update or delete on monkeyos_app_template.work_items
for each row execute function monkeyos_app_template.audit_work_item_change();

create function monkeyos_app_template.add_member_by_email(target_email text, target_role text default 'member')
returns monkeyos_app_template.members
language plpgsql security definer set search_path = ''
as $$
declare
  matched_user_id uuid;
  added monkeyos_app_template.members;
begin
  if (select auth.uid()) is null or not monkeyos_app_template.is_admin() then
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
  insert into monkeyos_app_template.members(user_id, role, created_by)
  values (matched_user_id, target_role, (select auth.uid()))
  returning * into added;
  return added;
end;
$$;

alter table monkeyos_app_template.members enable row level security;
alter table monkeyos_app_template.audit_log enable row level security;
alter table monkeyos_app_template.work_items enable row level security;

create policy members_select on monkeyos_app_template.members for select to authenticated
using (user_id = (select auth.uid()) or (select monkeyos_app_template.is_admin()));
create policy members_update on monkeyos_app_template.members for update to authenticated
using ((select monkeyos_app_template.is_admin())) with check ((select monkeyos_app_template.is_admin()));
create policy members_delete on monkeyos_app_template.members for delete to authenticated
using ((select monkeyos_app_template.is_admin()) and user_id <> (select auth.uid()));

create policy audit_select on monkeyos_app_template.audit_log for select to authenticated
using ((select monkeyos_app_template.is_member()));

create policy work_items_select on monkeyos_app_template.work_items for select to authenticated
using ((select monkeyos_app_template.is_member()));
create policy work_items_insert on monkeyos_app_template.work_items for insert to authenticated
with check ((select monkeyos_app_template.is_member()) and created_by = (select auth.uid()));
create policy work_items_update on monkeyos_app_template.work_items for update to authenticated
using ((select monkeyos_app_template.is_member())) with check ((select monkeyos_app_template.is_member()));
create policy work_items_delete on monkeyos_app_template.work_items for delete to authenticated
using ((select monkeyos_app_template.is_admin()));

revoke all on all tables in schema monkeyos_app_template from public, anon, authenticated;
revoke all on all functions in schema monkeyos_app_template from public, anon, authenticated;
grant select on monkeyos_app_template.members, monkeyos_app_template.audit_log to authenticated;
grant update(role), delete on monkeyos_app_template.members to authenticated;
grant select, insert, update(title, description, status, updated_at), delete on monkeyos_app_template.work_items to authenticated;
grant usage, select on all sequences in schema monkeyos_app_template to authenticated;
grant execute on function monkeyos_app_template.is_member(), monkeyos_app_template.is_admin(), monkeyos_app_template.add_member_by_email(text, text) to authenticated;
