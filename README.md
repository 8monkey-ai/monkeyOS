# Infinite Monkey Application Platform

## 1. Objective

The **Infinite Monkey Application Platform** is a self-service platform for business users and developers to build, test, review, secure and deploy production-ready applications with minimal infrastructure knowledge.

The intended experience is:

```text
build or change the application
↓
commit code
↓
deploy production
```

The coding agent—primarily Codex or Claude Code—is the main interface.

Users should not normally need to understand or operate:

- GitHub Actions
- branches or pull requests
- Kamal
- Docker hosts
- Cloudflare
- Supabase administration
- cloud networking
- container registries
- production infrastructure credentials

Compute remains cloud-agnostic. Applications can run on Azure, AWS, GCP, Hetzner, bare metal or another Docker-capable environment.

The standardized platform services are:

```text
GitHub     → source, CI/CD, configuration, secrets, GHCR
Cloudflare → DNS, CDN, TLS, edge
Supabase   → Postgres + Auth
Kamal      → container deployment
```

---

## 2. Core Principles

### Self-service by default

Creating an application should require approximately:

```text
1. Create repo from standard scaffold
2. Create Supabase application schema and roles
3. Configure production secrets
4. Apply platform workflow protection
5. Grant Application Owner access
```

After that, normal development should require no IT intervention.

There should be no per-application:

- infrastructure registration
- deployment registration
- server assignment
- DNS setup
- container-registry setup
- Kamal configuration
- infrastructure-repository change
- cloud provisioning

### Convention over configuration

The repository is the application identity.

```text
repo             company/damaged-stock
app              damaged-stock
database schema  damaged_stock
image            ghcr.io/company/damaged-stock:<sha>
production URL   damaged-stock.apps.company.com
```

The standard application needs no deployment configuration file.

### No separate platform state

There is no application registry or custom deployment-state database.

Operational state comes from:

```text
Git
GitHub Actions
GitHub Deployments
GHCR
Kamal
running containers
```

### `main` is source, not production

```text
main       = latest accepted source
production = explicitly promoted artifact
```

`main` never auto-deploys.

Business users can commit directly to `main`. Branches remain available where useful but are not part of the platform's deployment model.

---

# 3. Roles and Trust Boundary

## Application Owner

Normally receives GitHub **Write or Maintain** access.

Can control:

```text
application code
tests
SQL migrations
dependencies
Dockerfile
application behavior
```

Can:

```text
commit to main
trigger deployment of own application
manage permitted app-specific secrets
```

Should **not** have repository Admin access.

## Platform Admin

Controls:

```text
GitHub rulesets
protected workflows
production environments
deployment credentials
runtime-pool definitions
infrastructure hosts
central deployment workflow
Cloudflare platform setup
shared Supabase configuration
```

The fundamental boundary is:

> **Application Owners control what their application does; Platform Admins control where and how it runs.**

---

# 4. Local Development

Required locally:

```text
Codex or Claude Code
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

Supabase CLI should preferably be project-pinned and invoked through Bun.

Typical agent commands:

```text
bunx supabase start
bunx supabase stop
bunx supabase db reset
bunx supabase gen types ...
```

Not required locally:

```text
Kamal
cloud provider CLI
production SSH keys
production database credentials
Cloudflare CLI
GitHub runner software
GHCR credentials
```

Each application develops against its **own local Supabase stack**, including local Postgres, Auth, Data API, Storage and seed data.

Local database state and Auth users are disposable and reproducible. Normal local development never points at production. This isolation was explicit in the earlier design and should remain so. 

---

# 5. Self-Service Agent Bootstrap

The user says:

```text
start app
```

The agent handles:

```text
check workstation
↓
bun install
↓
verify container runtime
↓
start local Supabase
↓
apply migrations
↓
load seed
↓
generate database types
↓
start application
↓
report local URL
```

And:

```text
check environment
```

checks at least:

```text
✓ Git
✓ GitHub authentication
✓ Bun
✓ container runtime
✓ Supabase CLI
✓ repository access
```

---

# 6. Standard Technology Stack

```text
Runtime/package manager  Bun only
Language                 strict TypeScript

Frontend                 React 19
                         React Compiler
                         React Router
                         Vite

UI                       Tailwind
                         Base UI
                         shadcn

Forms                    React Hook Form
Validation               Zod

