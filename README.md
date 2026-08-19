# Infinite Monkey Application Platform

## 1. Objective

The **Infinite Monkey Application Platform** is a self-service platform that allows business users and developers to create, test, review, secure and deploy production-ready applications with minimal infrastructure knowledge.

The intended user experience is deliberately simple:

```text
build or change the application
↓
commit code
↓
deploy production
```

The coding agent is the primary interface to the platform.

Users should not normally need to understand or operate:

- GitHub Actions
- branches or pull requests
- Kamal
- Docker hosts
- Cloudflare
- Supabase administration
- cloud networking
- container registries
- production credentials

The platform is **cloud-agnostic for compute**. Applications may run on Azure, AWS, GCP, Hetzner, bare metal or other Docker-capable infrastructure without changing the application-development model.

Several shared services are intentionally standardized:

- **GitHub** — source, CI/CD, secrets, configuration and container registry
- **Cloudflare** — DNS, CDN, TLS and edge
- **Supabase** — Postgres and Auth
- **Kamal** — container deployment

---

# 2. Core Principles

## Self-service by default

Starting a new application should require approximately:

1. Create a GitHub repository from the standard scaffold.
2. Create the application's Supabase schema and schema-scoped developer role.
3. Configure required production secrets.
4. Grant the Application Owner repository access.

After that, the user should be able to work almost entirely through Codex or Claude Code.

There should be no manual per-application:

- infrastructure registration
- deployment registration
- DNS configuration
- container registry setup
- Kamal configuration
- runtime server assignment
- infrastructure repository change
- cloud provisioning

---

## Convention over configuration

The repository is the application's identity.

Example:

```text
repo:
company/damaged-stock
```

automatically derives:

```text
app id          damaged-stock
database schema damaged_stock
container       damaged-stock
production URL  damaged-stock.apps.company.com
GHCR image      ghcr.io/company/damaged-stock:<sha>
```

The normal application requires no deployment configuration file.

Platform defaults should cover the overwhelming majority of applications.

---

## The repository is the application

There is no separate application registry.

Application identity and deployment behavior are derived from:

```text
GitHub repository
+
environment
+
platform conventions
```

There is no custom deployment-state database.

Operational state can be obtained from:

- Git
- GitHub Actions
- GitHub deployment history
- GHCR
- Kamal
- running containers

---

## `main` is source, not production

A commit to `main` never automatically deploys.

```text
main
= latest accepted source

production
= explicitly promoted version
```

Business users may commit directly to `main`.

Developers may use branches when useful, but branches are a collaboration mechanism rather than a deployment requirement.

---

## Automated evidence instead of mandatory human code review

Normal application development does not require mandatory PR review.

Every meaningful change instead goes through:

```text
implementation
↓
tests
↓
agent code review
↓
agent security review
↓
deterministic CI
↓
immutable releasable artifact
```

The goal is high engineering discipline without introducing a slow human approval loop.

---

## Clean and maintainable without over-engineering

Agents should produce code that is:

- clean
- readable
- strongly typed
- cohesive
- testable
- appropriately abstracted
- easy for another developer or agent to change

The engineering philosophy is:

> **SOLID and clean, but simple.**

Avoid both extremes.

### Under-engineered

```text
giant components
duplicated business logic
untyped data
hidden side effects
business logic embedded in UI
ad-hoc state management
```

### Over-engineered

```text
unnecessary interfaces
factories without a real need
generic frameworks for one use case
premature extensibility
deep abstraction hierarchies
excessive indirection
```

An abstraction should normally exist only where it creates a concrete benefit such as:

- meaningful business semantics
- reuse
- easier testing
- isolation of an external dependency
- genuinely likely alternative implementations
- material reduction in complexity

---

# 3. Platform Roles and Trust Model

The platform distinguishes between an **Application Owner** and a **Platform Admin**.

## Application Owner

The Application Owner is the person building and operating the application.

They should normally have GitHub:

```text
Write or Maintain access
```

They can:

- modify application code
- modify tests
- modify application SQL migrations
- commit directly to `main`
- trigger deployment of their own app
- add application-specific secrets through the agent where permitted

They should **not** have GitHub repository Admin access.

---

## Platform Admin

Platform Admins own the security-sensitive platform configuration.

