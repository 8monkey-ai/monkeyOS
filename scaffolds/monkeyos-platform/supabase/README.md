# Supabase administration primitives

`supabase/baseline` is the canonical application baseline: members, audit log, policies, privileged functions, and the deny-by-default posture on `public`. It names no application, so it is byte-identical everywhere; the template ships it verbatim and records its checksum in `.monkeyos/baseline.manifest.json`. Change it here and copy it into the template together.

The other files are reference patterns for Platform Admins. Only `admin/provision-app.sql` is rendered and executed by the provisioner. It runs immediately after the baseline and creates the two cluster roles, their grants, the baseline's entry in Supabase migration history, and the initial exact-email admin. It duplicates no application DDL and creates no central monkeyOS state.

Production should keep the Data API enabled. Row level security, not schema isolation, is the authorization boundary: the baseline revokes Supabase's permissive `public` defaults for existing and future objects, and the application repository audit fails any migration that creates a table without `enable row level security`. Revoke grants before adding narrowly scoped grants and policies. Run Supabase database advisors after changes.

External schema metadata visibility uses actual PostgreSQL catalog permissions. Shared data access is an explicit source-owned view/function/API contract and defaults to read-only, with each grantee in the source domain named after the consuming repository.
