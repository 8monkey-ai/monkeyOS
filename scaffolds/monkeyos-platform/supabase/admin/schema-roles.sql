-- Reference pattern only; provision-app.sql installs the real thing. Login credentials are
-- created and rotated outside source SQL.
--
-- Roles are not named after the application. Each application owns its own Supabase project and the
-- default `public` schema, so these two names are unique wherever they exist.
create role app_dev nologin nosuperuser nocreatedb nocreaterole noinherit;
create role app_runtime nologin nosuperuser nocreatedb nocreaterole noinherit;
grant usage, create on schema public to app_dev;
grant usage on schema public to app_runtime;
grant select, insert, update, delete on all tables in schema public to app_dev, app_runtime;
revoke create on schema public from app_runtime;

-- Attach short-lived or separately managed login identities to these group roles. Never use
-- postgres, project owner, or service_role as an application connection.
