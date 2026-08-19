# monkeyOS

## Overall Approach & Architecture — Canonical V1

## 1. Objective

**monkeyOS** is a self-service application platform that can be installed into any GitHub organization.

It enables business users and developers to build, test, review, secure, and deploy production-ready internal applications with minimal infrastructure knowledge.

The intended experience is:

```text
start app
↓
build feature
↓
commit
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

The underlying compute remains interchangeable: Azure, AWS, GCP, Hetzner, bare metal, or other Docker-capable Linux infrastructure.

---

# 2. Three-Layer Architecture

monkeyOS has three distinct layers.

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

It contains no organization-specific assumptions such as:

- GitHub organization name
- application domain
- Supabase project identifier
- cloud provider
- runtime hostnames
- credentials

## Layer 2 — Organization Installation

monkeyOS is installed once into a GitHub organization.

The installation creates a central repository:

```text
<organization>/monkeyos-platform
```

It owns the organization's canonical:

```text
reusable GitHub workflows
shared skills
bootstrap / provisioning tooling
deployment implementation
Pi configuration
platform documentation
```

Organization-wide infrastructure and configuration also live at this layer:

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

## Layer 3 — Application Repository

An application repository contains primarily application-specific concerns:

```text
finance/
├── README.md
├── CHANGELOG.md
├── AGENTS.md
├── package.json
├── bun.lock
├── Dockerfile
│
├── src/
├── supabase/
├── tests/
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

The GitHub workflows are thin managed callers into `monkeyos-platform`.

The local monkeyOS skills are synchronized copies of centrally managed skills.

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
container image    ghcr.io/<organization>/finance:<git-sha>
production URL     finance.<apps-domain>
```

A multi-word repository is normalized predictably:

```text
finance-reporting → finance_reporting
hr-onboarding     → hr_onboarding
ops-planning      → ops_planning
```

The same normalization implementation must be used by local setup, production provisioning, database roles, migrations, and deployment.

Invalid or colliding names fail explicitly.

There is no separate application registry or deployment-state database.

---

# 4. Convention Over Configuration

A standard application should require almost no platform configuration inside its repository.

The platform derives:

```text
repository
↓
application identity
↓
database schema
↓
database roles
↓
container identity
↓
production hostname
↓
runtime deployment
```

Normal application repositories do not contain:

- runtime host lists
- cloud resource IDs
- Cloudflare configuration
- Kamal host configuration
- production SSH configuration
- platform credentials

Those belong to the organization installation.

---

# 5. `main` Is Source, Not Production

```text
main
= latest accepted source

production
= explicitly promoted immutable artifact
```

Pushing to `main` never automatically deploys.

Business users may commit directly to `main`.

Developers may use branches where useful, but branching is a collaboration mechanism rather than a platform requirement.

Production requires an explicit:

```text
deploy production
```

---

# 6. Roles and Trust Boundary

## Application Owner

Normally receives GitHub **Write or Maintain**, not Admin.

Controls:

```text
application code
tests
SQL migrations
dependencies
Dockerfile
application behavior
```

Can commit to `main` and deploy their own application.

## Platform Admin

Controls:

```text
organization installation
central workflows
central skills
GitHub rulesets
production environments
organization variables/secrets
deployment credentials
runtime infrastructure
Cloudflare
shared Supabase configuration
```

The fundamental rule is:

> **Application Owners control what their application does. Platform Admins control where and how it runs.**

---

# 7. Developer-Side Harness Independence

monkeyOS does not depend on one coding-agent product.

Developers may use any compatible harness.

Conceptually:

```text
compatible coding agent
        ↓
AGENTS.md
+
synchronized monkeyOS skills
        ↓
Git / gh / Bun / Supabase CLI
```

Repository instructions and skills describe desired behavior rather than product-specific features.

For example:

> Perform an independent review. Prefer a fresh reviewer context where the current harness supports it.

The principle is:

> **monkeyOS standardizes engineering behavior and platform interfaces, not the developer's choice of coding-agent harness.**

---

# 8. Centralized GitHub Workflows

As much workflow logic as possible lives in:

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
AI-powered GitHub workflows
```

