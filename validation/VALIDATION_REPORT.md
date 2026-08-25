# monkeyOS scaffold validation report

Date: 2026-08-25
Specification: latest `8monkey-ai/monkeyOS` `main` README, updated together with this implementation and treated as authoritative.

## Maintained scaffold sources

- `scaffolds/monkeyos-app-template` — generic application scaffold, version 2.9.0
- `scaffolds/monkeyos-platform` — generic organization-level platform repository, version 2.9.0

## Results

| Area | Result |
| --- | --- |
| Platform formatting, focused suspicious linting, Oxlint type-aware compiler diagnostics and unit tests | PASS — 15 tests |
| Runtime architecture contract | PASS — ARM64 default and AMD64 selection tested; invalid aliases rejected |
| App Oxfmt/Tailwind formatting, React Router type generation, focused suspicious/React/accessibility linting, Oxlint type-aware compiler diagnostics, unit tests, production build and deterministic audit | PASS — 5 tests; 0 audit findings |
| Convention-based identity audit rules | PASS — each of the seven new rules was negative-tested in a scratch copy and produced its blocking finding: table without row level security, `create schema`, edited platform baseline, returning identity file, client schema selection, `--schema` type generation, and a `config.toml` schema override |
| Platform skill synchronization and baseline checksum | PASS — eleven skills synchronized into both scaffolds with matching manifests; the app audit verifies the committed baseline SHA-256 against `.monkeyos/baseline.manifest.json` |
| React Router Framework Mode on Bun | PASS — ordinary CLI package scripts, project-level Bun runtime configuration, standard route config and root document, generated client/server builds, and a small production adapter |
| Oxc Rust React Compiler | PASS — official Vite React compiler transform with `compiler: true`; React Router retains JSX/Fast Refresh; compiled client output contains React memo-cache runtime code; direct Babel compiler dependencies removed |
| Official shadcn/ui integration | PASS — official `shadcn@latest` CLI; Base UI `base-nova` preset; CLI-generated sidebar and standard registry primitives |
| Local Supabase migration, deterministic seed, schema lint and pgTAP RLS tests | NOT RE-RUN after the move to the default `public` schema — requires Docker and the Supabase CLI; the revoke of `public` from the PUBLIC pseudo-role and the `alter default privileges` block are unverified empirically |
| Playwright responsive coverage | NOT RE-RUN after the move to the default `public` schema — depends on the local Supabase stack above |
| GitHub workflow YAML parsing | PASS |
| AWS CloudFormation validation (current `cfn-lint`) | PASS |
| Azure Bicep compilation (official Bicep 0.46.1) | PASS |
| GCP Infrastructure Manager Terraform formatting/init/validation | PASS |
| Moving runtime-image portability | PASS — current `oven/bun:alpine` supports Linux ARM64 and x64/AMD64; no Node base is present |
| Local selected-architecture image build | PASS — fresh Bun-only Linux ARM64 image built, launched as non-root `bun`, and passed the central workflow's four-test Playwright production smoke path |
| Git-tracked source exclusions and credential-pattern scan | PASS |

## Revised contracts

