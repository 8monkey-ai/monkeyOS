---
name: database-migration
description: Change app-owned Supabase SQL safely with RLS and audit verification.
---

# Database migration

Use the current Supabase CLI help and create a migration with `supabase migration new <name>`. The application owns the default `public` schema; never create or select a schema, and never edit the platform-owned baseline migration. Never create a placeholder business table: every business table must implement a routed, owner-approved business skill. Do not migrate external/shared databases. Use lower-case identifiers, constraints, indexed foreign keys, row level security enabled in the same migration as each table, RLS predicates, explicit grants, separate per-operation policies, `TO authenticated`, and both `USING`/`WITH CHECK` for updates. Keep privileged functions narrowly granted, caller-validating, and on an empty search path. Regenerate database types and update the owning module's typed TanStack Query hooks and stable keys with the migration. Reset local Supabase from scratch, run policy/audit tests as admin/member/non-member, run database advisors when available, and confirm seed reproducibility before commit.
