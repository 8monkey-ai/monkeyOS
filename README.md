# monkeyOS
## Overall Approach & Architecture — Canonical V1

## 1. Objective

**monkeyOS** is a self-service application platform that can be installed into any GitHub organization.

It enables business users and developers to build, test, review, secure and deploy production-ready internal applications with minimal infrastructure knowledge.

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

A coding agent is expected to be the primary development interface, but monkeyOS is deliberately independent of any specific developer-side agent harness.

The standardized platform layer is:

```text
GitHub     → source, CI/CD, configuration, secrets, GHCR
Cloudflare → DNS, TLS, CDN, load balancing
Supabase   → Postgres + Auth
Kamal      → deployment
Pi         → AI execution inside GitHub Actions
```

The compute underneath remains replaceable: Azure, AWS, GCP, Hetzner, bare metal, or another Docker-capable Linux environment.

The overall goal is:

> **Make building applications extremely easy while keeping infrastructure, security and data-governance boundaries strong.**

---

# 2. Three-Layer Architecture

monkeyOS has three layers.

## Layer 1 — monkeyOS Distribution

The portable upstream platform:

```text
monkeyOS
├── organization installation tooling
├── application scaffold
├── reusable workflows
├── shared skills
├── provisioning logic
└── documentation
```

It contains no organization-specific assumptions such as domains, GitHub organization names, Supabase projects, runtime hosts or credentials.

## Layer 2 — Organization Installation

monkeyOS is installed once into a GitHub organization.

The organization gets a central repository:

```text
<organization>/monkeyos-platform
```

It owns:

```text
central reusable workflows
central skills
application provisioning
deployment implementation
Pi configuration
platform documentation
```

The organization itself holds shared configuration such as GitHub organization variables/secrets, rulesets, Supabase, Cloudflare, runtime hosts and deployment credentials.

## Layer 3 — Application Repository

An application repository contains almost exclusively application concerns:

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

The workflows are tiny managed callers into `monkeyos-platform`.

The skills are synchronized from `monkeyos-platform`.

> **Application repositories contain application-specific decisions. Platform behavior is inherited centrally wherever technically possible.**

---

# 3. monkeyOS Has No Central Database State

This is a hard architectural rule:

> **monkeyOS owns no central application state in Postgres/Supabase.**

There is no monkeyOS database containing:

```text
applications
deployment state
memberships
user directory
domains
runtime assignments
audit records
schema registry
data catalog
workflow state
```

monkeyOS is a **control plane and convention layer**, not a runtime database dependency.

State stays with the system that naturally owns it:

```text
GitHub
→ source, CI, configuration, deployment history

Supabase Auth
→ identity

finance.*
→ Finance application state

hr.*
→ HR application state

ops.*
→ Ops application state

Cloudflare
→ edge/routing configuration

runtime infrastructure
→ host/runtime state
```

A standard application never needs to query a monkeyOS database in order to work.

---

# 4. The Repository Is the Application

Repository identity determines application identity.

For example:

```text
<organization>/finance
```

derives:

```text
application        finance
database schema    finance
developer role     finance_dev
runtime role       finance_runtime
container image    ghcr.io/<organization>/finance:<git-sha>
production URL     finance.<apps-domain>
```

Multi-word repositories are normalized predictably:

```text
finance-reporting → finance_reporting
hr-onboarding     → hr_onboarding
ops-planning      → ops_planning
```

One normalization implementation should be reused by provisioning, migrations, local setup and deployment.

Invalid or colliding names fail explicitly.

There is no separate application registry.

---

# 5. Convention Over Configuration

A standard app should require almost no platform configuration.

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

Application repositories do not contain runtime hosts, Cloudflare configuration, production SSH, cloud IDs or Kamal host configuration.

Those belong to the organization installation.

---

# 6. `main` Is Source, Not Production

```text
main
= latest accepted source

production
= explicitly promoted immutable artifact
```

A push to `main` never automatically deploys.

Business users may commit directly to `main`.

