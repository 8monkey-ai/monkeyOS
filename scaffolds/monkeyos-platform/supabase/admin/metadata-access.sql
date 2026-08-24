-- Metadata discovery comes from PostgreSQL catalogs, never a maintained monkeyOS catalog.
-- REFERENCES permits catalog visibility without row reads. Apply only to approved source schemas.
grant usage on schema source_domain to consuming_app_dev;
grant references on all tables in schema source_domain to consuming_app_dev;
alter default privileges for role source_domain_owner in schema source_domain
  grant references on tables to consuming_app_dev;

-- Verify that SELECT is absent:
select has_table_privilege('consuming_app_dev', 'source_domain.example_table', 'select') as must_be_false;
