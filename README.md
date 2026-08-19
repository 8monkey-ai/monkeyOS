# monkeyOS

## Overall Approach & Architecture — Canonical V1

## 1. Objective

**monkeyOS** is a self-service application platform that can be installed into any GitHub organization.

It enables business users and developers to build, test, review, secure and deploy production-ready applications with minimal infrastructure knowledge.

The intended experience is:

```text
start app
↓
build feature
↓
commit code
↓
deploy production
```

A coding agent is expected to be the primary development interface, but monkeyOS is deliberately **independent of any specific developer-side agent harness**.

Users should not normally need to understand or operate:

- GitHub Actions internals
- Kamal
- Docker hosts
- Cloudflare
- Supabase administration
- container registries
- cloud networking
- production infrastructure credentials

The standardized platform layer is:

```text
GitHub     → source, CI/CD, configuration, secrets, GHCR
Cloudflare → DNS, TLS, CDN, load balancing
Supabase   → Postgres + Auth
Kamal      → deployment
Pi         → AI execution inside GitHub Actions
```

The underlying compute remains interchangeable:

```text
Azure
AWS
GCP
Hetzner
bare metal
other Docker-capable Linux infrastructure
```

---

# 2. Three-Layer Architecture

monkeyOS consists of three distinct layers.

## Layer 1 — monkeyOS Distribution

The portable upstream platform:

```text
monkeyOS
├── organization installation tooling
├── application scaffold
├── reusable workflows
├── shared skills
├── bootstrap logic
└── documentation
```

The generic distribution contains no organization-specific assumptions such as:

- GitHub organization name
- application domain
- Supabase project identifier
- cloud provider
- runtime hostnames
- credentials

Its job is to define the platform conventions and provide the assets required to install monkeyOS into an organization.

## Layer 2 — Organization Installation

monkeyOS is installed once into a GitHub organization.

The installation creates a central platform repository, for example:

```text
<organization>/monkeyos-platform
```

This repository owns the organization's canonical:

```text
reusable GitHub workflows
shared skills
bootstrap / provisioning tooling
deployment implementation
Pi configuration
platform documentation
```

The organization installation also establishes the shared infrastructure and GitHub configuration:

```text
GitHub organization variables
GitHub organization secrets
GitHub rulesets
Supabase environment
Cloudflare wildcard domain
Cloudflare load balancer
runtime pool
production deployment credentials
GHCR permissions
```

Organization-specific configuration lives here, not in the generic application scaffold.

## Layer 3 — Application Repository

An application repository contains almost exclusively application-specific concerns.

For example:

```text
finance/
├── src/
├── supabase/
├── tests/
├── AGENTS.md
├── package.json
├── bun.lock
├── Dockerfile
│
├── .monkeyos/
│   └── skills/
│
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy.yml
        └── audit.yml
```

The `.github/workflows` files should be tiny managed callers into the organization's `monkeyos-platform` repository.

The `.monkeyos/skills` directory contains synchronized copies of centrally managed skills.

The guiding rule is:

> **Application repositories contain application-specific decisions; platform behavior is inherited from the organization installation wherever technically possible.**

---

# 3. The Repository Is the Application

Repository identity is the primary application identifier.

For example:

```text
<organization>/finance
```

automatically derives:

```text
application        finance
database schema    finance
developer role     finance_dev
runtime role       finance_runtime
container image    ghcr.io/<organization>/finance:<sha>
production URL     finance.<apps-domain>
```

There is no separate application registry.

There is no custom deployment-state database.

A normal application requires no per-app:

- infrastructure registration
- server assignment
- DNS configuration
- container registry configuration
- Kamal configuration
- cloud provisioning
- central infrastructure-repository modification

Everything possible is derived from repository identity and organization-level conventions.

---

# 4. Repository Name Determines Database Identity

There should be no placeholder schema requiring manual renaming.

The repository name is deterministically converted into a valid PostgreSQL identifier.

For example:

