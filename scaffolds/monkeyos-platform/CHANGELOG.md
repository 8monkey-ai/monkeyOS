# Changelog

## 2.9.0

- Removed the audit log from the canonical application baseline, so a new application starts with Auth and app-local membership only and inherits no audit table it has not asked for.
- Reframed traceability as a per-module business requirement across the platform contract, the provisioning description, the Supabase baseline notes, the Pi audit prompt, and the database-migration, security-review, test, and commit skills.
- Left the repository contract audit, its workflow, and the baseline checksum verification unchanged; only the runtime audit log was removed.

## 2.8.0

- Made application identity convention rather than configuration: applications keep no identity file, own the default `public` schema, and write the repository name only to the credential-store namespace and the local Supabase container prefix.
- Deleted the whole-repository text rewrite, the ordered literal replacement table, repository-name normalization, and the cross-repository collision check, none of which have anything left to protect.
- Reduced `deriveIdentity` to deployment coordinates and replaced the tree rewrite with two targeted name adoptions.
- Moved the application baseline into `supabase/baseline` as one canonical file, copied verbatim into the template with a recorded checksum, applied by the provisioner and recorded in Supabase migration history; `provision-app.sql` now renders only cluster roles and the initial admin.
- Replaced schema isolation with row level security as the enforced boundary: the baseline revokes Supabase's permissive `public` defaults for existing and future objects, and the application audit fails any table created without RLS or any reintroduced schema selection.

## 2.7.1

- Centralized production-image startup, readiness, browser smoke testing, failure logs, and cleanup in the reusable CI workflow.
- Reused the application's Playwright suite against the immutable image instead of requiring application-owned container orchestration, with deterministic audits preventing those wrappers from returning.

## 2.7.0

- Made the Oxc Rust implementation of React Compiler the centrally audited application standard while preserving React Router's JSX and Fast Refresh ownership.
- Rejected legacy direct Babel compiler dependencies and configuration in application repositories.

## 2.6.0

- Standardized both repositories on Oxlint correctness and suspicious categories with type-aware compiler diagnostics and stale-suppression detection.
- Added application React/accessibility checks and targeted Context-value stability without blanket `react-perf` heuristics.
- Added explicit Oxfmt policy and centrally enforced Tailwind v4 class sorting for applications.
- Replaced unchecked platform input and GitHub response assertions with Zod-validated boundaries.
