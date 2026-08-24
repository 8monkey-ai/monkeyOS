# monkeyOS scaffold validation report

Date: 2026-08-24
Specification: latest `8monkey-ai/monkeyOS` `main` README, updated together with this implementation and treated as authoritative.

## Maintained scaffold sources

- `scaffolds/monkeyos-app-template` — generic application scaffold, version 2.0.0
- `scaffolds/monkeyos-platform` — generic organization-level platform repository, version 2.0.0

## Results

| Area | Result |
| --- | --- |
| Platform formatting, lint, typecheck and unit tests | PASS — 16 tests |
| Runtime architecture contract | PASS — ARM64 default and AMD64 selection tested; invalid aliases rejected |
| App formatting, lint, typecheck, unit tests, production build and deterministic audit | PASS — 3 tests; 0 audit findings |
| Official shadcn/ui integration | PASS — official `shadcn@latest` CLI; Base UI `base-nova` preset; CLI-generated sidebar and standard registry primitives |
| Local Supabase migration, deterministic seed, schema lint and pgTAP RLS/audit tests | PASS — no schema errors; 12 assertions |
| Playwright responsive coverage | PASS — 6 tests across mobile, tablet and desktop |
| GitHub workflow YAML parsing | PASS |
| AWS CloudFormation validation (current `cfn-lint`) | PASS |
| Azure Bicep compilation (official Bicep 0.46.1) | PASS |
| GCP Infrastructure Manager Terraform formatting/init/validation | PASS |
| Stable `oven/bun:alpine` portability | PASS — official Bun image supports Linux ARM64 and x64/AMD64 |
| Local selected-architecture image build | NOT RE-RUN — Docker Desktop stalled while fetching Docker Hub manifest metadata; central CI pulls, builds and smoke-tests the selected platform before publishing |
| Git-tracked source exclusions and credential-pattern scan | PASS |

## Revised contracts

- shadcn/ui is the primary application UI system. `components.json` is initialized through the official CLI with the Base UI preset; standard primitives and the sidebar are installed through `shadcn@latest add`, not recreated by hand. Generated registry files remain in `src/components/ui/`; application composition stays outside it.
- Deterministic repository audits verify the official preset, the CLI entry point, required generated component files, and official Sidebar composition. `AGENTS.md`, central review, and repository-audit skills enforce the same rule on future work.
- The generic scaffold contains no invented business table, seed record, route, or CRUD screen. Its application-definition skill routes the first real module through named owner decisions before implementation; platform provisioning creates only schema/role, membership, and audit foundations.
- Routine Supabase data access lives behind typed TanStack Query hooks with stable keys, validated mutations, error propagation, and precise cache updates. Pages and visual components consume hooks while RLS remains authoritative; deterministic audits enforce this boundary.
- Bun is not pinned to a minor line. GitHub workflows install latest stable Bun, the Dockerfile uses the stable moving `oven/bun:alpine` tag, and container builds force a fresh base-image pull. Committed `bun.lock` still preserves exact application dependency resolutions for each tested SHA.
- One Platform Admin-owned organization variable, `RUNTIME_ARCH`, selects `arm64` or `amd64` and defaults to `arm64`. `amd64` is the OCI architecture name for x86-64 on both AMD and Intel.
- The same architecture value drives central CI, GHCR manifest verification, Kamal configuration and provider architecture inputs. App environments must not shadow it.
- CloudFormation, Bicep and Infrastructure Manager Terraform contain architecture-aware default compute/image pairs plus explicit compatible overrides.
- The architecture-change runbook uses a coordinated replacement pool and newly tested immutable SHA artifacts; applications cannot select or override architecture.

## Scope notes

- The scaffolds contain no monkeyOS-owned central application-state database, registry, audit store, data catalog, deployment-state database or business schema.
- No live Supabase production project, Cloudflare account or cloud account was mutated. Database and browser validation used only the deterministic local Supabase stack.
- Generated dependency directories, build output, browser-test artifacts, local Supabase runtime state, Terraform working directories, credentials, and release ZIPs are excluded from Git.