```text
finance             → finance
hr                  → hr
ops                 → ops
finance-reporting   → finance_reporting
hr-onboarding       → hr_onboarding
ops-planning        → ops_planning
```

The same normalization implementation must be used by:

```text
local development
production provisioning
database roles
migration tooling
deployment tooling
```

Invalid or colliding names should fail provisioning explicitly.

The principle is:

> **Repository identity determines database identity.**

---

# 5. Convention Over Configuration

A standard application should require almost no platform configuration inside its repository.

The platform derives:

```text
repository
    ↓
application identity
    ↓
database schema
    ↓
container identity
    ↓
production hostname
    ↓
runtime deployment
```

Application repositories should not contain things such as:

```text
runtime host lists
cloud resource IDs
Cloudflare configuration
Kamal host configuration
production SSH configuration
platform credentials
```

Those belong to the organization installation.

---

# 6. `main` Is Source, Not Production

```text
main
= latest accepted source

production
= explicitly promoted immutable artifact
```

Pushing to `main` never automatically deploys.

Business users may commit directly to `main`.

Developers may use branches when useful, but branches are a collaboration mechanism rather than a platform deployment requirement.

Production requires an explicit operation:

```text
deploy production
```

---

# 7. Roles and Trust Boundary

## Application Owner

Normally receives GitHub:

```text
Write or Maintain
```

rather than Admin.

The Application Owner controls:

```text
application code
tests
SQL migrations
dependencies
Dockerfile
application behavior
```

They can:

```text
commit to main
trigger deployment of their own application
use permitted application-level platform capabilities
```

## Platform Admin

The Platform Admin controls:

```text
organization installation
central reusable workflows
central skills
GitHub rulesets
production environments
organization variables and secrets
deployment credentials
runtime infrastructure
Cloudflare
shared Supabase configuration
```

The trust boundary is:

> **Application Owners control what their application does. Platform Admins control where and how it runs.**

---

# 8. Developer-Side Harness Independence

monkeyOS does not depend on a particular coding-agent product.

Conceptually:

```text
compatible coding-agent harness
          ↓
      AGENTS.md
          +
 synchronized monkeyOS skills
          ↓
Git / gh / Bun / Supabase CLI
```

Skills and repository instructions should therefore describe desired behavior rather than harness-specific commands.

For example:

> Perform an independent review of the change. Prefer a fresh reviewer context where the current harness supports it.

rather than prescribing a particular product-specific sub-agent mechanism.

The principle is:

> **monkeyOS standardizes engineering behavior and platform interfaces, not the user's choice of coding-agent harness.**

---

# 9. Centralized GitHub Workflows

As much workflow logic as possible should live in:

```text
<organization>/monkeyos-platform
```

Application repositories contain only thin callers.

For example:

```yaml
jobs:
  ci:
    uses: <organization>/monkeyos-platform/.github/workflows/ci.yml@v1
```

The same pattern applies to:

```text
CI
deployment
repository audits
AI-powered workflow operations
```

Conceptually:

```text
Application Repo
    │
    ├── tiny CI caller ─────────────┐
    ├── tiny deploy caller ─────────┤
    └── tiny audit caller ──────────┤
                                    ▼
                         monkeyos-platform
                           master workflows
```

This means a platform change such as:

```text
new security scanner
tool version upgrade
new CI check
Kamal improvement
deployment hardening
audit improvement
Pi update
```

can normally be made once and automatically apply across application repositories.

---

# 10. Workflow Compatibility Channels

Application repositories should consume central workflows through a protected compatibility branch such as:

```text
@v1
```

The model is:

```text
v1
→ backwards-compatible improvements
→ automatically inherited

v2
→ breaking platform contract
→ deliberate application migration
```

So:

```text
central workflow fix
        ↓
update v1
        ↓
all apps receive the fix
on their next workflow run
```

Third-party Actions used internally by monkeyOS workflows should still be pinned appropriately where supply-chain security requires it.

The `v1` branch is platform infrastructure and should be strongly protected.