This allows platform changes to happen once and propagate automatically across applications.

Examples include:

- security scanner updates
- tool version upgrades
- CI improvements
- deployment hardening
- Kamal changes
- audit improvements
- Pi updates

---

# 9. Workflow Compatibility Channels

Applications consume central workflows through a protected compatibility channel such as:

```text
@v1
```

The model is:

```text
v1
→ backwards-compatible improvements
→ automatically inherited

v2
→ breaking contract
→ deliberate migration
```

Third-party GitHub Actions used by central workflows should still be pinned appropriately for supply-chain security.

The monkeyOS `v1` branch itself is protected platform infrastructure.

---

# 10. AI Execution Inside GitHub Actions

Developer-side agents remain harness-independent.

Inside GitHub Actions:

> **Any AI-powered workflow uses Pi.**

Examples:

```text
repository audit
AI security review
AI architecture review
automated maintenance
```

The application does not choose the AI harness.

```text
Application repo
      ↓
central reusable workflow
      ↓
Pi
      ↓
central monkeyOS skill
      ↓
AI task
```

Pi's version, configuration, and model access are controlled centrally.

---

# 11. Centrally Managed Skills

Canonical skills live in:

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

Applications synchronize them into:

```text
.monkeyos/skills/
```

The mechanism should remain deliberately simple: plain files synchronized from the organization's central repository.

Synchronized files are monkeyOS-managed and should not be edited as application code.

---

# 12. `AGENTS.md` Is Repository-Focused

`AGENTS.md` answers:

> **How should an agent safely modify this application?**

It should contain only repository-relevant guidance.

## Stack

```text
Bun
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

## State

```text
server state        → TanStack Query
local UI state      → React
shared client state → Zustand only when justified
shareable state     → URL
```

## Data

> **Own locally. Discover globally. Share explicitly.**

## Application security

```text
validate untrusted input
do not expose secrets
no service_role in browser code
minimize PII
safe handling of HTML / URLs / uploads
RLS and grants required
```

It should not contain Kamal internals, SSH architecture, runtime topology, Cloudflare maintenance procedures, or other platform-operation details.

---

# 13. `README.md` Is the Application Front Door

Every application must have a useful top-level:

```text
README.md
```

A normal user or coding agent should not need to find a separate documentation directory before they can understand or work on the application.

The README should contain:

## What the application does

A short business description.

For example:

> Finance Reporting helps the Finance team review, correct, and publish recurring financial reports.

## Getting started

```text
1. Clone the repository
2. Authenticate GitHub if necessary
3. Open it with your preferred coding agent
4. Ask: "start app"
```

## Common actions

```text
start app
check environment
test app
commit
deploy production
rollback production
add secret
```

## Access

A short explanation that users authenticate through shared Supabase Auth and app admins manage membership through the application's **Access** page.

## Data ownership

A concise description of:

- what business data this application owns;
- which other data sources/contracts it consumes.

## Deployment

Keep this at the user level:

> `commit` saves and validates changes.  
> `deploy production` explicitly promotes a tested version to production.

No runtime-infrastructure explanation.

## Current version

For example:

```text
Current version: 1.6.2
```

with a pointer to `CHANGELOG.md`.

---

# 14. CHANGELOG and Application Versioning

Every application includes:

```text
CHANGELOG.md
```

The coding agent maintains it automatically.

It records meaningful user/business changes, not implementation trivia.

Example:

```markdown
# Changelog

## 1.4.0 — 2026-08-19

### Added
- Added approval of monthly Finance reports.
- Added filtering by reporting period.

### Fixed
- Fixed incorrect totals for reversed transactions.
```

Avoid entries such as:

> Refactored query hook.

unless they are operationally meaningful.

The changelog answers:

> **What changed in this application?**

---

## Semantic versioning

Applications use:

```text
MAJOR.MINOR.PATCH
```

with a pragmatic convention:

```text
new feature / capability → MINOR
bug fix                  → PATCH
breaking application change → MAJOR
```

Tests, documentation, formatting, or internal refactoring do not normally bump the version unless they materially change application behavior.

The canonical application version lives in:

```text
package.json
```

CI verifies that the latest changelog version and application version are consistent.

---

# 15. Versioning Is Part of the Commit Skill

The central `commit` skill first evaluates the change.

```text
inspect change
↓
classify change
↓
if application behavior changed:
    update CHANGELOG.md
    determine version bump
    update package.json
