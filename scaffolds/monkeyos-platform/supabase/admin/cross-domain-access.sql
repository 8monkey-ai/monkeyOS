-- Reference patterns for Platform Admins. Nothing here is executed by the provisioner; install it
-- by hand in the SOURCE domain's own database, never in the consuming application's.
--
-- Note the role naming. Inside its own Supabase project an application uses `app_dev`/`app_runtime`,
-- because it is the only application there. A role created inside a foreign source database is
-- different: many consumers coexist, so the source owner names each grantee after the consuming
-- repository. Never collapse these to `app_runtime`.

-- Metadata discovery comes from PostgreSQL catalogs, never a maintained monkeyOS catalog.
-- REFERENCES permits catalog visibility without row reads. Apply only to approved source schemas.
grant usage on schema source_domain to finance_reporting_dev;
grant references on all tables in schema source_domain to finance_reporting_dev;
alter default privileges for role source_domain_owner in schema source_domain
  grant references on tables to finance_reporting_dev;

-- Verify that SELECT is absent:
select has_table_privilege('finance_reporting_dev', 'source_domain.example_table', 'select') as must_be_false;

-- Row access is a source-owned, read-only contract. Use security_invoker for views on PostgreSQL 15+.
create view source_domain.published_reference_data
with (security_invoker = true)
as select id, display_name, status from source_domain.reference_data where status = 'active';
revoke all on source_domain.published_reference_data from public, anon, authenticated;
grant usage on schema source_domain to finance_reporting_runtime;
grant select on source_domain.published_reference_data to finance_reporting_runtime;

-- Cross-domain writes require a separately reviewed, source-owned function/RPC with narrow grants;
-- never grant a consumer broad INSERT/UPDATE/DELETE on the source schema.