Server state             TanStack Query
Local state              React state
Shared client state      Zustand, narrowly
URL state                React Router search params

Tables                    TanStack Table
Charts                    Recharts v3

Database                  Supabase Postgres
Client                    supabase-js
Schema changes            SQL migrations
ORM                       none

Formatting                oxfmt
Linting                   oxlint

Unit testing              Bun test
E2E                       Playwright
```

Do not use npm, pnpm, yarn or npx.

Server state belongs in TanStack Query. Do not duplicate it into Zustand and do not use `useEffect` as the normal fetching mechanism.

There is deliberately **no central Infinite Monkey component library**. Standardize decisions, agent behavior and tooling—not application implementation. The previous README also explicitly captured the tooling gates, tests and scaffold responsibilities, which should remain part of the architecture. 

---

# 7. Engineering Philosophy

> **SOLID and clean, but simple.**

Agents should create code that is:

- readable
- strongly typed
- cohesive
- testable
- appropriately abstracted
- easy for another human or agent to change

Avoid under-engineering such as:

```text
giant components
duplicated business logic
untyped data
hidden side effects
business logic embedded directly in UI
ad-hoc state management
```

Also avoid over-engineering:

```text
unnecessary interfaces
factories without real need
generic frameworks for one use case
premature extensibility
deep abstraction hierarchies
excessive indirection
```

Abstractions should solve a concrete problem rather than a hypothetical future one.

---

# 8. Data Architecture & Governance

The concise governing model is:

> **Own locally. Discover globally. Share explicitly.**

### Each application owns its schema and data

Production Supabase is shared by environment/trust boundary:

```text
Production Supabase
├── auth
├── platform
├── damaged_stock
├── inventory
├── purchasing
├── sales
└── returns
```

Each application controls its own schema by default.

### Database structure is globally discoverable

Development agents can inspect metadata across application schemas:

```text
tables
columns
types
relationships
comments
```

but cannot access their row data.

Example:

```text
damaged_stock_dev

damaged_stock.*  → metadata + data
inventory.*      → metadata only
sales.*          → metadata only
```

This metadata comes dynamically from PostgreSQL through a constrained platform metadata interface. There is **no manually maintained data catalog**.

Before introducing meaningful business entities such as customers, devices, products, stores, suppliers or orders, the agent checks whether a source of truth already exists.

### Sharing is explicit

If another domain already owns the required information, reuse it rather than copying it.

Cross-domain reads use narrow contracts such as views/APIs/RPCs exposing only the required information.

Cross-domain writes require an explicit operation controlled by the owning domain rather than generic write access to another schema.

And:

> **Use the simplest relational model that preserves business meaning and integrity.**

The `database-migration` skill applies these checks automatically alongside RLS, permissions and PII review.

---

# 9. Supabase Security Model

A Supabase project represents an **environment/trust boundary**, not an application.

Auth is shared within that environment.

```text
one user registration
        ↓
shared Supabase Auth
        ↓
JWT
        ↓
app-specific RLS
        ↓
authorized application data
```

So users can authenticate once and use multiple apps; authorization remains app-specific. 

Developer access and user access are completely separate.

### Developer role

Example:

```text
damaged_stock_dev
```

Receives:

- appropriate own-schema development permissions
- global metadata-discovery capability
- explicitly approved cross-domain contracts

Never broad:

```text
postgres
project owner
service_role
```

### Runtime role

Example:

```text
damaged_stock_runtime
```

Receives only production-required privileges:

- required own-schema access
- approved cross-domain runtime contracts
- no DDL
- no global metadata discovery

### Defaults

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New objects fail closed.

The agent explicitly defines:

```text
grants
RLS
authorization
cross-domain access
```

SQL migrations remain canonical.

---

# 10. Engineering Loop

The development loop is:

```text
understand
↓
plan
↓
implement
↓
test
↓
agent code review
↓
fix
↓
agent security review
↓
fix
↓
quality gate
↓
commit
```

The user generally experiences only:

```text
"build this"

