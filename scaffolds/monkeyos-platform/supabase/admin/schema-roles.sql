-- Role contract installed per app. Login credentials are created/rotated outside source SQL.
create role example_app_dev nologin nosuperuser nocreatedb nocreaterole noinherit;
create role example_app_runtime nologin nosuperuser nocreatedb nocreaterole noinherit;
grant usage, create on schema example_app to example_app_dev;
grant usage on schema example_app to example_app_runtime;
grant select, insert, update, delete on all tables in schema example_app to example_app_dev;
grant select, insert, update, delete on all tables in schema example_app to example_app_runtime;
revoke create on schema example_app from example_app_runtime;

-- Attach short-lived or separately managed login identities to these group roles. Never use
-- postgres, project owner, or service_role as an application connection.
