# Supabase administration primitives

These SQL files are templates and reference patterns for Platform Admins. Only `provision-app.sql` is rendered and executed by the provisioner. It creates one app schema, two schema-scoped roles, app-local tables/policies/functions, and the initial exact-email admin. It creates no central monkeyOS state.

Production should keep the Data API enabled, disable automatic exposure of new tables, enable automatic RLS, and explicitly expose each approved application schema. Revoke grants before adding narrowly scoped grants and policies. Run Supabase database advisors after changes.

The application migration remains canonical and must match the provisioned baseline. External schema metadata visibility uses actual PostgreSQL catalog permissions. Shared data access is an explicit source-owned view/function/API contract and defaults to read-only.
