# monkeyOS organization platform

This repository is the organization-owned control plane for monkeyOS. It centralizes reusable GitHub workflows, plain-file engineering skills, app provisioning, provider-native infrastructure, Pi configuration, and trusted Kamal deployment. It is portable: replace organization settings and inputs; do not fork in organization, domain, Supabase, account, or host assumptions.

monkeyOS deliberately owns no database or service for applications, users, memberships, audit, domains, catalogs, deployments, workflows, or infrastructure state. GitHub, Supabase Auth, each app schema, Cloudflare, and the selected cloud control plane remain authoritative.

## Install once

1. Create `<organization>/monkeyos-platform` from this scaffold and protect `main` plus the `v1` compatibility tag.
2. Permit organization repositories to call reusable workflows from this repository.
3. Configure the `platform-administration` environment for provisioning and restrict it to Platform Admins.
4. Configure organization variables for `APPS_DOMAIN`, semicolon-delimited `RUNTIME_HOST`, `RUNTIME_ARCH`, `DEPLOY_SSH_USER`, `PI_PROVIDER`, and `PI_MODEL`. `RUNTIME_ARCH` defaults to `arm64`; use `amd64` for AMD or Intel x86-64. Configure the narrowly scoped deployment secrets plus `PI_API_KEY`; never put credentials in variables or files.
5. Install the Supabase admin primitives, with Data API enabled, automatic exposure disabled, automatic RLS enabled, and explicit approved app schemas.
6. Choose and deploy one runtime pool from `infrastructure/aws`, `infrastructure/azure`, or `infrastructure/gcp`.
7. Configure the wildcard Cloudflare Load Balancer with every `RUNTIME_HOST` origin and validate the pool.
8. Create the separate generic app-template repository. Provision each new repository from the template with the dry-run-first workflow.
9. Publish the reviewed `v1` compatibility channel and allow Platform Admins alone to advance it.

The normative checklist is [PLATFORM_CONTRACTS.md](PLATFORM_CONTRACTS.md).

## New application

The Platform Team creates the repository from the app template, ensures the requested initial admin already exists in Supabase Auth, and previews:

```sh
bun run provision --repository acme/finance-reporting \
  --apps-domain apps.acme.example \
  --initial-admin-email owner@acme.example \
  --deployers-team-id 1234
```

After review, rerun with `--apply`. Identity is derived once:

```text
finance-reporting
├── schema: finance_reporting
├── developer role: finance_reporting_dev
├── runtime role: finance_reporting_runtime
├── image: ghcr.io/acme/finance-reporting:<git-sha>
├── hostname: finance-reporting.apps.acme.example
└── local secret service: monkeyOS:acme/finance-reporting
```

Provisioning writes no registry record. It configures state where it belongs: Supabase schema/roles, app-local membership/audit foundations, and initial member; GitHub managed callers, ruleset, and protected environment; existing runtime-pool values in protected environment variables. It never invents business tables or records. The first real module begins only after its owners and rules are captured in `BUSINESS.md` and a routed application-owned skill.

## Central workflows

- `ci.yml`: deterministic quality, local Supabase policy/audit checks, responsive Playwright, selected-architecture Docker smoke test, and one GHCR image tagged by full Git SHA.
- `deploy.yml`: protected environment gate, successful-CI and image verification, trusted temporary Kamal configuration, flexible-pool promotion without rebuild.
- `audit.yml`: deterministic contract checks plus the latest Pi in read-only mode, with explicit organization-controlled provider/model and protected API credentials.
- `provision-app.yml`: Platform Admin bootstrap; never called by an app.

Application callers stay tiny and reference `@v1`. A caller cannot add steps to the reusable-workflow job or widen nested token permissions.

## Skills

Canonical skills live in `skills/` and synchronize into app `.monkeyos/skills/` with a SHA-256 manifest. They are platform-managed files. Application business truth lives separately in `BUSINESS.md` and `business/skills/*/SKILL.md` and is never overwritten by synchronization.

The `commit` skill requires relevant business skills to be loaded and updated in place before version/changelog, tests, review, security review, commit, and push. The repository audit flags unreferenced, overlapping, contradictory, stale, and version-duplicated business skills.

Real application modules keep routine Supabase server state behind typed TanStack Query hooks with stable keys, validated mutations, propagated errors, and precise cache updates. Pages and visual components consume those hooks; RLS independently enforces authorization. The generic scaffold includes no placeholder business CRUD.

Application UI uses official shadcn/ui registry code as its primary component system. Initialize it through `shadcn@latest` with the Base UI preset and add standard components—including the sidebar shell—through the CLI. Keep generated registry primitives in `src/components/ui/`, compose them in application components, and treat hand-written approximations of available registry components as an audit failure.

Application delivery uses standard React Router Framework Mode files and package scripts. Project-level `bunfig.toml` selects Bun for package CLIs, and a small Bun production adapter serves the framework-generated build. Bun is the JavaScript runtime, package manager, application server, and test runner.

## Operations

- GitHub environments/rulesets/roles: `runbooks/github-controls.md`
- Cloudflare wildcard ingress: `runbooks/cloudflare-wildcard-lb.md`
- One-host-at-a-time maintenance: `runbooks/rolling-maintenance.md`
- Trusted deploy generation: `deployment/kamal/README.md`
- Supabase patterns: `supabase/README.md`

## Validate

```sh
bun install --frozen-lockfile
bun run check
```

Validate each provider definition with its native tooling before deployment. Infrastructure commands are Platform Admin operations, never application lifecycle steps.

Use the latest stable Bun for all JavaScript execution, package management, serving, and tests. Dependencies use compatible semver ranges while committed lockfiles preserve exact tested builds. Dependabot natively maintains Bun packages, the moving Bun container base, and GitHub Actions. Workflows use current action major channels and `setup-bun` latest, so toolchain updates do not require script edits. Deployment always promotes the already-tested immutable image and never resolves dependencies again.

Oxlint runs type-aware rules and TypeScript compiler diagnostics together through `oxlint-tsgolint`. Applications generate React Router types first; neither scaffold needs a separate `tsc --noEmit` pass.

## Current implementation references

- GitHub reusable workflows, deployments/environments, and rulesets: <https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows>, <https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments>, <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets>
- Supabase local development and RLS: <https://supabase.com/docs/guides/local-development/cli-workflows>, <https://supabase.com/docs/guides/database/postgres/row-level-security>
- React Router Framework Mode, deployment, and current Bun/non-Node runtime changes: <https://reactrouter.com/start/modes>, <https://reactrouter.com/start/framework/deploying>, <https://reactrouter.com/start/changelog>
- React Compiler with React Router/Vite: <https://react.dev/learn/react-compiler/installation>
- Bun secrets: <https://bun.com/docs/runtime/secrets>
- Pi coding agent: <https://github.com/earendil-works/pi/tree/main/packages/coding-agent>
- Kamal: <https://kamal-deploy.org/docs/configuration/overview/>
- Cloudflare Load Balancing: <https://developers.cloudflare.com/load-balancing/>
- AWS CloudFormation, Azure Bicep, and GCP Infrastructure Manager: <https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-guide.html>, <https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview>, <https://cloud.google.com/infrastructure-manager/docs/terraform>