They control:

- protected GitHub workflows
- GitHub rulesets
- production environment configuration
- shared deployment credentials
- runtime pool definitions
- infrastructure hosts
- Cloudflare platform setup
- organization-level Supabase configuration
- deployment policy

This creates the core trust boundary:

> **Application Owners control what their application does, but not where or how it is deployed.**

---

# 4. User Interface

The primary interfaces are:

- Codex
- Claude Code

Advanced users may additionally use:

- VS Code
- Zed

Typical requests:

```text
start app

add a returns dashboard

commit code

deploy production

show deployment status

show logs

rollback production

add this API key

check this repository for security issues
```

The agent abstracts away the underlying infrastructure.

---

# 5. Local Machine Requirements

The workstation should contain development tools, not production infrastructure credentials.

## Required

### Coding Agent

One of:

```text
Codex
Claude Code
```

### Git

Used by the agent for:

```text
status
commit
push
history
```

### GitHub CLI

```text
gh
```

Used for:

- GitHub authentication
- repository inspection
- workflow dispatch
- deployment status
- secret management where permitted
- Actions inspection

Initial setup:

```text
gh auth login
```

### Bun

Bun is the only supported JavaScript/TypeScript runtime and package manager.

Use:

```text
bun install
bun run ...
bun test
bunx ...
```

Do not use:

```text
node
npm
npx
pnpm
yarn
```

### Supabase CLI

Preferably pinned as a project dependency and invoked through Bun.

Typical agent operations:

```text
bunx supabase start
bunx supabase stop
bunx supabase db reset
bunx supabase migration ...
bunx supabase gen types ...
```

### Docker-Compatible Runtime

Required for the local Supabase stack.

Typical options:

```text
macOS
- OrbStack
- Docker Desktop

Windows
- Docker Desktop

Linux
- Docker Engine
- Docker Desktop
```

---

## Not required locally

Application users and developers do not need:

```text
Kamal
cloud provider CLI
production SSH keys
production database credentials
Cloudflare CLI
GitHub runner software
GHCR credentials
```

---

# 6. Self-Service Bootstrap

A newly scaffolded repository should require minimal intervention.

The user says:

```text
start app
```

The agent performs:

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
load seed data
↓
generate DB types
↓
start application
↓
report local URL
```

The agent should also support:

```text
check environment
```

which verifies:

```text
✓ Git
✓ GitHub authentication
✓ Bun
✓ container runtime
✓ Supabase CLI
✓ repository access
```

---

# 7. Local Development

Each application runs against a local Supabase stack.

```text
Application
    ↓
Local Supabase
    ├── Postgres
    ├── Auth
    ├── Data API
    ├── Storage
    └── seed data
```

Local development is isolated from production.

Local:

- database
- Auth users
- data
- migrations

are disposable and reproducible.

---

# 8. Engineering Loop

The development loop is:

```text
understand requirement
↓
plan
↓
implement
↓
test
↓
agent code review
↓
fix findings
↓
agent security review
↓
fix findings
↓
quality gate
↓
commit
```

The user normally experiences only:

```text
"build this"

"commit code"
```

---

# 9. Agent Code Review

Every meaningful change receives a review before commit.

Where supported, the reviewer should preferably use:

- a reviewer sub-agent
- a fresh context
- or a clearly separate second reasoning pass

The review examines both the diff and surrounding architecture.

## Review Areas

### Correctness

- requested behavior implemented correctly
- edge cases handled
- async failures handled
- inputs validated
- failure states considered

### Architecture

- responsibilities placed appropriately
- abstractions justified
- solution not more complex than necessary
- business logic separated appropriately

### Clean Code

- cohesive modules
- reasonably sized functions/components
- no unnecessary duplication
- clear naming
- dead code removed

### React

- server state in TanStack Query
- local state kept local
- Zustand justified
- no unnecessary effects
- React Compiler-compatible patterns

### Database

- schema boundaries respected
- migrations safe
- queries properly scoped
- RLS and grants correct

### UI

- mobile friendly
- accessible
- loading states
- error states
- empty states

### Tests

- important behavior tested
- tests verify outcomes rather than implementation details

---

## Review Findings

```text
BLOCKING
must be fixed before commit

IMPORTANT
should normally be fixed