"commit code"
```

---

# 11. Agent Code Review

Every meaningful change gets a review before commit.

Prefer:

```text
reviewer sub-agent
fresh context
or independent second pass
```

Review covers:

- correctness and edge cases
- async and error paths
- validation
- architecture
- justified abstractions
- simplicity
- cohesion and duplication
- React/state patterns
- database architecture
- schema ownership
- migrations
- RLS/grants
- mobile UX
- accessibility
- tests

Findings:

```text
BLOCKING    must fix
IMPORTANT   normally fix
SUGGESTION  optional
```

No commit while blocking findings remain. 

---

# 12. Security Review

Security review is distinct from code review.

```text
CODE REVIEW
↓
SECURITY REVIEW
↓
AUTOMATED SECURITY CHECKS
```

It reviews:

```text
authentication
authorization
RLS
schema boundaries
cross-domain data access
PII
logging
input validation
injection
secrets
dependency risk
unsafe browser behavior
container privileges
deployment security
```

The Supabase-specific rules include:

```text
no service_role in frontend
explicit grants
RLS enabled
new objects fail closed
privileged functions treated carefully
```

Deployment review includes host mounts, exposed ports, Docker socket usage, privileged execution and runtime-secret isolation. 

---

# 13. Continuous Security

Security has **two levels**:

```text
CHANGE LEVEL
every meaningful change

REPOSITORY LEVEL
periodically even when untouched
```

This matters because security can degrade without a source-code change:

- dependencies become vulnerable
- packages become abandoned
- attacks evolve
- platform/security agents improve
- configuration becomes stale
- previously unnoticed weaknesses become detectable

This explicit principle from the prior architecture should not be lost. 

Repositories therefore run scheduled audits, for example weekly.

The question is:

> **Would we still consider this app secure and maintainable if we built it today?**

The audit covers security **and** material maintainability, but avoids rewriting code merely because a newer stylistic preference exists.

---

# 14. Commit Workflow

The `commit` skill performs:

```text
1. inspect working tree
2. format
3. lint
4. typecheck
5. unit tests
6. database tests where relevant
7. build
8. agent code review
9. fix blocking findings
10. agent security review
11. fix blocking findings
12. rerun affected checks
13. commit
14. push
```

The user should receive a short outcome:

```text
✓ Formatted
✓ Linted
✓ Types valid
✓ Tests passed
✓ Build passed
✓ Code review passed
✓ Security review passed

Committed and pushed 8a921cf.
```

---

# 15. Continuous Integration

Every pushed commit independently executes:

```text
format
↓
lint
↓
TypeScript
↓
unit tests
↓
database/migration tests
↓
RLS tests
↓
dependency-security checks
↓
secret scanning
↓
production build
↓
Playwright
↓
container build
↓
GHCR publish
```

The distinction is important:

> **Agent review provides contextual reasoning. CI provides deterministic verification.**

Neither replaces the other. 

---

# 16. Immutable Artifact Model

A successful commit produces:

```text
ghcr.io/company/damaged-stock:<git-sha>
```

The image is:

```text
immutable
built once
tested once
security checked
deployed without rebuilding
```

Production therefore promotes an already-tested artifact rather than rebuilding source during deployment. 

---

# 17. GitHub as the Platform Control Plane

GitHub owns:

```text
source
CI
deployment workflows
organization variables
organization secrets
production environment secrets
GHCR
deployment history
scheduled repository audits
```

There is no separate application secret store or container registry.

---

# 18. Runtime Pools

Applications map to **runtime pools**, not individual servers.

Normal V1 applications implicitly use:

```text
production/default
```

Hosts live in a GitHub organization variable:

```text
PROD_DEFAULT_HOSTS=
app-prod-01.example.com,app-prod-02.example.com
```

The mapping is:

```text
repository
damaged-stock
      ↓
production
      ↓
default runtime pool
      ↓
PROD_DEFAULT_HOSTS
      ↓
app-prod-01
app-prod-02
```

Normal repositories have no runtime-pool configuration.

When IT adds a server, it changes `PROD_DEFAULT_HOSTS` once. Application repositories remain untouched. This separation between infrastructure change and app creation was explicit in the previous architecture. 

Every standard app is deployed to every host in the default pool.

---

# 19. Kamal Deployment Model

Kamal is **a deployment mechanism, not a permanent service**. 

V1 uses a GitHub-hosted runner:

```text
GitHub workflow
      ↓
ephemeral GitHub-hosted runner
      ↓
Kamal
      ↓
SSH
      ↓
