# Infinite Monkey Application Platform

## 1. Objective

The **Infinite Monkey Application Platform** is a self-service application platform that allows business users and developers to create, test, review and deploy production-ready applications with minimal infrastructure knowledge.

The intended user experience is deliberately simple:

```text
build or change the application
↓
commit code
↓
deploy production
```

The user should not need to understand or operate:

- GitHub Actions
- deployment infrastructure
- Kamal
- Docker hosts
- Cloudflare
- Supabase administration
- cloud networking
- container registries
- production credentials

The coding agent is the primary interface to the platform.

The platform is **cloud-agnostic for compute**. Applications may run on Azure, AWS, GCP, Hetzner, bare metal or other Docker-capable infrastructure without changing the application-development model.

Several shared services are deliberately standardized across environments:

- **GitHub** — source, CI/CD, secrets and container registry
- **Cloudflare** — DNS, CDN, TLS and edge
- **Supabase** — Postgres and Auth
- **Kamal** — application deployment

---

# 2. Core Principles

## Self-service by default

Starting a new application should require approximately:

1. create a GitHub repository from the standard scaffold
2. create the application's Supabase schema and schema-scoped developer role
3. configure required production secrets
4. grant the user access to the GitHub repository

After that, the application should be fully operable through the coding agent.

There should be no manual per-application:

- infrastructure registration
- deployment registration
- DNS configuration
- container registry setup
- Kamal configuration
- cloud provisioning
- infrastructure repository changes

---

## Convention over configuration

The GitHub repository is the application's identity.

For example:

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
```

The default application requires no deployment configuration file.

If an application eventually needs to deviate from platform defaults, a small repo-local override may be introduced, but this should be the exception.

---

## The repository is the application

There is no separate application registry.

The platform derives application identity and deployment information from:

```text
GitHub repository
+
environment
+
platform conventions
```

There is no custom deployment-state database.

Operational information can be obtained from:

- Git
- GitHub Actions
- GitHub deployment history
- GHCR
- Kamal
- running containers

---

## `main` is source, not production

A commit to `main` does not automatically deploy.

```text
main
= latest accepted source

production
= explicitly promoted version
```

Business users may commit directly to `main`.

Developers may use branches when collaboration makes them useful, but branches are not required by the platform.

Production deployment is always explicit.

---

## Automated evidence instead of mandatory human code review

Normal application development does not require mandatory human PR review.

Instead, every change must pass:

```text
implementation
↓
automated tests
↓
agent code review
↓
agent security review
↓
deterministic CI
↓
releasable artifact
```

The aim is to preserve speed while maintaining engineering and security discipline.

---

## Clean and maintainable, without over-engineering

Agents should produce code that is:

- clean
- readable
- strongly typed
- cohesive
- testable
- appropriately abstracted
- easy for another developer or agent to modify

The preferred engineering philosophy is:

> **SOLID and clean, but simple.**

Avoid both extremes.

### Under-engineered

```text
giant components
duplicated business logic
untyped data
hidden side effects
business logic mixed into UI
ad-hoc state management
```

### Over-engineered

```text
unnecessary interfaces
factory layers without a real need
generic frameworks for one use case
premature extensibility
deep abstraction hierarchies
excessive indirection
```

The target is:

```text
simple solution
+
clear responsibilities
+
appropriate boundaries
+
easy to test
+
easy to change
```

An abstraction should normally exist only when it provides a concrete benefit such as:

- meaningful business semantics
- reuse
- easier testing
- isolation of an external dependency
- genuinely likely alternative implementations
- meaningful reduction in complexity

---

# 3. User Interface

The primary interfaces are:

- Codex
- Claude Code

Advanced users may additionally use:

- VS Code
- Zed

The agent should be able to understand natural-language requests such as:

```text
start app

add a returns dashboard

commit code

deploy production

show logs

rollback production

add this API key

check this repository for security issues
```

The user should not normally operate the underlying tooling directly.

---

# 4. Local Machine Requirements

The local workstation should contain development tools, not production infrastructure credentials.

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
- GitHub secret management
- Actions inspection

Initial user setup:

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

Preferably installed/pinned as a project dependency and invoked with Bun.

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

Typical choices:

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

## Optional

```text
VS Code
Zed
```

---

## Not required locally

Normal application users and developers do not need:

```text
Kamal
cloud provider CLI
production SSH keys
production DB credentials
Cloudflare CLI
GitHub Actions runner
GHCR credentials
```

These belong to the platform/deployment environment.

---

# 5. Self-Service Bootstrap Experience

A newly scaffolded project should require almost no technical setup by the user.

The user says:

```text
start app
```

The agent performs approximately:

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

Example:

```text
✓ GitHub authenticated
✓ Dependencies installed
✓ Local Supabase running
✓ Database migrations applied
✓ Development data loaded
✓ Application running