SUGGESTION
optional improvement
```

No commit occurs while blocking findings remain.

---

# 10. Security Review

Security review is separate from general engineering review.

Every meaningful change follows:

```text
CODE REVIEW
↓
SECURITY REVIEW
↓
AUTOMATED SECURITY CHECKS
```

Review areas include:

### Authentication

- correct Supabase Auth usage
- authentication enforced where required

### Authorization

- RLS correct
- sensitive operations authorized
- app schema boundaries respected

### Data Protection

- PII exposure minimized
- sensitive values not logged
- APIs return only necessary data

### Supabase

- no `service_role` in frontend code
- explicit grants
- RLS enabled
- new objects fail closed
- privileged functions reviewed carefully

### Inputs and Outputs

- untrusted input validated
- safe rendering
- upload restrictions
- no injection risks

### Secrets

- no committed secrets
- no secret logging
- production credentials unavailable locally

### Dependencies

- dependency is necessary
- package maintained
- existing stack cannot already solve the problem
- no known critical vulnerability

### Deployment

- no unexpected ports
- no unsafe host mounts
- no privileged container execution
- no Docker socket access
- runtime secrets appropriately isolated

---

# 11. Continuous Repository Security

Security can degrade even when code is unchanged.

Therefore security operates at two levels:

```text
CHANGE LEVEL
every meaningful change

REPOSITORY LEVEL
periodically even if nothing changed
```

Reasons include:

- new dependency vulnerabilities
- new attack techniques
- better agent/security capabilities
- outdated dependencies
- configuration drift
- stale secrets
- previously missed architectural weaknesses

---

# 12. Periodic Repository Audit

Repositories should run a scheduled audit.

Example:

```text
weekly
↓
GitHub scheduled workflow
↓
repository audit
```

The audit asks:

> **Would we still consider this application secure and maintainable if we built it today?**

Review:

```text
dependencies
authentication
authorization
RLS
database grants
secret usage
frontend security
API boundaries
Docker configuration
GitHub Actions
deployment configuration
logging
PII exposure
```

Periodic engineering review may also identify:

- unnecessary complexity
- duplicated logic
- obsolete workarounds
- unnecessary dependencies
- outdated patterns
- missing tests

Working code should not be rewritten purely for stylistic reasons.

---

# 13. Commit Workflow

The user says:

```text
commit code
```

The agent performs:

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

Expected interaction:

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

# 14. Continuous Integration

Every pushed commit runs independent deterministic CI.

```text
format
↓
lint
↓
TypeScript
↓
unit tests
↓
database / migration tests
↓
RLS tests
↓
dependency security checks
↓
secret scanning
↓
production build
↓
Playwright
↓
container build
↓
push immutable image to GHCR
```

Agent review and CI serve different purposes:

```text
Agent review
= contextual reasoning

CI
= deterministic verification
```

---

# 15. GitHub as Platform Control Plane

GitHub provides:

```text
source
CI
deployment workflows
organization variables
organization secrets
production environment secrets
GHCR
deployment history
scheduled audits
```

There is no separate application secret store or container registry.

---

# 16. Runtime Pool Configuration

Applications map to **runtime pools**, not individual servers.

For V1, all ordinary applications implicitly use:

```text
production/default
```

The runtime pool is an Infinite Monkey platform concept.

Kamal itself receives only concrete hosts.

Example GitHub organization variable:

```text
PROD_DEFAULT_HOSTS
=
app-prod-01.example.internal,app-prod-02.example.internal
```

Potential future pools:

```text
PROD_DEFAULT_HOSTS

PROD_SENSITIVE_HOSTS

PROD_HIGH_MEMORY_HOSTS
```

Normal application repositories contain no pool configuration.

---

## Why GitHub Organization Variables

Runtime host lists are:

- non-secret
- shared across repositories
- controlled centrally
- changed when infrastructure changes, not when apps change

Example:

```text
before:
app-prod-01,app-prod-02

after:
app-prod-01,app-prod-02,app-prod-03
```

Every application automatically uses the new pool definition on its next deployment.

---

# 17. Application-to-Server Mapping

The mapping is:

```text
Repository
damaged-stock
      ↓
Application identity
damaged-stock
      ↓
Environment
production
      ↓
