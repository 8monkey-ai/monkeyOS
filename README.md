# Infinite Monkey Application Platform

## 1. Objective

The **Infinite Monkey Application Platform** is a self-service application platform that allows business users and developers to create, test, commit and deploy production-ready applications with minimal infrastructure knowledge.

The intended user experience is simple:

- build or change the app using Codex / Claude Code
- `commit code`
- `deploy production`

Users should not need to understand GitHub Actions, branches, Kamal, cloud networking, Supabase administration, container infrastructure, or deployment configuration.

The platform is **cloud-agnostic for compute**. Applications may run on Azure, AWS, GCP, Hetzner, bare metal, or other Docker-capable infrastructure without changing the application-development model.

Some platform services are intentionally standardized across all infrastructure providers:

- **GitHub** for source, CI/CD, secrets and container registry
- **Cloudflare** for DNS, CDN and edge/TLS
- **Supabase** for Postgres and Auth
- **Kamal** for application deployment

---

# 2. Core Principles

## Self-service by default

A new application should require only:

1. a GitHub repository created from the standard scaffold
2. an app-specific Supabase schema / developer role where required
3. production secrets
4. repository access for the user

No per-application infrastructure registration should be required.

## Convention over configuration

The repository is the application's identity.

For example:

```text
repo: company/damaged-stock
```

can deterministically derive:

```text
app id          damaged-stock
database schema damaged_stock
container       damaged-stock
production URL  damaged-stock.apps.company.com
secret scope    damaged-stock
```

The default application requires no infrastructure configuration file.

Exceptions may later be expressed through optional application-local configuration.

## GitHub `main` is source, not production

A commit to `main` does not automatically deploy.

```text
main = latest accepted source
production = explicitly promoted version
```

Business users may commit directly to `main`.

Developers may use branches when useful, but branches are a collaboration mechanism rather than a deployment requirement.

## Automated quality gates instead of mandatory code review

Normal application development does not require mandatory human code review.

Instead:

```text
commit
↓
automated checks
↓
releasable artifact
↓
explicit production deployment
```

Automated checks provide the primary release gate.

## Infrastructure is provisioned per environment, not per application

Individual small applications should not require dedicated infrastructure.

Instead, applications run as isolated containers on shared runtime pools.

```text
Environment
├── deployment runner
├── application hosts
├── networking
└── observability
```

GitHub, Cloudflare and Supabase provide the shared platform services around those runtime hosts.

## Standardize decisions and workflows, not application code

The platform does not initially provide a central component library or internal application framework.

Consistency comes from:

- project scaffold
- `AGENTS.md`
- agent skills
- CI rules
- infrastructure conventions

Applications remain independently owned codebases.

---

# 3. User Interface

The primary application-development interfaces are:

- Codex
- Claude Code

Advanced users may additionally use:

- VS Code
- Zed

The agent is the primary interface to the platform.

Typical commands:

```text
start app
commit code
deploy production
show deployment status
show logs
rollback production
add secret
```

The user should normally never need to interact directly with:

- GitHub Actions
- cloud consoles
- Supabase administration
- Cloudflare
- Kamal
- Docker
- production hosts

---

# 4. Local Machine Requirements

Self-service should require only a small, standardized local toolchain.

The objective is:

> **Install the local platform prerequisites once; after that, application work happens through the coding agent.**

## Required Tools

### 1. Codex or Claude Code

One AI coding agent is required as the primary interface to the platform.

The agent is responsible for:

- editing code
- starting the application
- managing local Supabase
- running tests
- formatting/linting
- committing
- pushing
- triggering deployment

VS Code or Zed are optional interfaces for users who want to inspect or edit code directly.

### 2. Git

Git is required locally because application state is stored in a GitHub repository.

The user should not normally need to operate Git manually.

The agent handles actions such as:

```text
git status
git add
git commit
git push
```

The user-facing abstraction remains:

```text
commit code
```

### 3. GitHub CLI (`gh`)

GitHub CLI is required for agent-driven GitHub operations.

It allows the agent to:

- authenticate the user
- inspect the current repository
- interact with Actions
- trigger deployment workflows
- inspect deployment runs
- manage GitHub secrets where permitted

Initial setup should generally be:

```text
gh auth login
```

using the user's normal GitHub identity.

### 4. Bun

Bun is the only supported JavaScript/TypeScript runtime and package manager.

It provides:

- JavaScript/TypeScript runtime
- package management
- package scripts
- test runner
- dependency installation

The project should use:

```text
bun install
bun run ...
bun test
bunx ...
```

and should not use:

```text
node
npm
npx
pnpm
yarn
```

### 5. Supabase CLI

The Supabase CLI is required for the local development environment.

It provides:

- local Supabase startup/shutdown
- local Postgres
- local Auth
- local Data API
- migrations
- schema resets
- TypeScript type generation
- local database testing

The CLI should preferably be pinned as a project dependency and invoked through Bun so every project uses a predictable version.

Typical commands used by the agent include:

```text
bunx supabase start
bunx supabase stop
bunx supabase db reset
bunx supabase migration ...
bunx supabase gen types ...
```

The business user should not normally need to run these manually.

### 6. Docker-Compatible Container Runtime

A Docker-compatible container runtime is required because the Supabase local stack runs as containers.

Recommended defaults:

```text
macOS:
- OrbStack or Docker Desktop

Windows:
- Docker Desktop

Linux:
- Docker Engine / Docker Desktop
```

The container runtime should simply be running in the background. The user should not normally interact with it.

## Not Required Locally

A normal application developer or business user does **not** need:

```text
Kamal
cloud CLI
production SSH keys
production database credentials
Cloudflare CLI
GitHub Actions runner
container registry credentials
```

Those belong to the platform/deployment environment.

In particular, **Kamal runs on the deployment runner**, not the user's machine.

## Recommended One-Time Workstation Setup

Conceptually:

```text
Coding agent
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

Optional:

```text
VS Code
Zed
```

After installation, the user authenticates GitHub once:

```text
gh auth login
```

and receives access to the appropriate GitHub repository.

No production infrastructure credential should normally be installed locally.

## Self-Service Bootstrap Experience

Opening a newly scaffolded repository for the first time should require as little user intervention as possible.

The user should be able to say:

```text
start app
```

The agent then performs roughly:

```text
check required tools
↓
bun install
↓
verify container runtime is running
↓
bunx supabase start
↓
apply local migrations
↓
load seed data
↓
generate DB types if required
↓
start Vite/Bun development server
↓
report local URL
```

Example experience:

```text
User:
start app

Agent:
✓ Dependencies installed
✓ Local Supabase running
✓ Database migrations applied
✓ Development data loaded
✓ Application running

http://localhost:5173
```

The business user should not need to know which commands were executed.

## Local Environment Validation

The agent skill should include a workstation health check.

For example:

```text
check environment
```

verifies:

```text
✓ Git installed
✓ GitHub authenticated
✓ Bun installed
✓ container runtime running
✓ Supabase CLI available
✓ repository access confirmed
```

If something is missing, the agent should provide the smallest possible remediation rather than asking the user to debug the platform themselves.

---

# 5. Application Lifecycle

## Local development

Each application runs against a local Supabase stack.

```text
Application
    ↓
Local Supabase
    ├── Postgres
    ├── Auth
    ├── Data API
    ├── Storage
    └── local seed data
```

Local development therefore requires no production database credentials.

Local data and Auth users are disposable.

## Commit

The user says:

```text
commit code
```

The agent:

1. formats the code
2. runs linting
3. type-checks
4. runs unit tests
5. builds the application
6. runs required additional checks
7. commits
8. pushes to GitHub

## Continuous Integration

Every pushed commit runs CI.

Typical gate:

```text
format
↓
lint
↓
TypeScript checks
↓
unit tests
↓
Supabase migration / RLS tests
↓
production build
↓
Playwright critical flows
↓
build immutable container image
↓
push image to GHCR
```

A successful commit produces an immutable container image identified by the Git SHA.

Example:

```text
ghcr.io/company/damaged-stock:<git-sha>
```

No production deployment occurs automatically.

## Production deployment

The user says:

```text
deploy production
```

The agent:

1. identifies the current repository
2. identifies the intended Git SHA
3. confirms CI passed
4. triggers the GitHub deployment workflow
5. follows deployment status
6. reports success or failure

Conceptually:

```text
User
 ↓
Agent Skill
 ↓
GitHub
 ↓
Deployment Workflow
 ↓
Deployment Runner
 ↓
Kamal
 ↓
