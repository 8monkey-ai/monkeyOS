---
name: database-migration
description: Change app-owned Supabase SQL safely with RLS and audit verification.
---

# Database migration

Use the current Supabase CLI help and create a migration with `supabase migration new <name>`. Change only the application-owned schema. Never create a placeholder business table: every business table must implement a routed, owner-approved business skill. Do not migrate external/shared databases. Use lower-case identifiers, constraints, indexed foreign keys and RLS predicates, explicit grants, separate per-operation policies, `TO authenticated`, and both `USING`/`WITH CHECK` for updates. Keep privileged functions narrowly granted, caller-validating, and on an empty search path. Regenerate database types and update the owning module's typed TanStack Query hooks and stable keys with the migration. Reset local Supabase from scratch, run policy/audit tests as admin/member/non-member, run database advisors when available, and confirm seed reproducibility before commit.