Runtime pool
default
      ↓
GitHub org variable
PROD_DEFAULT_HOSTS
      ↓
app-prod-01
app-prod-02
```

There is no application/server mapping database.

The normal rule is:

> **Every normal app is deployed to every host in the default runtime pool.**

---

# 18. Production Deployment

The user says:

```text
deploy production
```

The agent:

1. identifies the current repository
2. identifies the intended Git SHA
3. verifies CI passed
4. triggers the protected production workflow
5. follows deployment status
6. reports success/failure

---

# 19. GitHub-Hosted Deployment Runner

V1 uses a **GitHub-hosted runner** for production deployment.

There is no dedicated Kamal host.

Architecture:

```text
GitHub Workflow
      ↓
GitHub-hosted runner
      ↓
Kamal CLI
      ↓
SSH
      ↓
application hosts
```

The runner:

- is ephemeral
- installs/runs Kamal for the deployment
- receives the trusted deployment credentials
- generates temporary Kamal configuration
- connects to application hosts over SSH

A self-hosted runner may be introduced later if private-network-only deployment becomes necessary.

---

# 20. Kamal

Kamal is the deployment mechanism, not a permanent service.

The trusted deployment workflow dynamically generates Kamal configuration.

Example:

```text
repo          damaged-stock
sha           8a921cf
environment   production
pool          default

↓ resolve

image:
ghcr.io/company/damaged-stock:8a921cf

hosts:
app-prod-01
app-prod-02