---

# 11. AI Execution Inside GitHub Actions

Developer-side coding agents remain harness-independent.

AI execution **inside GitHub Actions** is standardized.

> **Any AI-powered GitHub Actions workflow uses Pi.**

Examples include:

```text
repository audit
AI security review
AI architecture review
future automated maintenance operations
```

The application repository does not install or select its own CI-side AI harness.

Instead:

```text
Application Repo
      ↓
managed workflow caller
      ↓
monkeyos-platform
      ↓
Pi
      ↓
monkeyOS skill
      ↓
AI task
```

Pi's version, configuration and model access are controlled centrally.

Application repositories should not introduce alternative AI harnesses in GitHub Actions.

---

# 12. Centrally Managed Skills

Canonical platform skills live in:

```text
<organization>/monkeyos-platform/skills/
```

Initial skills include:

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

Application repositories synchronize them locally into:

```text
.monkeyos/skills/
```

Conceptually:

```text
monkeyos-platform/skills
          ↓
       synchronize
          ↓
 application/.monkeyos/skills
          ↓
 compatible coding harness
```

Skills are plain platform instructions rather than a proprietary registry or service.

Improving:

```text
security-review
```

or:

```text
database-migration
```

centrally therefore makes the new behavior available across applications.

The synchronized copies should be clearly marked as monkeyOS-managed files.

---

# 13. `AGENTS.md` Is Repository-Focused

`AGENTS.md` should answer only:

> **How should an agent modify this repository?**

It should contain application-relevant engineering rules.

## Stack

```text
Bun only
strict TypeScript

React 19
React Compiler
React Router
Vite

Tailwind
Base UI
shadcn

React Hook Form
Zod

TanStack Query
TanStack Table

Supabase
supabase-js
SQL migrations

oxfmt
oxlint

Bun test
Playwright
```

## Engineering

```text
SOLID and clean, but simple
strong typing
clear responsibility boundaries
avoid speculative abstraction
mobile friendly
accessible
test meaningful behavior
```

## State management

```text
server state        → TanStack Query
local UI state      → React
shared client state → Zustand only when justified
shareable state     → URL
```

## Data

```text
Own locally.
Discover globally.
Share explicitly.
```

## Application security

```text
validate untrusted input
do not expose secrets
no service_role in browser code
minimize PII
safe handling of HTML / URLs / uploads
RLS and grants required
```

And one platform-specific repository rule:

> **Files marked as monkeyOS-managed must not be modified as application code.**

`AGENTS.md` should **not** contain operational platform details such as:

```text
Kamal runner architecture
production SSH behavior
Cloudflare maintenance procedures
runtime topology internals
central deployment implementation
```

Those belong in central monkeyOS documentation and skills.

---

# 14. Simplified Application Onboarding

The application README assumes the GitHub organization has already been configured for monkeyOS.

For the normal developer:

```text
1. Clone repository
2. Authenticate GitHub if needed
3. Ask the coding agent to "start app"
```

For example:

```text
gh auth login
```

is a one-time prerequisite if GitHub CLI authentication is not already configured.

## Production provisioning

If the repository has not yet been provisioned for production, the developer should need only one request:

> **Provision this repository as a monkeyOS application.**

The standard bootstrap process derives:

```text
repository
    ↓
application name
    ↓
database schema
    ↓
developer role
    ↓
runtime role
    ↓
production environment
    ↓
standard platform controls
```

The user should not have to individually request:

```text
schema naming
Cloudflare setup
runtime hosts
deployment SSH
GitHub workflows
GHCR
audit configuration
Supabase project configuration
```

These are standard consequences of monkeyOS installation and application provisioning.

Normal Platform Admin involvement after provisioning should be limited to genuine exceptions such as:

- new production secrets
- explicit cross-domain data contracts
- unusual infrastructure requirements

---

# 15. Local Development

Required locally:

```text
compatible coding-agent harness
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

Typical container runtimes include:

```text
OrbStack
Docker Desktop
Docker Engine
```

Not required locally:

```text
Kamal
cloud provider CLI
production SSH keys
production database credentials
Cloudflare CLI
GitHub runner
GHCR credentials
```

Applications develop against a local Supabase stack:

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

Local database and Auth state are disposable and reproducible.

Production is not the normal local development database.

---

# 16. Self-Service `start`

The user says:

```text
start app
```

The `start` skill performs approximately:

```text
check development tools
↓
synchronize monkeyOS skills
↓
bun install
↓
verify container runtime
↓
start local Supabase
↓
apply migrations
↓
seed database
↓
generate database types
↓
start application
↓
report local URL
```

`check environment` verifies at least:

```text
✓ Git
✓ GitHub authentication
✓ Bun
✓ container runtime
✓ Supabase CLI
✓ repository access
✓ monkeyOS skill synchronization
```

---

# 17. Standard Application Stack

## Runtime and package manager

```text
Bun only
```

Use:

```text
bun install
bun run
bun test
bunx
```

Do not use npm, pnpm, yarn or npx in the standard application workflow.

## Language

```text
TypeScript strict
```

Recommended strictness includes appropriate compiler options such as unchecked-index and exact-optional-property protections.

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

There is no central monkeyOS application-component library.

## Forms

```text
React Hook Form
Zod
```

## State

```text
server / remote state       TanStack Query
component-local UI state    React
shared client-only state    Zustand, narrowly
bookmarkable state          URL / React Router
```

Do not duplicate server data into Zustand.

Do not use `useEffect` as the normal server-data fetching mechanism.

## Business UI

```text
TanStack Table
Recharts v3
```

## Database

```text
Supabase Postgres
supabase-js
SQL migrations
No ORM
```

## Quality tooling

```text
oxfmt
oxlint
Bun test
Playwright
```

---

# 18. Engineering Philosophy

> **SOLID and clean, but simple.**

Agents should produce code that is:

- readable
- strongly typed
- cohesive
- testable
- appropriately abstracted
- easy to modify

Avoid under-engineering such as:

```text
giant components
duplicated business logic
untyped data
hidden side effects
business logic embedded directly in UI
ad-hoc state management
```

Avoid over-engineering such as:

```text
unnecessary interfaces
factories without real need
generic internal frameworks
premature extensibility
deep abstraction hierarchies
excessive indirection
```

Introduce abstractions when they provide concrete benefits such as:

- meaningful business semantics
- actual reuse
- easier testing
- isolation of an external dependency
- material simplification
- realistic alternate implementations

---

# 19. Data Architecture & Governance

The governing model is deliberately concise:

> **Own locally. Discover globally. Share explicitly.**

## Own locally

Each application owns its Supabase schema and its application-specific data.

For example:

```text
Production Supabase
├── auth
├── platform
├── finance
├── hr
├── ops
├── procurement
└── reporting
```

App-specific workflow data can be created freely inside the application's schema.

## Discover globally

Development roles can inspect structural metadata across application schemas:

```text
tables
views
columns
types
foreign-key relationships
useful comments
```

but cannot access their row data simply because the metadata is visible.

For example:

```text
finance_dev

finance.*      → metadata + data
hr.*           → metadata only
ops.*          → metadata only
procurement.*  → metadata only
```

Metadata is obtained directly from PostgreSQL through a constrained platform-owned interface.

There is no manually maintained data catalog.

Before introducing a meaningful business entity, the `database-migration` skill checks whether an existing source of truth already exists.

## Share explicitly

If another application already owns the required information, use that source rather than creating another copy.

Cross-domain reads use narrow contracts such as:

```text
views
database functions / RPC
APIs
```

Cross-domain writes require an explicit operation controlled by the owning domain rather than broad direct write privileges.

And:

> **Use the simplest relational model that preserves business meaning and integrity.**

The migration process also checks:

```text
RLS
grants
PII
constraints
schema complexity
duplicate business entities
```

---

# 20. Supabase Architecture

A Supabase project represents an **environment/trust boundary**, not an individual app.

All applications in the production environment may therefore share Supabase Auth.

```text
User
 ↓