- shadcn/ui is the primary application UI system. `components.json` is initialized through the official CLI with the Base UI preset; standard primitives and the sidebar are installed through `shadcn@latest add`, not recreated by hand. Generated registry files remain in `src/components/ui/`; application composition stays outside it.
- Deterministic repository audits verify the official preset, the CLI entry point, required generated component files, and official Sidebar composition. `AGENTS.md`, central review, and repository-audit skills enforce the same rule on future work.
- Application identity is a convention rather than stored state. `monkeyos.identity.json`, the derived schema and role names, and the whole-repository text rewrite were removed. Each application owns one Supabase project and therefore the default `public` schema with the fixed `app_dev` and `app_runtime` roles, so no application name appears in source, migrations, policies, or configuration. A repository name now reaches exactly two values, neither read by application code: `package.json` `name`, which namespaces the local credential store, and `supabase/config.toml` `project_id`. Provisioning sets both, and the audit fails when they disagree, which catches the only remaining way identity can go wrong: a half-finished rename. This also fixed a latent defect: with a non-`public` schema key the generated `DefaultSchema` resolved to `never`, silently breaking every `Tables`/`Enums` helper.
- The membership foundation is a single platform-owned baseline migration, byte-identical in every application, committed verbatim in the template with a recorded checksum and applied by provisioning from the same canonical file it then registers in `supabase_migrations.schema_migrations`. The former 130-line duplicate of the same DDL in the app scaffold is gone. Because the default schema ships permissive defaults, the baseline revokes the schema from the PUBLIC pseudo-role as well as `anon`, revokes default privileges on future tables, sequences, and functions, and the audit requires row level security on every created table — a name-independent boundary that is stronger than schema isolation.
- The generic scaffold contains no invented business table, seed record, route, or CRUD screen. Its application-definition skill routes the first real module through named owner decisions before implementation; platform provisioning creates only role and membership foundations, and the baseline ships no audit log.
- Routine Supabase data access lives behind typed TanStack Query hooks with stable keys, validated mutations, error propagation, and precise cache updates. Pages and visual components consume hooks while RLS remains authoritative; deterministic audits enforce this boundary.
- Both scaffolds use `oxlint-tsgolint` with `typeAware` and `typeCheck` enabled. Oxlint reported an intentional TS2322 probe, so the redundant `tsc --noEmit` pass was removed. React Router type generation remains an explicit prerequisite, and the TypeScript projects now cover the Bun production server and platform runtime tests.
- Both scaffolds explicitly enable Oxlint's high-signal `correctness` and `suspicious` categories and reject unused disable directives. The app additionally enables native React and accessibility rules plus the targeted stable-Context-value check; obsolete JSX-scope linting is disabled for the modern transform, and broad `react-perf` heuristics remain off under React Compiler.
- React Compiler now uses `oxc-transform-react` through the `vite:react-compiler` transform supplied by `@vitejs/plugin-react`. Loading the full React plugin beside React Router duplicated the development refresh runtime, so the scaffold selects only its compiler transform; a fail-fast config guard and both repository audits preserve that boundary.
- Playwright now starts the ordinary React Router development command directly with an explicit non-secret local Supabase fixture. The application-owned `dev-test.ts` and `test-container.ts` wrappers and their package scripts were removed. Central CI owns immutable-image startup, readiness, failure logs and cleanup, then reruns the desktop browser suite against the production image; deterministic audits reject restoring those wrappers.
- Both scaffolds commit an Oxfmt configuration with the standard 100-column policy. The app also sorts Tailwind v4 classes in attributes and `cn`/`cva` calls. Deterministic app audits enforce both tool configurations.
- Lint cleanup replaced unchecked JSON and external-response assertions with Zod parsing, associated every login/access label with its control, and moved responsive media-query state to `useSyncExternalStore` without changing Supabase, RLS, membership, or audit behavior.
- Both `tsconfig.json` files use the TypeScript 7/Bun ESM baseline with `ESNext`, preserved modules, bundler resolution, forced module detection, verbatim module syntax, isolated transforms, checked side-effect imports, and explicit strictness. Unused legacy compatibility options were removed, and deterministic app audits enforce the baseline.
- The application uses React Router's standard Framework Mode conventions and ordinary `react-router dev`, `react-router build`, and `react-router typegen` commands. `bunfig.toml` selects Bun for package CLIs. The only development exception supplies Bun's `development` export condition to avoid React Router's current non-Node restart loop; it adds no wrapper or custom server.
- Bun is not pinned to a minor line. It is the JavaScript runtime, package manager, application server, and test runner; GitHub workflows install latest stable Bun, the Dockerfile uses the moving `oven/bun:alpine` base, and committed `bun.lock` preserves exact tested resolutions.
- One Platform Admin-owned organization variable, `RUNTIME_ARCH`, selects `arm64` or `amd64` and defaults to `arm64`. `amd64` is the OCI architecture name for x86-64 on both AMD and Intel.
- The same architecture value drives central CI, GHCR manifest verification, Kamal configuration and provider architecture inputs. App environments must not shadow it.
- CloudFormation, Bicep and Infrastructure Manager Terraform contain architecture-aware default compute/image pairs plus explicit compatible overrides.
- The architecture-change runbook uses a coordinated replacement pool and newly tested immutable SHA artifacts; applications cannot select or override architecture.

## Scope notes

- The scaffolds contain no monkeyOS-owned central application-state database, registry, audit store, data catalog, deployment-state database or business schema.
- The database and browser rows were not re-run for the 2.8.0 identity change; the cloud, container, and workflow rows are unaffected by it and are carried forward from 2.7.1. The first local `supabase db reset` should confirm that revoking `public` from the PUBLIC pseudo-role leaves GoTrue login and PostgREST introspection intact and that the default-privilege revokes apply to tables created by later migrations.
- No live Supabase production project, Cloudflare account or cloud account was mutated. Database and browser validation used only the deterministic local Supabase stack.
- Generated dependency directories, build output, browser-test artifacts, local Supabase runtime state, Terraform working directories, credentials, and release ZIPs are excluded from Git.