host:
damaged-stock.apps.company.com
```

Kamal then deploys the immutable image to those hosts.

No Kamal configuration is stored in normal application repositories.

---

# 21. Protected Deployment Boundary

This is a critical platform security control.

Application Owners must **not be able to modify production deployment behavior**.

Protected areas include:

```text
.github/workflows/**
```

and any other deployment-sensitive repository paths.

GitHub rulesets should prevent Application Owners from modifying these files while still allowing direct commits to normal application code.

Only Platform Admins or a trusted platform automation identity may bypass these protections.

---

## Application Owner Permissions

The Application Owner may change:

```text
src/**
tests/**
supabase/**
Dockerfile
application dependencies
```

They may not change:

```text
production deployment workflow
runtime hosts
deployment SSH credentials
Kamal deployment policy
deployment target application
production environment security controls
```

---

# 22. Central Trusted Deployment Workflow

The application repository contains only a locked deployment entrypoint.

The actual deployment implementation belongs to a centrally controlled reusable workflow.

Conceptually:

```text
Application repo
      ↓
protected deploy entrypoint
      ↓
central Infinite Monkey deploy workflow
      ↓
GitHub-hosted runner
      ↓
Kamal
```

The central workflow should accept as few user-controlled inputs as possible.

In particular, the Application Owner should **not** be allowed to specify:

```text
application name
target repository
runtime hosts
runtime pool
production domain
SSH target
Docker options
```

These are derived from trusted context and platform conventions.

---

# 23. Deployment Identity Derivation

The central deployment workflow derives:

```text
caller repository
→ application identity

Git SHA
→ immutable GHCR image

environment
→ production

production
→ default runtime pool

GitHub org variable
→ concrete hosts

repo name + domain convention
→ production hostname
```

There is intentionally no API resembling:

```text
deploy(
  app="finance",
  host="finance-prod"
)
```

The permitted operation is effectively:

```text
deploy_this_repository()
```

---

# 24. Production Credential Isolation

Production deployment credentials are available only during the trusted deployment phase.

The Kamal SSH private key should never be:

- present in the application container
- available to normal CI
- available locally
- printed in logs
- exposed to app-controlled scripts

The privileged sequence is:

```text
verify CI
↓
verify immutable GHCR image exists
↓
load production deployment credentials
↓
generate trusted Kamal config
↓
kamal deploy
```

---

## Do Not Execute Application-Controlled Code After Loading Deployment Credentials

The deployment workflow must not do:

```text
load SSH key
↓
checkout app
↓
run arbitrary repo script
↓
deploy
```

Instead:

```text
trusted deployment logic
↓
consume already-built immutable artifact
↓
deploy artifact
```

This prevents an Application Owner from using application-controlled code to exfiltrate deployment credentials.

---

# 25. Container Privilege Boundary

Because Application Owners control their Docker image, the platform must retain control over host-level Docker settings.

Applications must not be able to request:

```text
privileged containers
Docker socket mounts
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker flags
```

Those settings remain part of the trusted central Kamal configuration.

The application owns:

```text
application code
Dockerfile
dependencies
migrations
```

The platform owns:

```text
target hosts
networking
container privileges
host mounts
production domain
deployment credentials
runtime pool
Kamal configuration
```

---

# 26. Container Registry

All application images are stored in **GitHub Container Registry (GHCR)**.

Example:

```text
ghcr.io/company/damaged-stock:8a921cf
```

Images are:

- immutable
- identified by Git SHA
- built once
- tested before deployment
- deployed without rebuilding

---

# 27. Secrets

There is no separate secret-management abstraction.

## Shared Values

GitHub organization secrets may contain shared values such as:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
shared telemetry credentials
```

## Application-Specific Production Secrets

Stored in the application's GitHub `production` environment:

```text
DATABASE_URL
OPENAI_API_KEY
third-party API credentials
```

No repository variables are required for ordinary app configuration.

Secrets flow:

```text
GitHub production environment
↓
trusted deployment workflow
↓
Kamal
↓
application container
```

---

# 28. Cloudflare

Cloudflare is the standard edge layer.

It provides:

- DNS
- CDN
- TLS
- edge protection

Wildcard DNS eliminates per-app configuration:

```text
*.apps.company.com
```

Repository:

```text
damaged-stock
```

becomes:

```text
damaged-stock.apps.company.com
```

Cloudflare fronts the application runtime regardless of whether the compute layer is Azure, AWS, GCP or another provider.

---

# 29. Runtime Infrastructure

Compute remains cloud-agnostic.

Possible providers:

```text
Azure
AWS
GCP
Hetzner
bare metal
other Docker-capable infrastructure
```

A production runtime pool may contain:

```text
app-prod-01
app-prod-02
app-prod-03
```

Each normal application is deployed to every host in the pool.

Example:

```text
app-prod-01
├── damaged-stock
├── returns
├── inventory
└── purchasing

app-prod-02
├── damaged-stock
├── returns
├── inventory
└── purchasing
```

Applications should generally be stateless.

Durable data belongs in Supabase or other external services.

---

# 30. Supabase Architecture

A Supabase project represents an **environment/trust boundary**, not an application.

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

All applications within the environment share the same Auth user population.

A user registers once and can access multiple apps according to authorization.

---

# 31. Developer Access vs Application User Access

These are independent security models.

## Developer / Agent Access

Each app gets a schema-scoped Postgres login role.

Example:

```text
damaged_stock_dev
↓
damaged_stock schema only
```

It may modify objects inside that schema but cannot modify other apps.

Agents must not receive broad:

```text
postgres
project owner
service_role
```

credentials.

---

## Application User Access

Users authenticate through shared Supabase Auth.

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

Authentication is shared.

Authorization is application-specific.

---

# 32. Database Security Defaults

Supabase:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New database objects should fail closed.

Agents explicitly configure:

- grants
- RLS
- application access

SQL migrations are the source of truth.

There is no ORM.

---

# 33. Standard Technology Stack

## Runtime

```text
Bun only
```

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

## UI

```text
Tailwind
Base UI
shadcn
```

No central Infinite Monkey component library initially.

## Forms

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
- no normal data fetching through `useEffect`
- mutations update/invalidate queries correctly

## Client State

```text
React state
+
Zustand only where justified
```

Rules:

```text
local UI state → React
server state → TanStack Query
shared client-only state → Zustand
bookmarkable/shareable state → URL
```

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

# 34. Code Quality Tooling

Formatting:

```text
oxfmt
```

Linting:

```text
oxlint
```

Quality rules include:

- React
- React Compiler
- accessibility
- TypeScript correctness
- type-aware checks
- floating promises

Canonical gate:

```text
oxfmt --check .
oxlint --type-aware .
bun run typecheck
bun test
bun run build
```

Critical workflows additionally run Playwright.

---

# 35. Testing

## Unit

Use Bun test for:

- business logic
- validation
- utilities
- important state transitions

## Database

Test:

- migrations
- RLS
- grants
- permissions
- constraints
- schema assumptions

## End-to-End

Use Playwright for important flows:

```text
login
open app
create record
edit record
save
reload
permissions
```

---

# 36. Mobile-First Requirement

Every application must work on:

- mobile
- tablet
- desktop

Requirements include:

- no horizontal page overflow
- mobile-friendly forms
- usable navigation
- viewport-safe dialogs
- appropriate touch targets
- accessible primary actions
- usable mobile representation for tables

Playwright should cover representative mobile and desktop viewports.

---

# 37. Scaffold, AGENTS.md and Skills

Consistency comes from three mechanisms.

## Project Scaffold

Contains the technical baseline:

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
  rules documented/protected
```

---

## AGENTS.md

Defines engineering behavior.

Examples:

```text
Bun only
strict TypeScript
React Router
React Compiler
no ORM
SOLID but simple
avoid premature abstractions
TanStack Query for server state
Zustand only for shared client state
React Hook Form + Zod
SQL migrations
RLS required
mobile friendly
tests required
agent code review required
security review required
deployment workflows are platform-owned
```

---

## Skills

Recommended initial skills:

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

`commit` orchestrates:

```text
test
↓
review
↓
security-review
↓
verify
↓
commit
```

`deploy` may only request deployment of the current repository.

---

# 38. Future Staging

Staging is intentionally deferred from V1.

Later:

```text
local
↓
CI
↓
staging migration
↓
staging deployment
↓
UI/security tests
↓
production
```

The user experience remains:

```text
deploy production
```

Staging becomes an invisible safety gate using production-like but anonymized/sanitized data.

---

# 39. Overall Architecture

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
              implement / review / secure
                            │
                       commit / push
                            │
                            ▼
                       GitHub CI
                            │
                quality + security checks
                            │
                            ▼
                    Immutable GHCR Image
                            │
                  "deploy production"
                            │
                            ▼
              Protected Deployment Entry Point
                            │
                            ▼
              Central Trusted Deploy Workflow
                            │
                            ▼
                  GitHub-Hosted Runner
                            │
                          Kamal
                            │
                         SSH
                            ▼
                  Production Runtime Pool
             app-prod-01 / app-prod-02 / ...
                            │
                            ▼
                  Application Containers
                            │
                            ▼
                        Supabase
               ┌────────────┴────────────┐
               │                         │
          Shared Auth              App Schemas
                                     + RLS

                            ▲
                            │
                      Cloudflare
                  DNS / CDN / TLS


Platform configuration:

GitHub Organization Variables
        ↓
PROD_DEFAULT_HOSTS
        ↓
runtime pool resolution


Periodic path:

GitHub Repository
      ↓
Scheduled Repository Audit
      ↓
dependency / security / architecture review
```

---

# 40. V1 Definition

A new application requires approximately:

```text
1. Create repository from scaffold
2. Create Supabase schema and schema-scoped developer role
3. Add production secrets
4. Grant Application Owner Write/Maintain access
5. Apply platform workflow protection/ruleset
```

The user's workstation requires:

```text
Codex or Claude Code
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

Normal workflow:

```text
start app

build feature

commit code
  → tests
  → code review
  → security review
  → push

deploy production
  → deploy current repo only
  → protected central workflow
  → GitHub-hosted runner
  → Kamal
```

There should be no normal application-specific:

- infrastructure registration
- server mapping
- cloud-console work
- DNS setup
- Kamal setup
- container registry setup
- deployment-state configuration

---

# Guiding Principles

> **The repository is the application. Everything else should be derived automatically wherever possible.**

> **Application Owners control application behavior, but not deployment infrastructure or deployment policy.**

> **A deployment request can deploy only the calling application; target hosts and deployment credentials are controlled by the platform.**

> **Working code is necessary but insufficient: production software must also be understandable, maintainable and secure.**

> **Agents apply SOLID and clean-code principles pragmatically, without premature abstractions.**

> **Every meaningful change receives an agent code review and security review before commit.**

> **Security is continuous: repositories are periodically reassessed even when their code has not changed.**

> **Agent reasoning and deterministic tooling complement each other; neither replaces the other.**

> **GitHub, Cloudflare, Supabase and Kamal are standardized while the underlying compute infrastructure remains interchangeable.**
