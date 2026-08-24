# Agent guidance

## Start here

Read `README.md` for the application and `BUSINESS.md` for business routing. Before changing business behavior, load every routed `business/skills/<process-or-module>/SKILL.md`. If rules conflict or an owner decision is missing, stop and surface it instead of inventing behavior.

## Non-negotiable stack

- Latest stable Bun only; do not pin a Bun minor line or add npm, pnpm, yarn, Node-only scripts, or another package manager.
- Strict TypeScript, React 19 with React Compiler, React Router/Vite, Tailwind, shadcn/ui on Base UI, RHF/Zod, TanStack Query/Table, Recharts 3, Supabase SQL migrations without an ORM, oxfmt/oxlint, Bun test, and Playwright.
- Keep dependencies on compatible semver ranges and commit `bun.lock`. Let Dependabot refresh compatible dependency and action versions; do not hard-code patch versions in scripts or workflows.
- Prefer SOLID, cohesive modules and direct code. Add abstractions only when they remove demonstrated duplication or enforce a real boundary.

## UI and state

- shadcn/ui is the primary source for standard components and layout primitives. Check `components.json` and `src/components/ui/` first; use `bun run ui:add <component>` so the official `shadcn@latest` CLI generates every standard primitive. Do not hand-write an approximation of a registry component.
- Keep generated/adapted primitives in `src/components/ui/`; compose application components such as the shell in `src/components/`. Preserve `data-slot` attributes, accessibility, keyboard behavior, responsive states, and theme tokens when adapting a primitive.
- Use Base UI through shadcn components, not as a competing application-level component system. Use Tailwind tokens and variants instead of page-specific copies of button, input, dialog, table, sidebar, or card styles.
- TanStack Query owns server state. React owns local component state. Zustand is only for narrow cross-tree client state. Router search params own shareable URL state. Do not fetch routine server state in effects or add manual memoization without evidence.

## Data and security boundaries

- Supabase Auth owns identity; `<app>.members` owns app authorization. UI visibility is convenience only—RLS must enforce every authorization boundary.
- Never expose secret/service-role keys, query or browse `auth.users` from the browser, use user-editable metadata for authorization, or weaken RLS to fix a client error.
- Keep privileged functions in an unexposed schema, revoke default execution, validate `auth.uid()`, set a safe `search_path`, and grant the narrowest required operation.
- The app owns its schema, migrations, audit log, deterministic synthetic seed, and local tests. Never require production data locally.
- Shared/external sources must be declared, least-privilege, and read-only by default. Do not clone, migrate, mutate, or silently broaden access to them.
- Secrets never enter repository files, logs, command arguments, fixtures, or browser bundles. Use Bun.secrets locally, the protected production environment in GitHub, and the single Zod wrapper in `src/config.ts`.

## Business contract and release discipline

- Update the existing authoritative business skill in place when a process changes. Create a new skill only for a genuinely new bounded process/module; Git preserves history.
- Update `BUSINESS.md` routing when processes are added, split, merged, renamed, or retired. Update behavior, acceptance tests, `CHANGELOG.md`, and `package.json` version together.
- Membership changes and meaningful business mutations require app-local audit events. Preserve last-admin protection and exact-email access behavior.

## Change workflow

1. Inspect the affected code, tests, migrations, `BUSINESS.md`, and routed business skills.
2. Make the smallest coherent change without editing platform-managed files.
3. Run focused tests while iterating, then `bun run check`; run database and Playwright gates whenever affected.
4. Perform review and security review, fix all blocking findings, and rerun affected gates.
5. Use the `commit` skill so business contracts, changelog/version, tests, review, security review, commit, and push remain one workflow.

`.monkeyos/` and thin `.github/workflows/{ci,deploy,audit}.yml` callers are centrally synchronized. Do not edit them as ordinary application code. Never bypass the protected production environment or rebuild an artifact during deployment.