↓
format
↓
lint
↓
typecheck
↓
tests
↓
build
↓
code review
↓
fix blocking findings
↓
security review
↓
fix blocking findings
↓
rerun checks
↓
commit
↓
push
```

The distinction is:

> **The agent determines what changed. CI verifies that release metadata is internally consistent.**

---

# 16. Production Version Identity

Production retains both human-readable and exact technical identity:

```text
Version    1.6.2
Commit     a83f72c
```

The immutable deployment identity remains the Git SHA.

The semantic version provides a useful human-facing release number.

Every app should expose this unobtrusively through an About/Help area or equivalent.

---

# 17. Authentication Is Built Into Every Application

Every monkeyOS application starts with working login.

```text
Login
  ↓
Supabase Auth
  ↓
Application membership check
  ↓
Application
```

Supabase Auth owns identity.

Applications do not implement their own identity systems.

The default behavior is fail-closed:

```text
not authenticated
→ login

authenticated + app member
→ application

authenticated + not member
→ "You don't have access to this application"
```

This should be functional in the scaffold, not left as an exercise for each application builder.

---

# 18. Each Application Owns Its User Access

Identity is shared, but authorization belongs to each application.

For a `finance` application:

```text
auth.users
   │
   │ shared identity
   ▼
finance.members
```

The standard membership model should remain small:

```text
finance.members

user_id
role             admin | member
created_at
created_by
```

Every scaffold includes an admin-only **Access** page:

```text
Access

alice@company.com        Admin       Remove
bob@company.com          Member      Remove

[ Add user ]
```

App admins can:

- add an existing Supabase user by exact email;
- change `admin` / `member`;
- remove application access.

Removing a user from an app removes only that application's membership.

It does not delete their Supabase identity or affect access to another app.

There is no shared user directory.

---

# 19. User Lookup Is Narrow and Server-Side

Normal application browser code does not receive general access to `auth.users`.

When adding a user:

```text
exact email
↓
narrow privileged lookup
↓
matching auth user ID
↓
insert into <app>.members
```

If no user exists:

```text
User not found.
```

The app does not expose or browse the wider identity database.

When a new application is provisioned, the requester/application owner should normally become the initial `admin`.

The rule is:

> **Identity is shared. Authorization is owned locally by each application.**

---

# 20. Membership Is Enforced With RLS

Application access is not merely a UI convention.

Database policies enforce membership.

Conceptually:

```text
auth.uid()
↓
member of finance?
↓
yes → permitted application access
no  → denied
```

Admin-only operations additionally check the user's application role.

Hiding an admin button is not an authorization mechanism.

---

# 21. Audit Trails Are a Scaffold Capability

Supabase provides useful authentication and platform logs, but monkeyOS applications also need **business-level audit history**.

Every scaffold therefore contains a simple audit mechanism.

Conceptually:

```text
finance.audit_log

timestamp
actor_user_id
action
entity
record_id
before
after
```

The implementation should be database-backed where practical so auditing does not depend entirely on one particular UI flow.

The rule is:

> **Changes that matter to the business should be traceable.**

---

# 22. What Should Be Audited

Not every database read needs to become a permanent business audit record.

Audit history should focus on meaningful changes such as:

- approvals;
- important status transitions;
- financial changes;
- permission changes;
- changes to sensitive records;
- other material business actions.

Membership changes are always audited.

For example:

```text
2026-08-19 14:32
actor: alice
action: membership_removed
user: bob
previous_role: member
```

The standard scaffold provides the audit mechanism; individual applications can extend which business entities use it.

This should remain simple rather than evolving into a generic event-sourcing framework.

---

# 23. Simplified Application Onboarding

The application README assumes the GitHub organization has already been configured for monkeyOS.

For a normal developer:

```text
1. Clone repository
2. Authenticate GitHub if needed
3. Ask the coding agent: "start app"
```

If the repository has not yet been provisioned, the only platform request should be:

> **Provision this repository as a monkeyOS application.**

The standard provisioning process derives:

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
initial application admin
↓
production environment
↓
standard platform controls
```