Branches can be used where helpful, but they are a collaboration mechanism, not a platform requirement.

Production requires:

```text
deploy production
```

---

# 7. Roles and Trust Boundary

## Application Owner

Normally receives GitHub **Write or Maintain**, not Admin.

Controls application code, tests, migrations, dependencies, Dockerfile and application behavior.

Can commit and trigger deployment of their own application.

## Platform Admin

Controls organization installation, central workflows, central skills, rulesets, production environments, organization configuration, deployment credentials, runtime infrastructure, Cloudflare and shared Supabase setup.

The rule is:

> **Application Owners control what the application does. Platform Admins control where and how it runs.**

---

# 8. Developer-Side Harness Independence

monkeyOS does not depend on one coding-agent product.

Developers can use any compatible agent harness.

```text
coding agent
    ↓
AGENTS.md
+
monkeyOS skills
    ↓
Git / gh / Bun / Supabase CLI
```

Skills describe desired behavior rather than product-specific features.

For example:

> Perform an independent review and prefer a fresh reviewer context where supported.

monkeyOS standardizes **behavior and interfaces**, not which coding agent someone uses.

---

# 9. Centralized GitHub Workflows

As much workflow logic as possible lives centrally:

```text
<organization>/monkeyos-platform
```

Application repos contain only tiny callers such as:

```yaml
jobs:
  ci:
    uses: <organization>/monkeyos-platform/.github/workflows/ci.yml@v1
```

The same model applies to CI, deployment and scheduled audits.

This lets central improvements propagate automatically across applications:

```text
new scanner
tool upgrade
CI improvement
deployment hardening
Kamal change
Pi update
audit improvement
```

without changing every repository.

---

# 10. Workflow Compatibility Channels

Applications consume monkeyOS-owned workflows through a protected compatibility channel such as:

```text
@v1
```

The model is:

```text
v1
→ backwards-compatible improvements
→ inherited automatically

v2
→ breaking platform contract
→ deliberate migration
```

Third-party Actions used inside central workflows should still be appropriately pinned.

---

# 11. AI Inside GitHub Actions

Developer-side agents remain harness-independent.

Inside GitHub Actions:

> **Any AI-powered workflow uses Pi.**

For example:

```text
repository audit
security review
architecture review
automated maintenance
```

The application repository does not choose or install an Actions-side AI harness.

```text
Application Repo
      ↓
central workflow
      ↓
Pi
      ↓
central monkeyOS skill
```

Pi's version, model access and configuration are controlled centrally.

---

# 12. Centrally Managed Skills

Canonical skills live in:

```text
<organization>/monkeyos-platform/skills/
```

Initial skills:

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

They synchronize into:

```text
.monkeyos/skills/
```

The mechanism remains simple: plain files synchronized from the organization's central repository.

Synchronized files are clearly marked as monkeyOS-managed.

---

# 13. `AGENTS.md` Is Repository-Focused

`AGENTS.md` answers only:

> **How should an agent safely modify this application?**

It contains the app's stack, engineering standards, state-management rules, data rules, application-security rules and testing expectations.

It does **not** explain:

```text
Kamal internals
production SSH
Cloudflare maintenance
runtime topology
central deployment implementation
platform operations
```

One platform rule is sufficient:

> **monkeyOS-managed files must not be modified as normal application code.**

---

# 14. README Is the Application Front Door

Every application has a useful top-level:

```text
README.md
```

No separate docs directory should be needed for normal application development.

The README explains:

- what the application does;
- how to get started;
- common monkeyOS commands;
- how login and access work;
- what business data the app owns;
- what external data it consumes;
- how commit and deployment work at a user level;
- current application version.

Getting started should be approximately:

```text
1. Clone repository
2. Authenticate GitHub if necessary
3. Open with your preferred coding agent
4. Ask: "start app"
```

If the application has not yet been provisioned, the only platform request should be:

> **Provision this repository as a monkeyOS application.**

---

# 15. CHANGELOG and Versioning

Every application contains:

```text
CHANGELOG.md
```

The coding agent maintains it automatically.

It records meaningful business/user changes, for example:

```markdown
## 1.4.0

### Added
- Added approval of monthly reports.

### Fixed
- Fixed incorrect totals for reversed entries.
```

It should not become a dump of internal refactoring details.

Applications use pragmatic semantic versioning:

```text
new capability   → MINOR
bug fix          → PATCH
breaking change  → MAJOR
```

The canonical version lives in `package.json`.

CI verifies that the application version and latest changelog version agree.

---

# 16. Versioning Is Part of `commit`

The central `commit` skill performs:

```text
inspect change
↓
classify change
↓
if meaningful application behavior changed:
    update CHANGELOG
    update semantic version
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
rerun affected checks
↓
commit
↓
push
```

Production can therefore identify both:

```text
Version   1.6.2
Commit    a83f72c
```

The Git SHA remains the immutable technical deployment identity.

---

# 17. Authentication Is Built In

Every monkeyOS app starts with working authentication.

```text
Login
  ↓
Supabase Auth
  ↓
app membership
  ↓
Application
```

Supabase Auth owns identity.

Applications do not build their own identity system.

Default behavior is fail-closed:

```text
not authenticated
→ login

authenticated + member
→ application

authenticated + not member
→ access denied
```

---

# 18. Every Application Owns Its Membership

Identity is shared through Supabase Auth.

Authorization belongs to each application.

For Finance:

```text
auth.users
    ↓
finance.members
```

The standard table is deliberately small:

```text
finance.members

user_id
role        admin | member
created_at
created_by
```

There is **no central membership table**.

There is **no shared user directory**.

Every application scaffold includes an admin-only **Access** page.

An app admin can:

```text
add existing Supabase user by exact email
change admin/member role
remove application access
```

Removing someone from Finance affects only `finance.members`.

It does not delete their Supabase identity or change their access elsewhere.

---

# 19. User Lookup Is Narrow

Normal browser code does not get general access to `auth.users`.

Adding a member works conceptually as:

```text
exact email
↓
narrow privileged lookup
↓
matching Supabase Auth user
↓
insert into finance.members
```

There is no user-directory browsing or central replicated identity table.

The initial application owner should normally become the first application `admin` during provisioning.

> **Identity is shared. Authorization is local.**

---

# 20. Membership Is Enforced in the Database

Access is not just a UI convention.

RLS enforces membership.

```text
auth.uid()
↓
finance member?
↓
yes → permitted
no  → denied
```

Admin-only operations additionally verify the application role.

Hiding a button is never treated as authorization.

---

# 21. Business Audit Trails Are Built In

Supabase Auth/platform logs handle infrastructure and identity-level events.

Applications additionally own their own **business audit history**.

For example:

```text
finance.audit_log
```

A simple record may contain:

```text
timestamp
actor_user_id
action
entity
record_id
before
after
```

There is no:

```text
monkeyos.audit_log
platform.audit_log
global application audit table
```

Each application's audit history belongs to that application.

> **Changes that matter to the business should be traceable.**

---

# 22. What Is Audited

The scaffold provides the mechanism, but does not turn every database operation into permanent audit history.

Audit meaningful changes such as:

```text
approvals
important status changes
financial changes
permission changes
sensitive record changes
other material business actions
```

Membership changes are always audited.

For example:

```text
actor: alice
action: membership_removed
subject: bob
previous_role: member
```

The design should remain simple rather than becoming an event-sourcing framework.

---

# 23. No Central Platform Data Model

Shared business concepts do not belong to monkeyOS itself.

For example, monkeyOS should not create central tables for:

```text
employees
stores
customers
products
suppliers
finance records
application memberships
business audit records
```

Those belong to whichever application/domain actually owns them.

This is an important boundary:

> **monkeyOS governs applications; it does not become another business domain.**

---

# 24. Data Architecture & Governance

The data principle remains:

> **Own locally. Discover globally. Share explicitly.**

## Own locally

Each app owns its own schema and business state.