runtime hosts
```

There is no dedicated Kamal host.

The trusted workflow resolves:

```text
repository → app identity
Git SHA    → GHCR image
production → default runtime pool
org var    → concrete hosts
repo name  → production hostname
```

and generates a temporary Kamal config.

Kamal itself never needs to know what a "runtime pool" is.

No normal application repository contains Kamal configuration.

---

# 20. Protected Deployment Boundary

Application Owners cannot change production deployment behavior.

Protect at least:

```text
.github/workflows/**
```

through GitHub rulesets.

Only Platform Admins/trusted automation can modify protected deployment logic.

Application Owners can still directly modify:

```text
src/**
tests/**
supabase/**
Dockerfile
dependencies
```

but cannot control:

```text
runtime hosts
deployment credentials
target application
Kamal policy
production environment controls
```

---

# 21. Central Trusted Deployment Workflow

The application repository contains only a protected deployment entry point.

```text
App repo
   ↓
protected entrypoint
   ↓
central trusted workflow
   ↓
GitHub-hosted runner
   ↓
Kamal
```

The central workflow does **not** allow the caller to choose:

```text
application name
target repository
runtime host
runtime pool
domain
SSH target
privileged Docker settings
```

Its effective API is:

```text
deploy_this_repository()
```

A user can deploy their app, not another application.

---

# 22. Production Credential Isolation

The production SSH credential exists only inside the privileged deployment phase.

It must never be:

```text
available to ordinary CI
inside application containers
stored locally
printed in logs
available to application-controlled scripts
```

Deployment order:

```text
verify CI
↓
verify immutable GHCR image
↓
load deployment credentials
↓
generate trusted Kamal configuration
↓
kamal deploy
```

Crucially:

> **Once privileged deployment credentials are loaded, do not execute arbitrary application-controlled code.**

The trusted workflow consumes the already-built artifact instead. This is an important security boundary from the prior architecture and should remain explicit. 

---

# 23. Container Privilege Boundary

Application Owners control their application image.

They do **not** control host-level privileges.

Applications cannot request:

```text
privileged containers
Docker socket mounts
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker options
```

The platform controls those through trusted deployment configuration. 

---

# 24. Secrets

Shared sensitive values may be GitHub organization secrets.

Example:

```text
shared telemetry credentials
```

Shared non-sensitive platform configuration belongs in organization variables.

Application-specific production secrets belong in the repo's `production` environment:

```text
DATABASE_URL
OPENAI_API_KEY
third-party credentials
```

The flow is:

```text
GitHub production environment
↓
trusted deployment workflow
↓
Kamal
↓
application container
```

Normal application configuration requires no repository variables. 

---

# 25. Cloudflare & Runtime Infrastructure

Cloudflare provides:

```text
DNS
CDN
TLS
edge protection
```

using wildcard DNS:

```text
*.apps.company.com
```

Therefore:

```text
damaged-stock
→ damaged-stock.apps.company.com
```

without per-app DNS setup.

Runtime compute is interchangeable:

```text
Azure
AWS
GCP
Hetzner
bare metal
other Docker hosts
```

Each runtime host can contain multiple application containers.

Applications should generally be stateless; durable data belongs in Supabase or another explicit durable service. 

---

# 26. Testing & Mobile Requirements

### Unit tests

Use Bun test for:

- business logic
- validation
- utilities
- important state transitions

### Database tests

Test:

- migrations
- RLS
- grants
- permissions
- constraints
- schema assumptions

### E2E

Playwright should exercise important workflows such as:

```text
login
open app
create
edit
save
reload
permissions
```

Every app must work on:

```text
mobile
tablet
desktop
```

Including:

- no horizontal overflow
- usable mobile forms/navigation
- viewport-safe dialogs
- usable touch targets
- accessible primary actions
- sensible mobile presentation for tables

These were explicit requirements in the earlier README and should remain hard platform expectations. 

---

# 27. Scaffold, `AGENTS.md` and Skills

The platform standardizes through three things:

### Scaffold

Technical baseline:

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

.github/
  workflows/
```

### `AGENTS.md`

Defines non-negotiable engineering behavior:

```text
Bun only
strict TypeScript
React Router
React Compiler
no ORM
SOLID but simple
TanStack Query for server state
Zustand only for shared client-only state
RHF + Zod
SQL migrations
RLS required
data-governance rules
mobile friendly
tests required
code review required
security review required
deployment workflows platform-owned
```

### Skills

Initial set:

```text
start
check-environment
test
review
security-review
commit
deploy
rollback
add-secret
database-migration
repository-audit
```

`commit` orchestrates review and verification.

`database-migration` applies the data-architecture rules.

`deploy` can only request deployment of the current repository. 

---

# 28. Future Staging

Staging remains intentionally outside V1.

Later:

```text
local
↓
CI
↓
staging migration
↓
production-like anonymized/sanitized data
↓
staging deployment
↓
UI/security tests
↓
production
```

The user still says only:

```text
deploy production
```

Staging becomes an invisible safety gate rather than another workflow the user has to understand. 

---

# 29. V1 Definition

A new app requires approximately:

```text
1. Create repository from scaffold
2. Create Supabase app schema
3. Create schema-scoped developer role
4. Create narrower runtime role
5. Grant metadata discovery to developer role
6. Configure production secrets
7. Apply protected workflow/ruleset
8. Give Application Owner Write/Maintain access
```

The workstation requires:

```text
Codex or Claude Code
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

Then normal operation is:

```text
start app
↓
build feature
↓
commit code
   → tests
   → agent review
   → security review
   → push
↓
CI creates immutable artifact
↓
deploy production
   → current repo only
   → protected central workflow
   → GitHub-hosted runner
   → Kamal
```

There should still be no normal per-app:

```text
infrastructure registration
server mapping
cloud-console work
DNS setup
Kamal setup
container-registry setup
deployment-state configuration
```

This explicit V1 boundary was one of the strongest parts of the previous README and should stay in the canonical version. 

---

# Overall Architecture

```text
                    BUSINESS USER / DEVELOPER
                              │
                       Codex / Claude
                              │
                         Agent Skills
                              │
                              ▼
                       GitHub App Repo
                       │             │
                       │          SQL changes
                       │             │
                       │      migration skill
                       │             │
                       │      global DB metadata
                       │             │
                       │          Supabase
                       │
                 review + secure
                       │
                  commit / push
                       │
                       ▼
                    GitHub CI
                       │
              deterministic gates
                       │
                       ▼
                 Immutable GHCR
                       │
              "deploy production"
                       │
                       ▼
             Protected Deploy Entry
                       │
                       ▼
            Central Trusted Workflow
                       │
                       ▼
              GitHub-Hosted Runner
                       │
                     Kamal
                       │
                      SSH
                       ▼
               Production Runtime Pool
                 ┌─────┴─────┐
                 ▼           ▼
             app-prod-01  app-prod-02
                 │           │
                 └─────┬─────┘
                       ▼
              Application Containers
                       │
                       ▼
                    Supabase
             ┌─────────┴─────────┐
             ▼                   ▼
         Shared Auth         App Schemas
                              + RLS


Platform configuration:

GitHub Organization Variables
           ↓
   PROD_DEFAULT_HOSTS
           ↓
   runtime pool resolution


Data governance:

Own schema data
     │
     ├── own rows → accessible
     │
     └── all app metadata → discoverable
                              │
                              ▼
                     existing data found
                              │
                              ▼
                    explicit share contract


Continuous assurance:

GitHub Repository
       ↓
Scheduled Repository Audit
       ↓
security / dependency /
architecture / data review
```

# Guiding Principles

> **The repository is the application. Everything else should be derived automatically wherever possible.**

> **Application Owners control application behavior, not deployment infrastructure or deployment policy.**

> **A deployment request can deploy only the calling application.**

> **`main` is source; production is an explicit promotion of an immutable, already-tested artifact.**

> **Own locally. Discover globally. Share explicitly.**

> **Search before introducing shared business entities and reuse existing sources of truth rather than copying data.**

> **Working code is insufficient: production software must also be understandable, maintainable and secure.**

> **Agents apply SOLID and clean-code principles pragmatically, without premature abstractions.**

> **Every meaningful change gets independent code and security review.**

> **Agent reasoning and deterministic tooling complement each other.**

> **Security is continuous, including repositories that have not recently changed.**

> **Governance is implemented through agent behavior and technical boundaries rather than approval bureaucracy.**

> **GitHub, Cloudflare, Supabase and Kamal are standardized while compute remains interchangeable.**

This is the version I’d use going forward: essentially the **full fidelity of the existing README**, with our newer deployment model and the new compact data-governance model folded in rather than replacing useful detail.
