# Agent guidance

## Start here

Read `README.md` for the application and `BUSINESS.md` for business routing. Before changing business behavior, load every routed `business/skills/<process-or-module>/SKILL.md`. If rules conflict or an owner decision is missing, stop and surface it instead of inventing behavior.

## Non-negotiable stack

- Latest stable Bun is the only JavaScript runtime, package manager, application server, and test runner; do not pin a Bun minor line or add Node, npm, pnpm, yarn, or another runtime/package manager.
- Strict TypeScript, React 19 with React Compiler, React Router Framework Mode/Vite, Tailwind, shadcn/ui on Base UI, RHF/Zod, TanStack Query/Table, Recharts 3, Supabase SQL migrations without an ORM, oxfmt, type-aware Oxlint with compiler diagnostics, Bun test, and Playwright.
- Keep dependencies on compatible semver ranges and commit `bun.lock`. Let Dependabot refresh compatible dependency and action versions; do not hard-code patch versions in scripts or workflows.
- Prefer SOLID, cohesive modules and direct code. Add abstractions only when they remove demonstrated duplication or enforce a real boundary.
- Keep the React Router project conventional: standard package scripts, root, route modules, type generation, and Vite configuration. Do not add a parallel browser entry, development orchestrator, or custom bundling scheme.

## UI and state

- shadcn/ui is the primary source for standard components and layout primitives. Check `components.json` and `src/components/ui/` first; use `bun run ui:add <component>` so the official `shadcn@latest` CLI generates every standard primitive. Do not hand-write an approximation of a registry component.
- Keep generated/adapted primitives in `src/components/ui/`; compose application components such as the shell in `src/components/`. Preserve `data-slot` attributes, accessibility, keyboard behavior, responsive states, and theme tokens when adapting a primitive.
- Use Base UI through shadcn components, not as a competing application-level component system. Use Tailwind tokens and variants instead of page-specific copies of button, input, dialog, table, sidebar, or card styles.
- TanStack Query owns server state. React owns local component state. Zustand is only for narrow cross-tree client state. Router search params own shareable URL state. Do not fetch routine server state in effects or add manual memoization without evidence.
- Each real business module owns typed `use...` query and mutation hooks plus stable query keys. Those hooks own routine Supabase `.from()`/`.rpc()` access, Zod validation of untrusted inputs, error propagation, and precise cache invalidation or updates after successful mutations.
- Pages and visual components consume those hooks; they do not call `.from()` or `.rpc()` directly for routine server data. Client filtering and hidden controls never replace RLS. Keep `src/lib/database.types.ts`, migrations, hooks, and policy tests aligned.

## Data and security boundaries

- Supabase Auth owns identity; `<app>.members` owns app authorization. UI visibility is convenience only—RLS must enforce every authorization boundary.
- Never expose secret/service-role keys, query or browse `auth.users` from the browser, use user-editable metadata for authorization, or weaken RLS to fix a client error.
- Keep privileged functions in an unexposed schema, revoke default execution, validate `auth.uid()`, set a safe `search_path`, and grant the narrowest required operation.
- The app owns its schema, migrations, audit log, deterministic synthetic seed, and local tests. Never require production data locally.
- This generic foundation owns Auth users, memberships, and audit only. Do not invent placeholder business tables, records, routes, or CRUD. Before adding the first real module, record its purpose, owners, rules, and acceptance scenarios in `BUSINESS.md` and a routed business skill.
- Shared/external sources must be declared, least-privilege, and read-only by default. Do not clone, migrate, mutate, or silently broaden access to them.
- Secrets never enter repository files, logs, command arguments, fixtures, or browser bundles. Use Bun.secrets locally, the protected production environment in GitHub, and the single Zod wrapper in `src/config.ts`.

## Business contract and release discipline

- Update the existing authoritative business skill in place when a process changes. Create a new skill only for a genuinely new bounded process/module; Git preserves history.
- Update `BUSINESS.md` routing when processes are added, split, merged, renamed, or retired. Update behavior, acceptance tests, `CHANGELOG.md`, and `package.json` version together.
- Membership changes and meaningful business mutations require app-local audit events. Preserve last-admin protection and exact-email access behavior.

## Change workflow

1. Inspect the affected code, tests, migrations, `BUSINESS.md`, and routed business skills.
2. Make the smallest coherent change without editing platform-managed files.
3. Run focused tests while iterating, then `bun run check`; its Oxlint gate owns both lint rules and TypeScript compiler diagnostics. Run database and Playwright gates whenever affected.
4. Perform review and security review, fix all blocking findings, and rerun affected gates.
5. Use the `commit` skill so business contracts, changelog/version, tests, review, security review, commit, and push remain one workflow.

`.monkeyos/` and thin `.github/workflows/{ci,deploy,audit}.yml` callers are centrally synchronized. Do not edit them as ordinary application code. Never bypass the protected production environment or rebuild an artifact during deployment.
