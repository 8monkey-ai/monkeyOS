-- Source-owned, read-only contract. Use security_invoker for views on PostgreSQL 15+.
create view source_domain.published_reference_data
with (security_invoker = true)
as select id, display_name, status from source_domain.reference_data where status = 'active';
revoke all on source_domain.published_reference_data from public, anon, authenticated;
grant usage on schema source_domain to consuming_app_runtime;
grant select on source_domain.published_reference_data to consuming_app_runtime;

-- Cross-domain writes require a separately reviewed, source-owned function/RPC with narrow grants;
-- never grant a consumer broad INSERT/UPDATE/DELETE on the source schema.