```text
Production Supabase
├── auth
├── finance
├── hr
├── ops
├── procurement
└── reporting
```

Notice that there is **no monkeyOS/platform schema containing central state**.

## Discover globally

Development roles may inspect database structure across other schemas:

```text
tables
views
columns
types
relationships
comments
```

but this does not grant row access.

Example:

```text
finance_dev

finance.*      → metadata + data
hr.*           → metadata only
ops.*          → metadata only
procurement.*  → metadata only
```

Metadata discovery should derive from PostgreSQL's actual catalogs, not from a monkeyOS-maintained catalog.

If helper functions/views are required to expose this safely, they must be **stateless database interfaces**, not tables containing monkeyOS-owned metadata.

## Share explicitly

If another domain already owns the information, reuse it through explicit contracts.

Cross-domain reads can use narrow:

```text
views
functions / RPC
APIs
```

Cross-domain writes require operations controlled by the source domain rather than broad write access.

> **Use the simplest relational model that preserves business meaning and integrity.**

---

# 25. Supabase Architecture

One Supabase project represents an environment/trust boundary, not an individual app.

Shared:

```text
Supabase Auth
```

App-local:

```text
finance.*
hr.*
ops.*
```

This allows a person to have one identity but different permissions across applications.

```text
Supabase Auth
     │
 ┌───┼──────────┐
 ▼   ▼          ▼
finance.members hr.members ops.members
```

No platform-owned identity mirror or shared membership store is required.

---

# 26. Database Roles

For `finance`:

## Developer

```text
finance_dev
```

gets:

```text
own-schema development access
structural metadata discovery
explicit cross-domain contracts
```

Never broad roles such as:

```text
postgres
project owner
service_role
```

## Runtime

```text
finance_runtime
```

gets:

```text
required own-schema access
required explicit contracts
no DDL
no global metadata discovery
```

Security boundaries rely on grants/RLS, not naming conventions.

---

# 27. Database Security Defaults

Use a fail-closed posture:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New objects require explicit authorization.

SQL migrations are canonical.

No ORM.

---

# 28. Local Development

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
cloud CLI
production SSH
production DB credentials
Cloudflare CLI
GitHub runner
GHCR credentials
```

Applications develop against local Supabase:

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

Production is not the normal development database.

---

# 29. `start app`

The `start` skill performs approximately:

```text
check tools
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
seed DB/Auth
↓
generate types
↓
start app
↓
report URL
```

Local seeds should make login, membership and access-management testing straightforward.

---

# 30. Standard Application Stack

```text
Runtime/package manager  Bun
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
Schema                    SQL migrations
ORM                       none

Formatting               oxfmt
Linting                  oxlint

Unit tests               Bun test
E2E                      Playwright
```

No normal server-data fetching via `useEffect`.

With React Compiler, avoid routine manual memoization unless profiling justifies it.

No central monkeyOS UI component framework.

---

# 31. Engineering Philosophy

> **SOLID and clean, but simple.**

Avoid under-engineering such as giant components, duplicated business logic, untyped data, hidden side effects and ad-hoc state management.

Avoid over-engineering such as speculative frameworks, unnecessary factories/interfaces, premature extensibility and deep indirection.

Abstractions should solve concrete problems.

---

# 32. Review and Security Loop

Every meaningful change follows:

```text
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

Findings:

```text
BLOCKING
IMPORTANT
SUGGESTION
```

No commit with blocking findings.

Security review covers authentication, membership, authorization, RLS, schema boundaries, cross-domain access, audit coverage, PII, logging, validation, injection, secrets, dependencies, browser security, uploads and container security.

---

# 33. Continuous Integration

App CI is a tiny caller to central monkeyOS CI.

The central workflow runs:

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
audit tests where relevant
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

CI also validates version/changelog consistency.

> **Agent reasoning provides contextual review; CI provides deterministic verification.**

---

# 34. Immutable Artifacts

Successful CI produces:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

The image is:

```text
built once
tested once
security checked once
deployed unchanged
```

