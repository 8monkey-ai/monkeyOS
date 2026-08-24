# Working on monkeyOS

`README.md` is the authoritative platform contract. Read it before changing either scaffold and keep implementation, tests, validation, and contract language aligned.

## Repository layout

- `scaffolds/monkeyos-app-template/` is the independently publishable generic application repository.
- `scaffolds/monkeyos-platform/` is the independently publishable organization platform repository and owns central workflows, skills, provisioning, infrastructure, and deployment mechanics.
- `validation/VALIDATION_REPORT.md` records the latest verified state.

## Non-negotiable boundaries

- Preserve repository-derived identity and portability across GitHub organizations, providers, domains, accounts, and runtime pools.
- Never introduce a monkeyOS-owned application registry, user directory, audit store, data catalog, deployment-state database, infrastructure-state backend, or business schema.
- Keep Contributor, Deployer, and Platform Admin authority separate. Applications cannot choose privileged deployment targets or mechanics.
- Keep application workflows thin and central behavior compatible with the protected `v1` channel.
- Business behavior belongs in application-owned `BUSINESS.md` and current authoritative `business/skills/*/SKILL.md` files. Platform synchronization must never overwrite them.
- The generic scaffold contains only the Auth, app-local membership, and audit foundation. Do not invent placeholder business tables, records, routes, or CRUD; the first real business module starts from a routed business skill and named owner decisions.
- Use official shadcn registry components through `shadcn@latest`; do not hand-write lookalikes for available standard components. Keep registry source in `src/components/ui/` and application composition outside it.
- Applications use standard React Router Framework Mode with its dev/build/typegen CLI forced onto Bun, route modules, the framework root document, the generated Web Streams server build, and a thin `Bun.serve`/`createRequestHandler` adapter. Do not recreate routing, code splitting, dev proxying, or browser bootstrapping in app-owned Vite/server scripts; do not add application middleware to the runtime adapter.
- Keep routine Supabase server state behind typed TanStack Query hooks with stable query keys. Pages and visual components consume those hooks instead of calling `.from()` or `.rpc()` directly; successful mutations invalidate or update the exact affected keys, while RLS remains authoritative.
- Keep the runtime architecture configurable through `RUNTIME_ARCH`, defaulting to `arm64`; use `amd64` for AMD/Intel x86-64. Keep host topology in the protected semicolon-delimited `RUNTIME_HOST` value.
- Use latest stable Bun as the only JavaScript runtime, package manager, application server, and test runner. Do not add a Node executable, direct Node adapter dependency, or Node container base. Keep compatible dependency ranges and committed lockfiles. Deploy only the immutable image already built and tested for the selected architecture.
- Local secrets use Bun.secrets, production secrets use the protected GitHub `production` environment, and tests use explicit fixtures. Never commit secret values.

## Change discipline

1. Update the platform scaffold first when a shared contract, workflow, or skill changes.
2. Synchronize central skills into the app scaffold and update both audit implementations when a cross-repository invariant changes.
3. Update the canonical README when the platform contract changes.
4. Run each scaffold's formatting, lint, typecheck, unit tests, build/audit where applicable, plus affected database, browser, infrastructure, and deployment checks.
5. Update versions, changelogs, and `validation/VALIDATION_REPORT.md` only after the implementation passes.

Do not commit dependency directories, build output, browser artifacts, local Supabase state, Terraform working directories, credentials, or release ZIPs.