The user does not need to individually request schema naming, Cloudflare configuration, runtime hosts, deployment SSH, GHCR, or audit setup.

---

# 24. Local Development

Required locally:

```text
compatible coding-agent harness
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

Not required:

```text
Kamal
cloud provider CLI
production SSH
production DB credentials
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

Production is not used as the normal local development database.

---

# 25. Self-Service `start`

The user says:

```text
start app
```

The centrally managed `start` skill performs approximately:

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
report URL
```

The scaffold's local seed should make login and access management easy to test locally.

---

# 26. Standard Application Stack

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
Local UI state           React
Shared client state      Zustand narrowly
URL state                React Router

Tables                   TanStack Table
Charts                   Recharts v3

Database                 Supabase Postgres
Client                   supabase-js
Schema management        SQL migrations
ORM                      none

Formatting               oxfmt
Linting                  oxlint

Unit tests               Bun test
E2E                      Playwright
```

No central monkeyOS application-component library.

Do not duplicate server data into Zustand.

Do not use `useEffect` as the normal server-data fetching mechanism.

With React Compiler, do not routinely introduce `useMemo`, `useCallback`, or `React.memo` unless profiling demonstrates a need.

---

# 27. Engineering Philosophy

> **SOLID and clean, but simple.**

Avoid under-engineering:

```text
giant components
duplicated business logic
untyped data
hidden side effects
business logic embedded directly in UI
ad-hoc state
```

Avoid over-engineering:

```text
unnecessary interfaces
factories without real need
generic internal frameworks
premature extensibility
deep abstraction hierarchies
excessive indirection
```

Abstractions should exist because they solve a concrete problem.

---

# 28. Data Architecture & Governance

The governing model remains:

> **Own locally. Discover globally. Share explicitly.**

## Own locally

Each application owns its own schema and application-specific data.

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

## Discover globally

Development roles can inspect structural metadata across application schemas:

```text
tables
views
columns
types
relationships
comments
```

but cannot access their row data merely because the structure is discoverable.

For example:

```text
finance_dev

finance.*      → metadata + data
hr.*           → metadata only
ops.*          → metadata only
procurement.*  → metadata only
```

Metadata comes directly from PostgreSQL catalogs through a constrained platform-owned interface.

There is no manually maintained data catalog.

Before creating an important business entity, the migration process checks whether an existing source of truth already exists.

## Share explicitly

Existing sources should be reused rather than copied.

Cross-domain reads use narrow contracts such as:

```text
views
functions / RPC
APIs
```

Cross-domain writes require explicit operations owned by the source domain.

> **Use the simplest relational model that preserves business meaning and integrity.**

---

# 29. Supabase Architecture

A Supabase project represents an environment/trust boundary, not one individual application.

Applications may therefore share Supabase Auth while retaining separate application authorization.

```text
User
 ↓
Supabase Auth
 ↓
JWT
 ↓
app membership + RLS
 ↓
authorized application data
```

## Developer role

Example:

```text
finance_dev
```

Gets:

```text
own-schema development access
global structural metadata discovery
explicitly approved cross-domain contracts
```

Never:

```text
postgres
project owner
service_role
```

## Runtime role

Example:

```text
finance_runtime
```

Gets:

```text
required own-schema access
explicitly required cross-domain runtime contracts
no DDL
no global metadata discovery
```

---

# 30. Database Security Defaults

Use a fail-closed posture.

For example:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New data requires explicit:

```text
grants
RLS
authorization
cross-domain access
```

SQL migrations remain canonical.

---

# 31. Development Review Loop

Every meaningful application change follows:

```text
understand
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

Findings are:

```text
BLOCKING
IMPORTANT
SUGGESTION
```

No commit while blocking findings remain.

---

# 32. Code and Security Review

Code review covers:

- correctness
- edge cases
- errors
- validation
- architecture
- responsibilities
- abstraction quality
- simplicity
- duplication
- React/state patterns
- database design
- data ownership
- mobile behavior
- accessibility
- testing

Security review separately covers:

- authentication
- application membership
- authorization
- RLS
- schema boundaries
- cross-domain access
- audit coverage
- PII
- logging
- input validation
- injection
- secrets
- dependencies
- browser security
- uploads
- container security

---

# 33. Continuous Integration

Application CI is a thin caller into the central monkeyOS workflow.

The central CI performs:

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
RLS / membership tests
↓
audit behavior tests where relevant
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

CI should also verify release metadata consistency:

```text
package.json version
=
latest CHANGELOG version
```

> **Agent reasoning provides contextual review. CI provides deterministic verification.**

---

# 34. Immutable Artifact Model

Successful CI creates:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

The artifact is:

```text
built once
tested once
security checked
deployed unchanged
```

Production deployment never rebuilds application source.

---

# 35. GitHub as Platform Control Plane

GitHub provides:

```text
source control
CI
reusable workflows
organization variables
organization secrets
production environment secrets
GHCR
deployment history
scheduled audits
```

There is no separate application registry or deployment-state service.

---

# 36. Runtime Architecture

A runtime pool is a **small HA cell**, not a general-purpose scheduler.

V1:

```text
production/default

├── app-prod-01
└── app-prod-02
```

Every standard application runs on both hosts.

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

There is deliberately no:

```text
app → server mapping
placement algorithm
scheduler
routing registry
application-aware routing service
```

> **Any healthy runtime host can serve any standard application in the pool.**

---

# 37. Cloudflare Front Door

One wildcard Cloudflare Load Balancer fronts the pool:

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

Because every standard app exists on both hosts, no application-specific Cloudflare routing is required.

No normal per-app:

- DNS record
- load balancer
- routing entry
- Worker/router

is necessary.

---

# 38. Production Deployment

Application repo:

```text
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
runtime hosts
runtime pool
production domain
SSH target
Docker privileges
host mounts
```

The effective operation remains:

```text
deploy_this_repository()
```

---

# 39. Deployment Security

The trusted sequence is:

```text
verify CI succeeded
↓
verify immutable GHCR artifact
↓
load production deployment credentials
↓
generate trusted temporary Kamal config
↓
kamal deploy
```

After production credentials are loaded, arbitrary application-controlled scripts must not execute.

Production SSH never belongs in:

```text
local development
ordinary CI
application runtime
application source
```

---

# 40. Container Privilege Boundary

Application Owners control their application image.

They do not control host-level Docker capabilities.

Applications cannot request:

```text
privileged mode
Docker socket
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker flags
```

Those remain under monkeyOS control.

---

# 41. Availability and Scaling

The two-host pool provides application-level redundancy.

Infrastructure maintenance is rolling:

```text
drain prod-01
↓
maintain / resize
↓
verify
↓
restore

drain prod-02
↓
maintain / resize
↓
verify
↓
restore
```

This applies to VM resizing, host replacement, OS/Docker maintenance, and similar operations.

Vertical scaling is the default V1 strategy.

> **Scale the small HA cell vertically before adding scheduling complexity.**

---

# 42. Secrets and Configuration

## Organization variables

Examples:

```text
PROD_DEFAULT_HOSTS
PROD_SSH_USER
APPS_BASE_DOMAIN
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

## Organization secrets

Shared sensitive platform values.

## Repository `production` environment secrets

Application-specific production credentials, such as:

```text
DATABASE_URL
third-party API credentials
application-specific secrets
```

Normal app repositories should not need repository-level platform configuration variables.

Secrets are never printed back to users or agents.

---

# 43. Mobile and Testing

Every application must support:

```text
mobile
tablet
desktop
```

Requirements include:

- no horizontal overflow
- usable navigation
- mobile-friendly forms
- viewport-safe dialogs
- appropriate touch targets
- accessible primary actions
- sensible mobile tables
- loading, empty, and error states

Playwright should cover representative viewports around:

```text
390 × 844
768 × 1024
1440 × 900
```

Tests should cover authentication, membership, access management, CRUD, reload, permissions, and important error behavior.

---

# 44. Continuous Repository Security

Security operates at two levels:

```text
CHANGE LEVEL
every meaningful change

REPOSITORY LEVEL
scheduled reassessment
```

AI-enabled scheduled audits run:

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

It checks areas such as dependencies, authentication, membership and authorization, RLS, audit coverage, data architecture, PII, secrets, frontend/API security, Docker, Actions, deployment, logging, complexity, duplication, obsolete workarounds, and missing tests.

It should surface material issues rather than cause stylistic churn.

---

# 45. Standard Application Scaffold Guarantee

A newly provisioned monkeyOS repository should **not** be an empty React project.

It should already provide:

```text
✓ working login/logout
✓ shared Supabase Auth integration
✓ protected routes
✓ <app>.members
✓ admin/member roles
✓ admin-only Access page
✓ add existing user by exact email
✓ change role
✓ remove app access
✓ RLS-backed authorization
✓ membership-change auditing
✓ general business audit mechanism
✓ responsive mobile/tablet/desktop shell
✓ useful README.md
✓ automatically maintained CHANGELOG.md
✓ semantic application version
✓ version + Git SHA identification
✓ local Supabase
✓ tests
✓ review/security workflow
✓ deterministic CI
✓ immutable GHCR artifact
✓ explicit production deployment
```

The person creating an application can therefore focus immediately on **the business problem**.

---

# 46. Organization Installation

Installing monkeyOS once establishes:

```text
<org>/monkeyos-platform
↓
central reusable workflows
central skills
Pi
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

After this, creating an application should be routine provisioning rather than an infrastructure project.

---

# 47. New Application Provisioning

A normal flow is:

```text
create repository from scaffold
↓
provision repository as monkeyOS application
↓
derive identity from repo name
↓
create schema / roles
↓
configure production environment
↓
make requester initial admin
↓
apply standard platform controls
↓
grant Application Owner Write/Maintain
```

Normal development is then self-service.

---

# 48. Normal Developer Lifecycle

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

Developers should not routinely need to ask for:

- server assignments
- DNS records
- Cloudflare changes
- Kamal configuration
- production SSH
- schema naming
- CI setup
- audit setup
- GHCR setup
- login/access infrastructure

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
      ┌───────┼───────────────┐
      │       │               │
 application database     app shell
   logic      migrations       │
      │       │          login / access
      │       │          README / changelog
      └───────┴───────┬───────┘
                      │
             coding-agent harness
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

Application identity and access:

```text
                 Supabase Auth
                 shared identity
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     finance.members  hr.members  ops.members
          │
          ▼
      Finance App
          │
          ├── RLS authorization
          ├── Access management
          └── audit history
```

Data model:

```text
Application's own schema
        ↓
own data + membership + audit

Other application schemas
        ↓
metadata discovery only
        ↓
existing source of truth
        ↓
explicit cross-domain contract
```

---

# Guiding Principles

> **monkeyOS is a portable application platform that can be installed into any GitHub organization.**

> **Application repositories contain application concerns; platform behavior is inherited centrally wherever possible.**

> **The repository is the application, and repository identity determines database and deployment identity.**

> **Developer-side coding-agent usage is harness-independent; AI execution inside GitHub Actions uses Pi.**

> **Central workflows and centrally synchronized skills allow platform improvements to propagate across applications.**

> **Every application starts as a secure, governable company application shell rather than an empty software project.**

> **Authentication is shared; application authorization is local.**

> **Every application manages its own membership. No shared user directory is required.**

> **Changes that matter to the business should be traceable.**

> **The application's README is its front door; someone should be able to understand and start the app without hunting through separate documentation.**

> **The changelog describes meaningful changes to the application and is maintained automatically together with application versions.**

> **`main` is source; production is an explicit promotion of an immutable, already-tested artifact.**

> **Own locally. Discover globally. Share explicitly.**

> **A runtime pool is a small HA cell of interchangeable hosts, not an application scheduler.**

> **Scale the small HA cell vertically before introducing sophisticated placement or orchestration.**

> **Every meaningful change receives code review, security review, and deterministic verification before becoming deployable.**

> **Security and maintainability are reassessed periodically even when application code has not changed.**

> **Keep monkeyOS deliberately simple until real requirements justify additional platform complexity.**