Production never rebuilds source.

---

# 35. GitHub as Platform Control Plane

GitHub owns the platform state it is already good at:

```text
source control
CI status
workflow definitions
deployment history
organization variables
organization secrets
production environment secrets
GHCR
scheduled audits
```

monkeyOS does not mirror this state into Supabase.

There is no monkeyOS application registry or deployment-state DB.

---

# 36. Runtime Architecture

A runtime pool is a **small HA cell**, not an application scheduler.

V1:

```text
production/default

├── app-prod-01
└── app-prod-02
```

Every standard app runs on every host:

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

There is no app→server registry, scheduler, placement algorithm or routing database.

> **Any healthy host can serve any standard app in its pool.**

---

# 37. Runtime Configuration

The organization owns:

```text
PROD_DEFAULT_HOSTS
```

for example:

```text
app-prod-01.example.com,app-prod-02.example.com
```

as a GitHub organization variable.

The central deployment workflow derives:

```text
repo
↓
production/default
↓
PROD_DEFAULT_HOSTS
↓
Kamal hosts
```

Again, there is no database table storing application placement.

---

# 38. Cloudflare Front Door

One wildcard Cloudflare Load Balancer fronts the runtime pool:

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

Every app is on every host, so there is no app-specific routing registry.

No normal per-app DNS or load balancer is required.

---

# 39. Production Deployment

```text
Application repo
      ↓
tiny managed caller
      ↓
monkeyos-platform
      ↓
GitHub-hosted runner
      ↓
Kamal
      ↓
runtime hosts
```

The application cannot choose:

```text
target hosts
runtime pool
domain
SSH target
Docker privileges
host mounts
```

The effective operation is:

```text
deploy_this_repository()
```

---

# 40. Deployment Security

Trusted deployment sequence:

```text
verify CI
↓
verify immutable image
↓
load production SSH credential
↓
generate trusted temporary Kamal config
↓
kamal deploy
```

No arbitrary application-controlled scripts execute after deployment credentials are loaded.

Production SSH is never exposed to local development, ordinary CI or the application runtime.

---

# 41. Container Privilege Boundary

Application Owners control the application image, not the Docker host.

Applications cannot request:

```text
privileged mode
Docker socket
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker flags
```

These remain centrally controlled.

---

# 42. Availability and Scaling

Maintenance and vertical resizing happen one host at a time:

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

Vertical scaling remains the default V1 strategy.

> **Scale the small HA cell vertically before introducing scheduling complexity.**

---

# 43. Secrets and Configuration

Platform configuration uses the systems already responsible for it.

Examples of GitHub organization variables:

```text
PROD_DEFAULT_HOSTS
PROD_SSH_USER
APPS_BASE_DOMAIN
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Shared sensitive values use organization secrets.

App-specific production secrets use that repository's `production` environment.

No monkeyOS database exists to store or mirror these values.

Secrets are never printed back to users or coding agents.

---

# 44. Mobile and Testing

Every app must support mobile, tablet and desktop.

Tests should cover:

```text
authentication
membership
user management
RLS
audit behavior
CRUD
navigation
reload
permissions
error states
responsive layouts
```

Representative Playwright sizes:

```text
390 × 844
768 × 1024
1440 × 900
```

---

# 45. Continuous Repository Security

Security operates at:

```text
change level
+
scheduled repository level
```

AI-enabled scheduled audits run:

```text
GitHub Actions
↓
central monkeyOS workflow
↓
Pi
↓
central security/review skills
```

The audit asks:

> **Would we still consider this application secure and maintainable if we built it today?**

It checks dependencies, auth, membership, RLS, audit coverage, data ownership, PII, secrets, frontend/API security, Docker, GitHub Actions, deployment and important missing tests.

No style-only churn.

---

# 46. Standard Application Scaffold Guarantee

A new monkeyOS app should already provide:

```text
✓ README.md
✓ CHANGELOG.md
✓ semantic versioning
✓ version + Git SHA identification

