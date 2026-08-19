# Infinite Monkey Application Platform — Architecture & Operating Model

## 1. Objective

The **Infinite Monkey Application Platform** is a self-service application platform that allows business users and developers to create, test, commit and deploy production-ready applications with minimal infrastructure knowledge.

The intended user experience is simple:

- build or change the app using Codex / Claude Code
- `commit code`
- `deploy production`

Users should not need to understand GitHub Actions, branches, Kamal, cloud networking, Supabase administration, container infrastructure, or deployment configuration.

The platform is **cloud-agnostic**. Azure, AWS, GCP, Hetzner, bare metal, or other infrastructure providers are implementation choices underneath the platform rather than part of the application architecture.

---

# 2. Core Principles

## Self-service by default

A new application should require only:

1. a GitHub repository created from the standard scaffold
2. app-scoped database/developer access where required
3. production secrets
4. repository access for the user

No per-application infrastructure registration should be required.

---

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

---

## GitHub `main` is source, not production

A commit to `main` does not automatically deploy.

```text
main = latest accepted source
production = explicitly promoted version
```

Business users may commit directly to `main`.

Developers may use branches when useful, but branches are a collaboration mechanism rather than a deployment requirement.

---

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

---

## Infrastructure is provisioned per environment, not per application

Individual small applications should not require dedicated infrastructure.

Instead, applications run as isolated containers on shared runtime pools.

```text
Environment
├── deployment runner
├── runtime pool
├── container registry
├── ingress
├── secrets
└── observability
```

---

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
- Kamal
- Docker
- production hosts

---

# 4. Application Lifecycle

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

---

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

---

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
```

A successful commit produces an immutable container image identified by the Git SHA.

No production deployment occurs automatically.

---

## Production deployment

The user says:

```text
deploy production
```

The agent:

1. identifies the current repository
2. identifies the intended Git SHA
3. confirms CI passed
4. triggers the platform deployment workflow
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

# 5. Zero Application Registration

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
- CI status
- container registry
- running containers
- GitHub deployment history

---

# 6. Cloud-Agnostic Platform Architecture

The Infinite Monkey Application Platform defines generic platform capabilities.

It does **not** depend architecturally on Azure, AWS or GCP.

```text
Infinite Monkey Application Platform

Application Layer
├── GitHub repository
├── scaffold
├── AGENTS.md
├── agent skills
├── tests
└── container image

Platform Layer
├── CI
├── deployment orchestration
├── deployment runner
├── container registry
├── secret management
├── runtime pools
├── ingress / DNS
├── observability
└── environment conventions

Infrastructure Layer
├── Azure
├── AWS
├── GCP
├── Hetzner
├── bare metal
└── other infrastructure
```

The cloud provider merely supplies infrastructure primitives.

---

# 7. Cloud Provider Abstraction

Typical mappings are:

| Platform capability | Azure | AWS | GCP | Generic |
|---|---|---|---|---|
| Compute | VM / VMSS | EC2 | Compute Engine | Linux host |
| Container registry | ACR | ECR | Artifact Registry | Docker registry |
| Secrets | Key Vault | Secrets Manager | Secret Manager | Vault / GitHub |
| Identity | Managed Identity | IAM Role | Service Account | OIDC / credentials |
| Networking | VNet | VPC | VPC | private network |
| DNS | Azure DNS | Route 53 | Cloud DNS | any DNS provider |

Applications should not know which implementation is used.

---

# 8. Runtime Infrastructure

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
├── container registry
├── ingress / reverse proxy
├── wildcard DNS
├── secret mechanism
├── logging / monitoring
└── networking
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

Additional pools can later provide stronger isolation:

```text
internal apps
public apps
sensitive apps
high-resource apps
```

---

# 9. Kamal Deployment Model

Kamal is the standard deployment mechanism.

Kamal runs from the **deployment runner**, not inside application repositories or application containers.

```text
GitHub Deployment Workflow
        ↓
Deployment Runner
        ↓
generate Kamal configuration
        ↓
kamal deploy
        ↓