http://localhost:5173
```

The agent should also expose:

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

# 6. Application Lifecycle

## Local Development

Each application uses a local Supabase stack:

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

# 7. Engineering Loop

The development loop should be:

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

The user normally sees only:

```text
"build this"

"commit code"
```

The review loop is internal to the agent workflow.

---

# 8. Agent Code Review

Every meaningful change must receive an agent review before commit.

Where supported, the review should preferably use:

- a reviewer sub-agent
- a fresh context
- or a clearly separate second reasoning pass

The reviewer examines both the diff and the surrounding architecture.

## Review Areas

### Correctness

- Does the implementation satisfy the request?
- Are edge cases handled?
- Are async errors handled correctly?
- Are inputs validated?
- Are failure states considered?

### Architecture

- Are responsibilities separated appropriately?
- Is business logic in the right place?
- Are abstractions justified?
- Is the solution simpler than necessary?
- Is anything unnecessarily coupled?

### Clean Code

- Are modules cohesive?
- Are functions/components reasonably sized?
- Is logic duplicated?
- Are names clear?
- Is dead code removed?
- Is complexity justified?

### React

- Is server state in TanStack Query?
- Is local state local?
- Is Zustand justified?
- Are effects used appropriately?
- Does the code follow React Compiler-compatible patterns?

### Database

- Are queries scoped correctly?
- Are migrations safe?
- Are schema boundaries respected?
- Are grants and RLS correct?

### UI

- Is mobile support correct?
- Are loading states handled?
- Are empty states handled?
- Are error states handled?
- Is accessibility preserved?

### Tests

- Is important behavior tested?
- Are tests meaningful?
- Are tests checking outcomes rather than implementation details?

---

## Review Findings

Findings should be classified as:

```text
BLOCKING
must be fixed

IMPORTANT
should normally be fixed

SUGGESTION
optional improvement
```

No commit should occur while blocking findings remain.

---

# 9. Security Review

Security review is a separate step from general code review.

Every meaningful change should go through:

```text
CODE REVIEW
↓
SECURITY REVIEW
↓
AUTOMATED SECURITY CHECKS
```

## Security Areas

### Authentication

- Supabase Auth used correctly
- authentication required where expected
- session assumptions safe

### Authorization

- RLS correct
- sensitive operations authorized
- app schema boundaries preserved
- developer DB role properly scoped

### Data Protection

- no unnecessary PII exposure
- sensitive fields not logged
- API responses appropriately limited
- browser data exposure minimized

### Supabase

- no `service_role` in frontend code
- explicit grants
- RLS enabled
- new tables fail closed
- privileged database functions reviewed carefully

### Input / Output

- untrusted input validated
- output rendered safely
- uploads constrained
- no SQL, shell, path or similar injection risk

### Secrets

- no secrets committed
- no secrets logged
- production credentials unavailable locally
- runtime secrets handled safely

### Dependencies

- new dependency actually necessary
- package actively maintained
- existing approved library cannot already solve the problem
- no known high-risk dependency added

### Frontend Security

- no unsafe HTML usage without justification
- safe handling of external URLs
- sensitive state not unnecessarily persisted

### Deployment

- container image appropriately configured
- unnecessary network exposure avoided
- unexpected ports avoided
- runtime secrets isolated

---

# 10. Continuous Repository Security

Security can degrade even if application code never changes.

Therefore security review happens at two levels:

```text
CHANGE-LEVEL
every meaningful code change

