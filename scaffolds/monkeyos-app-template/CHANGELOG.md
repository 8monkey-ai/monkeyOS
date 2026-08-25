# Changelog

## 2.9.0

- Removed the baseline audit log: the `audit_log` table, its indexes, the `audit_membership_change` trigger function, the `members` audit trigger, and the audit RLS policy and grant are gone from the platform-owned baseline.
- Removed the audit trail route, its query hook, the sidebar entry, and the `audit_log` generated types; membership mutations now invalidate only the members key.
- Dropped the four audit assertions from the pgTAP suite and the audit step from the responsive Playwright journey, which now visits Access instead.
- Kept `public.is_member()`, whose only caller was the audit policy, as the documented RLS helper for application-owned tables.
- Dropped `grant usage, select on all sequences`, a no-op now that no baseline table has a sequence.
- Corrected the Playwright health assertion, which still expected version 2.7.1.

## 2.8.0

- Replaced the seven-field `monkeyos.identity.json` with convention: the application owns the default `public` schema and derives its only remaining name, the Bun.secrets namespace, from `package.json`.
- Removed schema selection from the Supabase client, generated types, type generation, and `supabase/config.toml`, which also repairs the generated `Tables`/`Enums` helpers that resolved to `never` under a custom schema.
- Adopted the platform-owned baseline migration as a verbatim committed copy with a recorded checksum, instead of maintaining the same DDL in parallel with the provisioner.
- Restored a deny-by-default posture on `public` and made row level security a deterministic audit requirement for every created table.
- Made the audit require that `supabase/config.toml` `project_id` equal the package name, so the two remaining name-bearing values cannot drift apart.

## 2.7.1

- Removed the custom development-test and container-smoke orchestration scripts.
- Let Playwright start the ordinary React Router development command with explicit local test configuration and target externally started production images.
- Reused the browser suite to validate the built image, immutable identity, and generated-asset caching before publication.

## 2.7.0

- Replaced the Babel React Compiler pipeline with the Oxc Rust compiler transform from the official Vite React plugin.
- Kept React Router's JSX and Fast Refresh ownership intact by selecting only the compiler transform, avoiding duplicate refresh-runtime injection.
- Added deterministic repository-audit enforcement for the compiler integration and removal of direct Babel compiler dependencies.

## 2.6.0

- Enabled Oxlint's high-signal suspicious checks plus React and accessibility analysis while retaining type-aware compiler diagnostics.
- Added explicit Oxfmt policy with Tailwind v4 class sorting for attributes and `cn`/`cva` calls.
- Replaced unchecked configuration and platform-response assertions with validated boundaries, strengthened form semantics, and modernized responsive state subscription.

## 2.5.0

- Modernized TypeScript configuration for TypeScript 7 and Bun with `ESNext`, preserved modules, explicit module detection, verbatim module syntax, and checked side-effect imports.
- Removed redundant JavaScript, class-field, module-interop, casing, and JSON-import compatibility options while retaining React Router type generation and strict application checks.

## 2.4.0

- Replaced the separate `tsc --noEmit` pass with Oxlint type-aware linting and compiler diagnostics.
- Kept React Router type generation as an explicit prerequisite and expanded project coverage to the Bun server.

## 2.3.0

- Restored ordinary React Router package scripts and isolated the current Bun development-condition workaround to the `dev` command.
- Moved Bun runtime selection into the standard project-level `bunfig.toml` configuration.
- Removed workaround-specific framework rules and exact internal CLI paths from the scaffold contracts and audits.

## 2.2.0

- Made Bun the only JavaScript runtime across React Router development, type generation, builds, tests, production serving, and containers.
- Replaced the Node/Express app server with a thin native `Bun.serve` adapter around React Router's standard Web Streams request handler.
- Removed direct Node adapter packages, the Node container base, and the development credential subprocess bridge.

## 2.1.0

### Changed

- Replaced the custom SPA bootstrap, dual-process development launcher, Vite proxy/chunking, and Bun static server with standard React Router Framework Mode route modules and commands.
- Moved runtime configuration into the framework root loader, retained Bun.secrets through a narrow development credential bridge, and made `/healthz` a framework resource route.
- Standardized production serving on `@react-router/serve` with the current supported Node LTS while retaining Bun as the only package manager and test runner.

## 2.0.0

### Changed

- Removed the invented work-item domain, CRUD UI, schema, policies, seeds, and provisioning logic so the scaffold starts as a clean application foundation.
- Replaced the placeholder process contract with an application-definition skill that requires owner-confirmed real modules before business implementation.
- Moved membership and audit server state behind typed TanStack Query hooks and made that boundary enforceable through agent instructions, central skills, and repository audits.

## 1.3.0

### Changed

- Reinitialized the component registry with the official shadcn CLI and Base UI `nova` preset.
- Replaced hand-written sidebar, dialog, select, table, textarea, badge, alert, and shell primitives with CLI-generated shadcn components.

## 1.2.0

### Changed

- Follow the latest stable Bun in development, CI, and container builds instead of pinning one Bun minor line.
- Made production architecture platform-selected through `RUNTIME_ARCH`, defaulting to ARM64 while supporting AMD and Intel through AMD64.

## 1.1.0

### Added

- Made shadcn/ui the primary component system, including the responsive application shell.
- Added stronger repository agent rules and automatic compatible dependency maintenance.
- Standardized the then-current Bun toolchain and default-ARM production delivery through the central platform.

## 1.0.0

### Added

- Added the neutral work-item lifecycle with responsive member UI.
- Added Supabase login/logout, app-local admin/member access management, RLS, and audit history.
- Added a Business Application Contract front door and authoritative core-process skill.
- Added deterministic local users/data, secure local configuration, tests, and central workflow callers.