Application Runtime
```

---

# 6. Zero Application Registration

There is no separate application registry.

The repository itself identifies the application.

The platform derives everything possible from:

```text
GitHub repository
+
environment
+
platform conventions
```

There is no need to manually:

- register an application in a database
- edit an infrastructure repository
- create per-app Kamal configuration
- create per-app DNS records
- provision per-app servers
- maintain deployment state in a custom database

Operational state can be determined from:

- Git
- GitHub Actions / deployments
- GHCR
- Kamal / running containers

---

# 7. Platform Architecture

The platform intentionally standardizes several shared services rather than abstracting every infrastructure provider.

```text
Infinite Monkey Application Platform

Application Layer
├── GitHub repository
├── scaffold
├── AGENTS.md
├── agent skills
├── tests
└── container image

Shared Platform Services
├── GitHub
│   ├── source control
│   ├── CI/CD
│   ├── production secrets
│   └── GHCR
│
├── Cloudflare
│   ├── DNS
│   ├── CDN
│   └── TLS / edge
│
├── Supabase
│   ├── Postgres
│   └── Auth
│
└── Kamal
    └── deployment orchestration

Runtime Infrastructure
├── Azure
├── AWS
├── GCP
├── Hetzner
├── bare metal
└── other Docker-capable hosts
```

The variable infrastructure layer is therefore primarily **compute and networking**.

---

# 8. Cloud-Agnostic Runtime

Applications should not care which cloud provides their runtime hosts.

Typical mappings:

| Platform capability | Azure | AWS | GCP | Generic |
|---|---|---|---|---|
| Compute | VM / VMSS | EC2 | Compute Engine | Linux host |
| Networking | VNet | VPC | VPC | private network |
| Deployment runner | VM / runner host | EC2 / runner host | VM / runner host | Linux host |

The following remain standardized regardless of cloud:

```text
Source / CI / secrets / registry → GitHub
DNS / CDN / TLS                 → Cloudflare
Database / Auth                 → Supabase
Deployment                      → Kamal
```

---

# 9. Runtime Infrastructure

A typical environment contains:

```text
Environment
│
├── deployment runner
│
├── application runtime pool
│   ├── app-host-01
│   ├── app-host-02
│   └── ...
│
├── networking
└── observability
```

Applications run as Docker containers on the shared runtime pool.

Example:

```text
app-host-01
├── damaged-stock
├── returns
├── inventory
├── purchasing
└── other apps
```

Small applications are not independent infrastructure workloads.

The **Application Platform environment** is the workload.

Additional runtime pools can later provide stronger isolation:

```text
internal apps
public apps
sensitive apps
high-resource apps
```

---

# 10. GitHub as the Platform Control Plane

GitHub provides:

```text
source code
CI
deployment workflows
production environment secrets
container registry
deployment history
```

This avoids separate systems for:

- container registry
- application secret storage
- deployment metadata

Each application repository can own its production secrets while shared values can be provided at organization level.

---

# 11. Container Registry

All application images are stored in **GitHub Container Registry (GHCR)**.

Example:

```text
ghcr.io/company/damaged-stock:8a921cf
```

Images should be:

- immutable
- identified by Git SHA
- built once in CI
- promoted without rebuilding

The same image that passes CI should be deployed to production.

No cloud-specific container registry is required.

---

# 12. Kamal Deployment Model

Kamal is the standard deployment mechanism.

Kamal runs from the **deployment runner**, not inside application repositories or application containers.

```text
GitHub Deployment Workflow
        ↓
Deployment Runner
        ↓
generate Kamal configuration
        ↓
load GitHub production secrets
        ↓
kamal deploy
        ↓
application hosts
```

Kamal configuration is generated dynamically.

It is not stored in each application repository.

The deployment logic derives:

- application identity
- GHCR image
- target runtime pool
- hostname
- health endpoint
- secrets
- environment

from conventions and platform defaults.

Because Kamal primarily requires Docker-capable Linux hosts reachable by the deployment runner, the runtime remains portable between cloud providers.

---

# 13. Secrets

There is no separate platform secret-store abstraction.

GitHub provides application secrets.

## Shared secrets

Values common to many applications may be stored as GitHub organization secrets.

Examples:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
shared telemetry credentials
```

## App-specific production secrets

Each repository owns its application-specific production secrets.

These are stored in its GitHub `production` environment.

Examples:

```text
DATABASE_URL
OPENAI_API_KEY
other external API credentials
```

No repository variables are required for the standard application.

## Deployment

During deployment:

