-- Admin bootstrap, rendered and executed by provisioning/provision-app.ts immediately after the
-- canonical baseline in supabase/baseline. It creates no monkeyOS registry or state.
--
-- Application tables, policies, functions, and grants to `authenticated` are NOT duplicated here:
-- they live once, in the baseline that every application also has verbatim. This file owns only
-- what an application cannot grant itself — cluster roles — plus the first admin.
--
-- Roles are not named after the application. Each application owns its own Supabase project, so
-- these names are unique where they exist. A role created inside a *foreign* source database to
-- receive a cross-domain grant is a different role and must stay named after the consuming
-- repository; see cross-domain-access.sql.
begin;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_dev') then
    create role app_dev nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    create role app_runtime nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$roles$;

grant usage, create on schema public to app_dev;
grant usage on schema public to app_runtime;
grant select, insert, update, delete on all tables in schema public to app_dev, app_runtime;
grant usage, select on all sequences in schema public to app_dev, app_runtime;
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_dev, app_runtime;
alter default privileges in schema public grant usage, select on sequences to app_dev, app_runtime;
revoke create on schema public from app_runtime;

-- Record the baseline in Supabase migration history so the application's own `supabase db push`
-- continues from it instead of reapplying it.
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
insert into supabase_migrations.schema_migrations (version, name)
values ('__BASELINE_VERSION__', '__BASELINE_NAME__')
on conflict (version) do nothing;

-- One lookup, then insert. A bare `insert ... select` would match no row and succeed silently when
-- the address has no Auth user, so the failure is raised where the address is resolved.
do $admin$
declare
  admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email) = lower(__INITIAL_ADMIN_EMAIL_SQL__);
  if admin_id is null then
    raise exception 'Initial admin must already exist in Supabase Auth';
  end if;
  insert into public.members(user_id, role) values (admin_id, 'admin')
  on conflict (user_id) do update set role = 'admin';
end
$admin$;

commit;