Supabase Auth
 ↓
JWT
 ↓
app-specific RLS
 ↓
authorized application data
```

Authentication is shared.

Authorization remains application-specific.

## Developer Role

Derived automatically from repository identity.

Example:

```text
finance_dev
```

Receives:

```text
appropriate own-schema development access
global structural metadata discovery
explicitly approved cross-domain contracts
```

It never receives broad credentials such as:

```text
postgres
project owner
service_role
```

## Runtime Role

Example:

```text
finance_runtime
```

Receives only:

```text
required own-schema access
explicitly required cross-domain runtime contracts
no DDL
no global metadata discovery
```

## Database Security Defaults

The platform should use a fail-closed posture.

For example:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New objects require explicit:

```text
grants
RLS
authorization
cross-domain access
```

SQL migrations are canonical.

---

# 21. Development Review Loop

Every meaningful application change follows:

```text
understand requirement
↓
implement
↓
test
↓
code review
↓
fix blocking findings
↓
security review
↓
fix blocking findings
↓
quality gate
↓
commit
```

Where supported, reviews should preferably be independent of the implementation reasoning context.

Findings are classified:

```text
BLOCKING
IMPORTANT
SUGGESTION
```

No commit should happen while blocking findings remain.

---

# 22. Code Review

Code review checks:

```text
correctness
edge cases
async/error handling
validation
architecture
responsibility boundaries
abstraction quality
simplicity
duplication
React patterns
state management
database design
data ownership
mobile behavior
accessibility
testing
```

The goal is not stylistic perfection.

The goal is software that is straightforward to understand, modify and operate.

---

# 23. Security Review

Security review is separate from general code review.

It covers:

```text
authentication
authorization
RLS
schema boundaries
cross-domain access
PII
logging
input validation
injection
secret handling
dependency risk
browser security
uploads
container security
```

Application security should fail closed rather than rely on developer intent.

---

# 24. `commit` Skill

The centrally managed `commit` skill orchestrates:

```text
1. inspect working tree
2. format
3. lint
4. typecheck
5. unit/database tests
6. build
7. code review
8. fix blocking findings
9. security review
10. fix blocking findings
11. rerun affected checks
12. commit
13. push
```

A typical result should be concise:

```text
✓ Formatted
✓ Linted
✓ Types valid
✓ Tests passed
✓ Build passed
✓ Code review passed
✓ Security review passed

Committed and pushed <sha>.
```

Because the skill is centrally synchronized, review behavior can improve without changing every application repository.

---

# 25. Continuous Integration

Application CI should be a thin caller into the central monkeyOS CI workflow.

The central CI performs deterministic checks:

```text
format
↓
lint
↓
typecheck
↓
unit tests
↓
migration tests
↓
RLS tests
↓
dependency/security checks
↓
secret scanning
↓
production build
↓
Playwright
↓
Docker build
↓
GHCR publish
```

Agent review and CI have distinct purposes:

> **Agent reasoning provides contextual review. CI provides deterministic verification.**

Neither replaces the other.

---

# 26. Immutable Artifact Model

Successful CI creates one immutable application image:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

The image is:

```text
built once
tested once
security checked
deployed unchanged
```

Production deployment never rebuilds source.

The releasable unit is the immutable GHCR image identified by Git SHA.

---

# 27. GitHub as Platform Control Plane

GitHub provides:

```text
source control
CI
deployment workflows
organization variables
organization secrets
production environment secrets
GHCR
deployment history
scheduled audits
```

There is no separate:

```text
application registry
deployment-state database
container registry
application secret-management layer
```

for standard applications.

---

# 28. Runtime Architecture

A runtime pool is a **small HA cell**, not a general-purpose application scheduler.

For V1, the standard production pool is deliberately small:

```text
production/default

