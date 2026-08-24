# Changelog

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
