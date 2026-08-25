# Working on monkeyOS

`README.md` is the authoritative platform contract. Read it before changing either scaffold and keep implementation, tests, validation, and contract language aligned.

## Repository layout

- `scaffolds/monkeyos-app-template/` is the independently publishable generic application repository.
- `scaffolds/monkeyos-platform/` is the independently publishable organization platform repository and owns central workflows, skills, provisioning, infrastructure, and deployment mechanics.
- `validation/VALIDATION_REPORT.md` records the latest verified state.

## Non-negotiable boundaries

- Preserve repository-derived identity and portability across GitHub organizations, providers, domains, accounts, and runtime pools.
- Keep application identity convention rather than stored state: one Supabase project per application, the default `public` schema, fixed `app_dev` and `app_runtime` roles, and no application name in source. The baseline migration is platform-owned and byte-identical; every table needs row level security.
- Never introduce a monkeyOS-owned application registry, user directory, audit store, data catalog, deployment-state database, infrastructure-state backend, or business schema.
- Keep Contributor, Deployer, and Platform Admin authority separate. Applications cannot choose privileged deployment targets or mechanics.
- Keep application workflows thin and central behavior compatible with the protected `v1` channel.
- Business behavior belongs in application-owned `BUSINESS.md` and current authoritative `business/skills/*/SKILL.md` files. Platform synchronization must never overwrite them.
- The generic scaffold contains only the Auth and app-local membership foundation. Do not invent placeholder business tables, records, routes, or CRUD, and do not reintroduce a baseline audit log; traceability belongs to the business module whose owners require it. The first real business module starts from a routed business skill and named owner decisions.
- Use official shadcn registry components through `shadcn@latest`; do not hand-write lookalikes for available standard components. Keep registry source in `src/components/ui/` and application composition outside it.
- Applications use standard React Router Framework Mode files and package scripts. Keep the Vite configuration conventional and the Bun production adapter limited to serving the generated build.
- Keep routine Supabase server state behind typed TanStack Query hooks with stable query keys. Pages and visual components consume those hooks instead of calling `.from()` or `.rpc()` directly; successful mutations invalidate or update the exact affected keys, while RLS remains authoritative.
- Keep the runtime architecture configurable through `RUNTIME_ARCH`, defaulting to `arm64`; use `amd64` for AMD/Intel x86-64. Keep host topology in the protected semicolon-delimited `RUNTIME_HOST` value.
- Use latest stable Bun as the JavaScript runtime, package manager, application server, and test runner. Keep compatible dependency ranges and committed lockfiles. Deploy only the immutable image already built and tested for the selected architecture.
- Keep TypeScript configuration on the TypeScript 7/Bun ESM baseline: `ESNext`, preserved modules with bundler resolution, forced module detection, verbatim module syntax, isolated transforms, checked side-effect imports, and explicit strictness. Do not restore redundant legacy compatibility options.
- Local secrets use Bun.secrets, production secrets use the protected GitHub `production` environment, and tests use explicit fixtures. Never commit secret values.

## Change discipline

1. Update the platform scaffold first when a shared contract, workflow, or skill changes.
2. Synchronize central skills into the app scaffold and update both audit implementations when a cross-repository invariant changes.
3. Update the canonical README when the platform contract changes.
4. Run each scaffold's formatting, Oxlint type-aware compiler diagnostics, unit tests, build/audit where applicable, plus affected database, browser, infrastructure, and deployment checks.
5. Update versions, changelogs, and `validation/VALIDATION_REPORT.md` only after the implementation passes.

Do not commit dependency directories, build output, browser artifacts, local Supabase state, Terraform working directories, credentials, or release ZIPs.