```text
GitHub production secrets
        ↓
Deployment Workflow
        ↓
Deployment Runner
        ↓
Kamal
        ↓
application container environment
```

Secrets should never be committed to the repo.

They should not be printed back to the user.

## User experience

Business users should not manually manage secrets through the GitHub UI.

The agent can provide operations such as:

```text
add secret
replace secret
list configured secrets
```

---

# 14. Cloudflare DNS and CDN

Cloudflare is the standard edge layer across all runtime providers.

It provides:

- DNS
- CDN
- TLS
- edge protection
- consistent public application routing

The platform should use wildcard DNS wherever possible.

Example:

```text
*.apps.company.com
```

A repository:

```text
damaged-stock
```

therefore maps automatically to:

```text
damaged-stock.apps.company.com
```

No per-application DNS setup is required.

Cloudflare remains unchanged even if the runtime moves between:

```text
Azure
AWS
GCP
Hetzner
other infrastructure
```

Only the wildcard origin/runtime routing needs to point at the appropriate application ingress.

---

# 15. Supabase Architecture

Supabase is the standard database and Auth platform.

A Supabase project represents an **environment/trust boundary**, not an individual application.

Example:

```text
Production Supabase
│
├── shared Auth
├── shared/platform schemas
├── damaged_stock
├── returns
├── inventory
└── purchasing
```

All applications within the same environment can share the same Supabase Auth user population.

A user therefore registers once and can use multiple applications.

---

# 16. Developer Access vs Application User Access

These are separate security models.

## Developer / Agent Access

Each application receives its own Postgres login role.

Example:

```text
damaged_stock_dev
      ↓
damaged_stock schema only
```

The role may have development privileges within that schema.

It should not have access to:

```text
inventory.*
returns.*
other application schemas
```

Developers and coding agents should not receive broad production credentials such as:

```text
postgres
project-owner credentials
service_role
```

## Application User Access

Application users authenticate using shared Supabase Auth.

```text
User
 ↓
Supabase Auth
 ↓
JWT / auth.uid()
 ↓
RLS
 ↓
application data
```

Authorization is app-specific.

For example:

```text
Alice
├── returns       editor
├── inventory     viewer
└── damaged-stock none
```

This gives:

```text
authentication → shared
authorization  → application-specific
```

---

# 17. Database Security Defaults

Recommended Supabase defaults:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New tables therefore fail closed.

Agents must explicitly configure:

- grants
- RLS
- application access

SQL migrations are the canonical database definition.

There is no ORM.

---

# 18. Standard Technology Stack

## Runtime

```text
Bun only
```

Do not use:

- Node.js as the application runtime
- npm
- pnpm
- yarn
- npx

## Language

```text
TypeScript
strict mode
```

## Frontend

```text
React 19
React Compiler
React Router
Vite
```

React Router is the standard framework.

Next.js is not part of the default stack.

## UI

```text
Tailwind
Base UI
shadcn
```

No additional UI framework should be introduced without a strong reason.

No central Infinite Monkey component library is required initially.

## Forms and Validation

```text
React Hook Form
Zod
```

## Server State

```text
TanStack Query
```

Rules:

- server state belongs in TanStack Query
- do not use `useEffect` for normal data fetching
- mutations should invalidate/update queries properly

## Client State

```text
React state
+
Zustand where necessary
```

Rules:

- local UI state → React
- server state → TanStack Query
- genuinely shared client-only state → Zustand
- bookmarkable/shareable state → URL/search params

Zustand must not become a generic application data store.

## Tables

```text
TanStack Table
```

## Charts

```text
Recharts v3
```

## Database

```text
Supabase Postgres
supabase-js
SQL migrations
No ORM
```

---

# 19. Code Quality

Formatting:

```text
oxfmt
```

Linting:

```text
oxlint
```

Recommended checks include:

- React rules
- React Compiler rules
- accessibility
- TypeScript correctness
- type-aware checks
- floating promises

The canonical quality gate should approximately perform:

```text
oxfmt --check .
oxlint --type-aware .
bun run typecheck
bun test
bun run build
```

Critical flows additionally run Playwright.

---

# 20. Testing Strategy

## Unit tests

Use Bun test for:

- business logic
- validation
- utility functions
- important state transitions

Focus on important behavior rather than arbitrary coverage percentages.

## Database tests

Test:

- migrations
- RLS
- grants
- permissions
- constraints
- schema assumptions

## End-to-End tests

Use Playwright for important user flows.