✓ working login/logout
✓ shared Supabase Auth
✓ protected routes

✓ <app>.members
✓ admin/member roles
✓ admin-only Access page
✓ add existing user by exact email
✓ role changes
✓ remove app access
✓ RLS-backed membership authorization

✓ <app>.audit_log
✓ membership-change auditing
✓ standard business-audit mechanism

✓ local Supabase
✓ responsive app shell
✓ tests
✓ review/security workflow
✓ central deterministic CI
✓ immutable GHCR artifact
✓ explicit production deployment
```

It does **not** require:

```text
monkeyOS database
platform schema with central state
central user directory
central membership tables
central audit table
central application registry
central deployment-state table
central data catalog
```

A new repository is therefore already a **secure, governable application shell**, while its business state remains entirely owned by the application itself.

---

# 47. New Application Provisioning

The normal flow is:

```text
create repository from scaffold
↓
provision as monkeyOS application
↓
derive schema and roles from repo name
↓
configure production environment
↓
make requester initial application admin
↓
apply standard controls
↓
grant Write/Maintain
```

Provisioning may execute configuration changes against GitHub, Supabase and infrastructure, but it does not register the app in a monkeyOS database.

After provisioning, normal development is self-service.

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
              ┌──────────────┴──────────────┐
              │                             │
       monkeyos-platform             shared services
              │                             │
      ┌───────┴────────┐             Supabase Auth
      │                │             Cloudflare
 central workflows  central skills   runtime hosts
      │                │
 reusable callers    sync
      │                │
      └───────┬────────┘
              ▼
        APPLICATION REPO
              │
       ┌──────┼──────────────┐
       │      │              │
      code  own schema   app shell
             │          login / access
             │          audit
             │          README / changelog
             │
      NO CENTRAL monkeyOS DB
             │
             ▼
          Supabase
       ┌─────┼──────┐
       ▼     ▼      ▼
    finance  hr     ops
       │
       ├── members
       ├── audit_log
       └── business data
```

Deployment:

```text
Application repo
      ↓
central CI
      ↓
immutable GHCR image
      ↓
explicit deploy
      ↓
central deployment workflow
      ↓
GitHub-hosted runner
      ↓
Kamal
      ↓
┌─────────────┐
▼             ▼
prod-01     prod-02
```

Identity and authorization:

```text
                Supabase Auth
                shared identity
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    finance.members hr.members ops.members

Each application owns its own authorization state.
```

---

# Guiding Principles

> **monkeyOS is a portable application platform that can be installed into any GitHub organization.**

> **monkeyOS has no central application-state database.**

> **The platform provisions and governs applications, but does not become a runtime data dependency or business-data owner.**

> **State belongs to the system that naturally owns it: application state to applications, identity to Supabase Auth, deployment/configuration state to GitHub and infrastructure services.**

> **There is no central user directory, membership store, business audit store, application registry, deployment-state database, or data catalog owned by monkeyOS.**

> **The repository is the application, and repository identity determines database and deployment identity.**

> **Application repositories contain application concerns; platform behavior is inherited centrally wherever possible.**

> **Authentication is shared; authorization is local to each application.**

> **Changes that matter to the business are audited by the application that owns them.**

> **Own locally. Discover globally. Share explicitly.**

> **Metadata discovery reflects the real PostgreSQL structure rather than a monkeyOS-maintained copy.**

> **The README is the application's front door, and the changelog/version are maintained as part of the normal development workflow.**

> **Developer-side coding-agent usage is harness-independent; AI execution inside GitHub Actions uses Pi.**

> **`main` is source; production is an explicit promotion of an immutable, already-tested artifact.**

> **A runtime pool is a small HA cell of interchangeable hosts, not an application scheduler.**

> **Scale vertically before adding placement or orchestration complexity.**

> **Every meaningful change receives code review, security review and deterministic verification before becoming deployable.**

> **Keep monkeyOS deliberately simple and avoid creating platform-owned state unless a real, unavoidable requirement emerges.**