application hosts
```

Kamal configuration is generated dynamically.

It is not stored in each application repository.

The deployment logic derives:

- application identity
- container image
- target runtime pool
- hostname
- health endpoint
- secrets
- environment

from conventions and platform defaults.

Because Kamal primarily requires Docker-capable Linux hosts reachable through SSH/networking, the runtime remains portable between cloud providers.

---

# 10. Secrets

## Shared secrets

Values common to many applications may be stored as GitHub organization secrets.

Examples:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
shared telemetry credentials
```

---

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

---

## User experience

Business users should not manually manage secret infrastructure.

The agent can provide operations such as:

```text
add secret
replace secret
list configured secrets
```

Secret values should never be printed back after being stored.

---

## Cloud authentication

Infrastructure access should preferentially use short-lived or workload identity mechanisms such as:

```text
GitHub OIDC
→ cloud identity
→ required infrastructure permissions
```

rather than long-lived cloud credentials stored in repositories.

---

# 11. Supabase Architecture

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

# 12. Developer Access vs Application User Access

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

---

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

# 13. Database Security Defaults

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

# 14. Standard Technology Stack

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

Bun is used for:

- package management
- scripts
- tests
- runtime where applicable

---

## Language

```text
TypeScript
strict mode
```

---

## Frontend

```text
React 19
React Compiler
React Router
Vite
```

React Router is the standard framework.

Next.js is not part of the default stack.

---

## UI

```text
Tailwind
Base UI
shadcn
```

No additional UI framework should be introduced without a strong reason.

No central Infinite Monkey component library is required initially.

---

## Forms and Validation

```text
React Hook Form
Zod
```

---

## Server State

```text
TanStack Query
```

Rules:

- server state belongs in TanStack Query
- do not use `useEffect` for normal data fetching
- mutations should invalidate/update queries properly

---

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

---

## Tables

```text
TanStack Table
```

---

## Charts

```text
Recharts v3
```

---

## Database

```text
Supabase Postgres
supabase-js
SQL migrations
No ORM
```

---

# 15. Code Quality

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

# 16. Testing Strategy

## Unit tests

Use Bun test for:

- business logic
- validation
- utility functions
- important state transitions

Focus on important behavior rather than arbitrary coverage percentages.

---

## Database tests

Test:

- migrations
- RLS
- grants
- permissions
- constraints
- schema assumptions

---

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

# 17. Mobile-First Requirement

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

# 18. Scaffold, AGENTS.md and Skills

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

---

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

---

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
```

Skills define **how the platform should be operated**.

---

# 19. Infrastructure Portability

An application must not care whether production runs on:

```text
Azure
AWS
GCP
Hetzner
private cloud
bare metal
```

The application contract is simply:

```text
Docker image
+
runtime environment variables
+
network endpoint
+
Supabase
```

Infrastructure-provider-specific configuration belongs below the platform abstraction.

This allows environments to move between providers without changing application repositories or the developer workflow.

---

# 20. Future: Staging

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

# 21. Overall Architecture

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
                        CI / Tests
                            │
                  immutable container image
                            │
                            ▼
                    Container Registry
                            │
                  "deploy production"
                            │
                            ▼
                  Deployment Workflow
                            │
                            ▼
                   Deployment Runner
                            │
                          Kamal
                            │
                            ▼
                Shared Application Runtime
                            │
                            ▼
                  Application Container
                            │
                            ▼
                     Supabase
              ┌─────────────┴─────────────┐
              │                           │
         Shared Auth               App Schema
                                     + RLS


                 Infrastructure Backend

          Azure / AWS / GCP / Other
```

---

# 22. V1 Definition

A new application should require approximately:

```text
1. Create GitHub repo from scaffold
2. Create application-specific Supabase schema / developer role
3. Configure production secrets
4. Give the user repository access
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
- deployment configuration
- cloud-console work

---

# Guiding Principle

> **The Infinite Monkey Application Platform defines the application contract, development conventions and deployment experience. Infrastructure providers are interchangeable execution backends.**

And:

> **Standardize the platform, conventions and agent behavior — not every application's implementation.**