Examples:

```text
login
open application
create record
edit record
save
reload
permission checks
```

Because mandatory human review is minimized, UI and integration testing are especially important.

---

# 21. Mobile-First Requirement

Every application must work well on:

- mobile
- tablet
- desktop

This is an acceptance criterion.

Important rules:

- no horizontal page overflow
- forms work on small screens
- navigation remains usable
- dialogs fit the viewport
- touch targets remain usable
- primary actions remain accessible
- tables have an appropriate mobile presentation

Playwright should test representative mobile and desktop viewports.

---

# 22. Scaffold, AGENTS.md and Skills

Consistency comes from three mechanisms.

## Project Scaffold

The standard project contains the technical baseline.

Example:

```text
src/
supabase/
tests/
Dockerfile

package.json
bun.lock
tsconfig.json
vite.config.ts
oxlint.json
oxfmt.json

AGENTS.md
```

The approved dependencies are already installed.

## AGENTS.md

`AGENTS.md` contains application-development rules.

Examples:

```text
- Bun only
- strict TypeScript
- React Router
- no ORM
- TanStack Query for server state
- Zustand only for shared client state
- React Hook Form + Zod
- SQL migrations
- RLS required
- mobile friendly
- quality checks required before commit
```

`AGENTS.md` defines **how code should be written**.

## Skills

Skills define operational workflows.

Examples:

```text
create app
start app
test
commit
deploy
rollback
add secret
database migration
check environment
```

Skills define **how the platform should be operated**.

---

# 23. Infrastructure Portability

An application must not care whether production compute runs on:

```text
Azure
AWS
GCP
Hetzner
private cloud
bare metal
```

The application contract is:

```text
GitHub repository
+
GHCR container image
+
runtime environment variables
+
network endpoint
+
Supabase
```

Cloud-provider-specific configuration belongs below the platform boundary.

The standard platform services remain fixed:

```text
GitHub     → source, CI, secrets, GHCR
Cloudflare → DNS, CDN, TLS
Supabase   → database, Auth
Kamal      → deployment
```

This keeps the application-development model consistent even when infrastructure providers differ.

---

# 24. Future: Staging

Staging is intentionally deferred from V1.

A later version can transparently introduce:

```text
local
↓
CI
↓
staging migration
↓
staging deployment
↓
automated/UI tests
↓
production
```

The business-user interface remains unchanged:

```text
deploy production
```

Staging becomes an internal safety gate.

Production-like staging data should be anonymized/sanitized before being made available outside production.

---

# 25. Overall Architecture

```text
                 BUSINESS USER / DEVELOPER
                           │
                    Codex / Claude
                           │
                      Agent Skills
                           │
                           ▼
                    GitHub App Repo
                           │
                      commit / push
                           │
                           ▼
                       GitHub CI
                           │
                 immutable container image
                           │
                           ▼
                          GHCR
                           │
                 "deploy production"
                           │
                           ▼
                GitHub Deployment Workflow
                           │
                           ▼
                  Deployment Runner
                           │
                         Kamal
                           │
                           ▼
               Shared Application Runtime
            Azure / AWS / GCP / Other
                           │
                           ▼
                 Application Container
                           │
                           ▼
                       Supabase
              ┌────────────┴────────────┐
              │                         │
         Shared Auth              App Schema
                                    + RLS

                           ▲
                           │
                     Cloudflare
                 DNS / CDN / TLS
```

---

# 26. V1 Definition

A new application should require approximately:

```text
1. Create GitHub repo from scaffold
2. Create application-specific Supabase schema / developer role
3. Configure production environment secrets
4. Give the user repository access
```

The developer/business user's machine needs only the standard workstation setup:

```text
Codex or Claude Code
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible container runtime
```

After that, the normal user workflow is:

```text
start app
build feature
commit code
deploy production
```

There should be no application-specific:

- infrastructure registration
- runtime provisioning
- DNS setup
- Kamal configuration
- container registry setup
- cloud-console work
- production infrastructure credentials on the user's workstation

---

# Guiding Principles

> **The Infinite Monkey Application Platform standardizes GitHub, Cloudflare, Supabase and Kamal while keeping the underlying compute infrastructure interchangeable.**

> **Standardize the platform, conventions and agent behavior — not every application's implementation.**

> **The repository is the application. Everything else should be derived automatically wherever possible.**

> **The workstation should contain development tools, not production infrastructure credentials.**
