-- Source-owned, read-only contract, installed in the SOURCE domain's own database. Use
-- security_invoker for views on PostgreSQL 15+.
--
-- Note the role naming. Inside its own Supabase project an application uses `app_runtime`, because
-- it is the only application there. A role created inside a foreign source database is different:
-- many consumers coexist, so the source owner names each grantee after the consuming repository.
-- Never collapse these to `app_runtime`.
create view source_domain.published_reference_data
with (security_invoker = true)
as select id, display_name, status from source_domain.reference_data where status = 'active';
revoke all on source_domain.published_reference_data from public, anon, authenticated;
grant usage on schema source_domain to finance_reporting_runtime;
grant select on source_domain.published_reference_data to finance_reporting_runtime;

-- Cross-domain writes require a separately reviewed, source-owned function/RPC with narrow grants;
-- never grant a consumer broad INSERT/UPDATE/DELETE on the source schema.