REPOSITORY-LEVEL
periodically even if no code changes
```

Reasons include:

- new dependency vulnerabilities
- newly discovered attack patterns
- improved agent security capability
- outdated dependencies
- configuration drift
- stale secrets
- better security standards
- previously missed architectural weaknesses

---

# 11. Periodic Repository Audit

Every repository should periodically run an automated audit.

For example:

```text
weekly
↓
scheduled GitHub Action
↓
repository audit
```

The audit asks:

> **Would we still consider this application secure and maintainable if we built it today?**

rather than:

> Did the last change introduce a problem?

## Periodic Security Review

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

## Periodic Engineering Review

Also identify:

- excessive complexity
- duplicated logic
- obsolete workarounds
- unnecessary dependencies
- outdated architecture
- missing important tests
- violations of current `AGENTS.md`

However, functioning code should not be rewritten simply because the latest agent could produce different code.

Fix automatically when there is a meaningful:

```text
security issue
correctness issue
material maintainability issue
```

Avoid churn for purely stylistic improvements.

---

# 12. Dependency Maintenance

Dependencies should be continuously monitored.

The platform should identify:

- known vulnerabilities
- unsupported packages
- abandoned dependencies
- significantly outdated packages
- duplicate functionality
- dependencies that can now be removed

Meaningful upgrades should follow:

```text
identify update
↓
review breaking changes
↓
update
↓
run quality gate
↓
run security review
↓
commit if safe
```

Dependency updates should not be merged blindly.

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

Expected user experience:

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

Every pushed commit runs an independent deterministic CI gate.

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
build
↓
Playwright
↓
container build
↓
push immutable image to GHCR
```

Agent review and CI serve different roles:

```text
Agent review
= contextual reasoning

CI
= deterministic verification
```

Neither replaces the other.

---

# 15. Production Deployment

The user says:

```text
deploy production
```

The agent:

1. determines current repository
2. determines intended Git SHA
3. verifies CI passed
4. triggers deployment workflow
5. follows deployment status
6. reports success/failure

Flow:

```text
User
 ↓
Agent Skill
 ↓
GitHub Workflow
 ↓
Deployment Runner
 ↓
Kamal
 ↓
Application Runtime
```

Production never automatically follows `main`.

---

# 16. GitHub as Platform Control Plane

GitHub provides:

```text
source
CI
deployment workflows
environment secrets
organization secrets
GHCR
deployment history
scheduled repository audits
```

This removes the need for separate systems for:

- application secret storage
- container registry
- deployment metadata

---

# 17. Container Registry

All images are stored in **GitHub Container Registry (GHCR)**.

Example:

```text
ghcr.io/company/damaged-stock:8a921cf
```

Images should be:

- immutable
- identified by Git SHA
- built once
- tested before deployment
- promoted without rebuilding

---

# 18. Secrets

There is no separate platform secret-management abstraction.

## Shared Values

GitHub organization secrets may contain values common to many applications, such as:

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

No repository variables are required for the standard application.

Secrets flow:

```text
GitHub production environment
↓
deployment workflow
↓
Kamal
↓
application container
```

Secrets are:

- never committed
- never printed back after storage
- not stored on the user's workstation

---

# 19. Cloudflare

Cloudflare is the standard edge layer across all infrastructure providers.

It provides:

- DNS
- CDN
- TLS
- edge protection

Wildcard DNS should eliminate per-app DNS work.

Example:

```text
*.apps.company.com
```

Repository:

```text
damaged-stock
```

automatically maps to:

```text
damaged-stock.apps.company.com
```

---

# 20. Runtime Infrastructure

The runtime layer is cloud-agnostic.

Possible infrastructure providers include:

```text
Azure
AWS
GCP
Hetzner
bare metal
other Docker-capable infrastructure
```

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

Individual apps run as Docker containers:

```text
app-host-01
├── damaged-stock
├── returns
├── inventory
└── purchasing
```

The application platform environment is the infrastructure workload.

Individual small applications are not.

Additional pools may later isolate:

```text
internal apps
public apps
sensitive apps
high-resource apps
```

---

# 21. Kamal

Kamal is the standard deployment mechanism.

Kamal runs on the deployment runner.

```text
GitHub workflow
↓
deployment runner
↓
generate temporary Kamal configuration
↓
load GitHub secrets
↓
kamal deploy
↓
Docker hosts
```

Application repositories do not contain normal Kamal configuration.

The runner derives:

- application identity
- GHCR image
- hostname
- environment
- target runtime
- secrets
- health endpoint

from platform conventions.

---

# 22. Supabase Architecture

A Supabase project represents an **environment/trust boundary**, not an application.

Example:

```text
Production Supabase
│
├── shared Auth
├── platform/shared schemas
├── damaged_stock
├── returns
├── inventory
└── purchasing
```