├── app-prod-01
└── app-prod-02
```

Every standard application assigned to the pool runs on both hosts.

For example:

```text
app-prod-01
├── finance
├── hr
├── ops
└── reporting

app-prod-02
├── finance
├── hr
├── ops
└── reporting
```

This is intentional.

There is no:

```text
app → server mapping
placement algorithm
scheduler
routing registry
application-aware routing service
```

The key property is:

> **Any healthy runtime host can serve any standard application in its pool.**

---

# 29. Runtime Pool Configuration

The organization installation centrally defines:

```text
PROD_DEFAULT_HOSTS
```

as a GitHub organization variable.

For example:

```text
app-prod-01.example.com,app-prod-02.example.com
```

Application repositories contain no server configuration.

The central deployment workflow resolves:

```text
application repository
        ↓
production/default
        ↓
PROD_DEFAULT_HOSTS
        ↓
concrete Kamal hosts
```

Kamal itself receives only concrete hosts.

---

# 30. Cloudflare Front Door

A single wildcard Cloudflare Load Balancer fronts the standard runtime pool.

```text
*.apps.company.com
        │
        ▼
   Cloudflare LB
      /      \
     ▼        ▼
 prod-01    prod-02
     │        │
kamal-proxy kamal-proxy
```

Because every standard application runs on every host, Cloudflare requires no application-specific routing knowledge.

Each host's `kamal-proxy` routes the original hostname to the correct application container.

Therefore there is no normal per-app:

```text
DNS record
Cloudflare load balancer
routing entry
front-door configuration
```

---

# 31. Production Deployment

The application repository contains only a tiny protected deployment workflow caller.

The actual deployment implementation lives centrally:

```text
Application Repo
      ↓
managed deploy caller
      ↓
monkeyos-platform
      ↓
GitHub-hosted runner
      ↓
Kamal
      ↓