All applications in the environment share the same Auth user population.

A user registers once and can access multiple apps according to authorization.

---

# 23. Developer Access vs Application User Access

These are independent security models.

## Developer / Agent Access

Each application gets its own Postgres login role.

Example:

```text
damaged_stock_dev
↓
damaged_stock schema only
```

The role may create and modify objects inside that schema, but cannot access other application schemas.

Coding agents should not receive:

```text
postgres
project-owner credentials
service_role
```

---

## Application User Access

Users authenticate through Supabase Auth.

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

Example:

```text
Alice
├── returns       editor
├── inventory     viewer
└── damaged-stock none
```

---

# 24. Database Security Defaults

Supabase configuration:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New database objects should fail closed.

Agents must explicitly configure:

- grants
- RLS
- app access

SQL migrations are the source of truth.

There is no ORM.

---

# 25. Standard Technology Stack

## Runtime and Package Management

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

- server state lives in TanStack Query
- no normal data fetching through `useEffect`
- mutations properly update/invalidate queries

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

# 26. Code Quality Tooling

Formatting:

```text
oxfmt
```

Linting:

```text
oxlint
```

Quality rules should include:

- React
- React Compiler
- accessibility
- TypeScript correctness
- type-aware checks
- floating promises

Canonical quality gate:

```text
oxfmt --check .
oxlint --type-aware .
bun run typecheck
bun test
bun run build
```

Critical workflows also run Playwright.

---

# 27. Testing

## Unit Tests

Use Bun test for:

- business logic
- validation
- utility functions
- important state transitions

Do not optimize for arbitrary coverage percentages.

## Database Tests

Test:

- migrations
- RLS
- grants
- permissions
- constraints
- schema assumptions

## End-to-End Tests

Use Playwright for important user flows.

Typical examples:

```text
login
open app
create record
edit record
save
reload
permissions
```

Because mandatory human review is minimized, UI and integration testing are particularly important.

---

# 28. Mobile-First Requirement

Every application must work on:

- mobile
- tablet
- desktop

This is an acceptance criterion.

Requirements include:

- no horizontal page overflow
- mobile-friendly forms
- usable navigation
- viewport-safe dialogs
- appropriate touch targets
- primary actions remain accessible
- tables have a usable mobile representation

Playwright should cover representative mobile and desktop viewports.

---

# 29. Scaffold, AGENTS.md and Skills

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
```

Approved dependencies are already installed.

---

## AGENTS.md

Defines how software should be written.

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
code review required
security review required
```

---

## Skills

Skills define how the platform is operated.

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

The `commit` skill orchestrates:

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

The `repository-audit` skill supports periodic scheduled review.

---

# 30. Future Staging

Staging is intentionally deferred from V1.

A future release can transparently introduce:

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

Staging becomes an invisible safety gate.

Staging should use production-like but anonymized/sanitized data.

---

# 31. Overall Architecture

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
                immutable GHCR image
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


Periodic scheduled path:

GitHub Repository
      ↓
Repository Audit
      ↓
dependency / security / architecture review
      ↓
fix or surface meaningful findings
```

---

# 32. V1 Definition

A new app should require:

```text
1. Create repo from scaffold
2. Create Supabase schema and schema-scoped developer role
3. Add production secrets
4. Grant repository access
```

A user's machine requires:

```text
Codex or Claude Code
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

After setup, the normal workflow is:

```text
start app

build feature

commit code
  → tests
  → code review
  → security review
  → push

deploy production
```

There should be no normal application-specific:

- infrastructure registration
- cloud-console work
- DNS setup
- Kamal setup
- container registry setup
- deployment-state configuration

---

# Guiding Principles

> **The repository is the application. Everything else should be derived automatically wherever possible.**

> **Working code is necessary but insufficient: production software must also be understandable, maintainable and secure.**

> **Agents should apply SOLID and clean-code principles pragmatically, without creating abstractions for hypothetical future needs.**

> **Every meaningful change receives an agent code review and security review before commit.**

> **Security is continuous: repositories are periodically reassessed even when their code has not changed.**

> **Agent reasoning and deterministic tooling complement each other; neither replaces the other.**

> **Standardize the platform, conventions and agent behavior — not every application's implementation.**

> **GitHub, Cloudflare, Supabase and Kamal are standardized; the underlying compute infrastructure remains interchangeable.**