runtime pool
```

The application cannot choose:

```text
target repository
runtime host
runtime pool
production domain
SSH target
Docker privileges
host mounts
```

The effective deployment operation is:

```text
deploy_this_repository()
```

---

# 32. Protected Deployment Boundary

Application Owners must not be able to modify production deployment behavior.

At minimum, monkeyOS-managed workflow paths should be protected through organization/repository rulesets.

For example:

```text
.github/workflows/**
```

Application Owners can continue modifying normal application source directly.

Only Platform Admins or trusted platform automation can alter:

```text
deployment callers
workflow contract
production environment controls
runtime host configuration
deployment credentials
```

---

# 33. Deployment Credential Isolation

The production SSH credential becomes available only within the trusted central deployment workflow.

Safe sequence:

```text
verify CI succeeded
↓
verify immutable GHCR artifact
↓
load production deployment credential
↓
generate temporary trusted Kamal config
↓
kamal deploy
```

After production deployment credentials are loaded, the workflow must not execute arbitrary application-controlled scripts.

The credential never belongs in:

```text
local development
ordinary application CI
application runtime
application source
business-user environment
```

---

# 34. Container Privilege Boundary

Application Owners control their application's code and image.

They do not control host-level Docker capabilities.

Applications cannot request:

```text
privileged mode
Docker socket mounts
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker flags
```

Those remain centrally controlled by monkeyOS deployment logic.

---

# 35. GitHub-Hosted Kamal Runner

V1 runs Kamal inside a GitHub-hosted Actions runner.

```text
GitHub
   ↓
GitHub-hosted runner
   ↓
Kamal
   ↓
SSH
   ↓
production hosts
```

There is no dedicated Kamal server.

Kamal is a CLI used during deployment, not a persistent service.

---

# 36. Availability and Maintenance

The two-host runtime pool provides application-level redundancy.

Maintenance occurs one host at a time.

```text
1. drain prod-01
2. perform maintenance
3. verify prod-01
4. return prod-01 to traffic

5. drain prod-02
6. perform maintenance
7. verify prod-02
8. return prod-02 to traffic
```

During maintenance of one host, the other continues serving every standard application.

The same approach applies to:

```text
OS maintenance
Docker maintenance
host replacement
VM resize
appropriate network changes
```

---

# 37. Scaling Strategy

Vertical scaling is the default V1 infrastructure-scaling strategy.

For example:

```text
2 × smaller VM
```

becomes:

```text
2 × larger VM
```

through rolling drain and resize/replacement.

Zero application downtime comes from redundancy:

```text
drain host 1
↓
resize/restart
↓
verify
↓
restore

drain host 2
↓
resize/restart
↓
verify
↓
restore
```

Do not pre-build:

```text
large clusters
application scheduling
sparse placement
routing databases
complex orchestration
```

before there is a real need.

The principle is:

> **Scale the small HA cell vertically before adding scheduling complexity.**

---

# 38. Secrets and Configuration

## Organization Variables

Non-sensitive platform-wide configuration:

```text
PROD_DEFAULT_HOSTS
PROD_SSH_USER
APPS_BASE_DOMAIN
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

where appropriate.

## Organization Secrets

Shared sensitive values owned by the platform.

## Production Environment Secrets

Application-specific production secrets live in that repository's GitHub `production` environment.

Examples:

```text
DATABASE_URL
third-party API credentials
application-specific secrets
```

Production secrets should not be required locally and must never be printed back by tools or coding agents.

Normal application repositories should not need their own platform configuration variables.

---

# 39. Mobile and UX Requirements

Applications must work across:

```text
mobile
tablet
desktop
```

Requirements include:

- no horizontal page overflow
- usable navigation
- mobile-friendly forms
- viewport-safe dialogs
- appropriate touch targets
- accessible primary actions
- sensible mobile representation of data-heavy tables
- clear loading, empty and error states

Playwright should exercise representative mobile, tablet and desktop sizes.

---

# 40. Testing

## Unit

Use Bun test for:

```text
business logic
validation
utilities
important state transitions
```

## Database

Test:

```text
migrations
RLS
grants
permissions
constraints
cross-domain contracts
schema assumptions
```

## End-to-End

Playwright should cover important user flows such as:

```text
authentication
navigation
create
edit
save
reload
permissions
error behavior
```

---

# 41. Continuous Repository Security

Security does not stop when a change is committed.

It operates at two levels:

```text
CHANGE LEVEL
every meaningful change

REPOSITORY LEVEL
scheduled reassessment
```

Security can degrade without source-code changes due to:

- new vulnerabilities
- stale dependencies
- changed attack techniques
- improved review capabilities
- obsolete patterns
- configuration drift

---

# 42. Scheduled Repository Audit

Repositories run a central scheduled audit workflow.

Where the audit uses AI:

```text
GitHub Actions
      ↓
central monkeyOS workflow
      ↓
Pi
      ↓
central review/security skills
```

The audit asks:

> **Would we still consider this application secure and maintainable if we built it today?**

It checks areas such as:

```text
dependencies
authentication
authorization
RLS / grants
data architecture
PII
secret handling
frontend security
API boundaries
Docker
GitHub Actions
deployment configuration
logging
complexity
duplication
obsolete workarounds
missing important tests
```

The purpose is to find material problems, not generate stylistic churn.

---

# 43. Organization Installation

Installing monkeyOS into an organization is the one-time platform setup.

It establishes approximately:

```text
<org>/monkeyos-platform
↓
central reusable workflows
central skills
Pi setup
bootstrap/provisioning tooling
↓
GitHub organization variables/secrets
↓
GitHub rulesets
↓
Supabase
↓
Cloudflare
↓
runtime pool
↓
deployment credentials
```

Once this is complete, creating an application should be a routine provisioning operation rather than an infrastructure project.

---

# 44. New Application Provisioning

For a normal application:

```text
create repository from scaffold
↓
provision repository as monkeyOS application
```

Provisioning automatically derives and configures:

```text
application name
database schema
developer role
runtime role
production environment
managed workflow callers
skill synchronization
standard security controls
```

Then:

```text
grant Application Owner
Write or Maintain
```

After that, normal development should be self-service.

---

# 45. Normal Developer Lifecycle

The intended experience is:

```text
clone repository
↓
authenticate GitHub
↓
start app
↓
build
↓
commit
↓
central CI
↓
immutable GHCR artifact
↓
deploy production
```

The developer should not routinely need to ask for:

```text
server assignments
DNS records
Cloudflare changes
Kamal configuration
production SSH
schema naming
CI setup
audit setup
GHCR setup
```

Those are platform concerns.

---

# Overall Architecture

```text
                         monkeyOS
                    generic distribution
                           │
                       install once
                           ▼
                GITHUB ORGANIZATION
                           │
              ┌────────────┴────────────┐
              │                         │
       monkeyos-platform          shared platform
              │                  infrastructure
      ┌───────┴───────┐                 │
      │               │          Supabase / Cloudflare
 master workflows   master skills       │
      │               │            runtime pool
      │               │
 reusable calls     synchronization
      │               │
      └───────┬───────┘
              ▼
       APPLICATION REPO
              │
      ┌───────┴────────┐
      │                │
 application code   SQL migrations
      │                │
      └───────┬────────┘
              │
     compatible coding-agent
             harness
              │
          commit / push
              │
              ▼
      central CI workflow
              │
              ▼
       immutable GHCR image
              │
              ▼
     protected deploy caller
              │
              ▼
   central deployment workflow
              │
      GitHub-hosted runner
              │
            Kamal
              │
       ┌──────┴──────┐
       ▼             ▼
    prod-01       prod-02
       │             │
       └──────┬──────┘
              ▼
           Supabase

              ▲
              │
      Cloudflare wildcard LB
```

AI inside GitHub:

```text
Application Repo
      ↓
central reusable workflow
      ↓
Pi
      ↓
central monkeyOS skill
      ↓
review / audit task
```

Data model:

```text
Application's own schema
        ↓
read/write as permitted

Other application schemas
        ↓
metadata discovery only
        ↓
existing source of truth found
        ↓
explicit cross-domain contract
```

---

# Guiding Principles

> **monkeyOS is a portable application platform that can be installed into any GitHub organization.**

> **Organization-specific configuration belongs to the installation, not the generic platform or application scaffold.**

> **Application repositories contain application concerns; platform behavior is inherited centrally wherever possible.**

> **The repository is the application, and repository identity determines database and deployment identity.**

> **Developer-side coding-agent usage is harness-independent. AI execution inside GitHub Actions is standardized on Pi.**

> **Central reusable workflows allow operational, security and tooling improvements to propagate across applications automatically.**

> **Central skills provide a shared and updatable engineering operating model across repositories.**

> **`AGENTS.md` contains only information relevant to safely modifying the application repository.**

> **A normal developer experience should approach clone → authenticate → `start app`.**

> **`main` is source; production is an explicit promotion of an immutable, already-tested artifact.**

> **Working code is insufficient: applications must also remain understandable, maintainable and secure.**

> **SOLID and clean, but simple. Avoid both under-engineering and premature abstraction.**

> **Own locally. Discover globally. Share explicitly.**

> **Data governance is enforced through agent behavior and database permissions rather than a manually maintained catalog or approval bureaucracy.**

> **A runtime pool is a small HA cell of interchangeable hosts, not an application scheduler.**

> **Any healthy runtime host should be capable of serving every standard application in its pool.**

> **Scale the small HA cell vertically before introducing sophisticated application placement or orchestration.**

> **Keep ingress simple: one wildcard Cloudflare load balancer fronts the pool; Kamal Proxy handles application hostname routing on each host.**

> **Every meaningful change receives code review, security review and deterministic verification before becoming deployable.**

> **Security and maintainability are reassessed periodically even when application code has not changed.**

> **Keep monkeyOS deliberately simple until real operational requirements justify additional platform complexity.**
