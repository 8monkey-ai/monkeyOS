# monkeyOS

## Overall Approach & Architecture

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

A coding agent is expected to be the primary development interface, but monkeyOS is deliberately independent of any specific developer-side agent harness.

The standardized platform layer is:

```text
GitHub     → source, CI/CD, configuration, permissions, secrets, GHCR
Supabase   → Postgres + Auth
Cloudflare → DNS, TLS, CDN, load balancing
Terraform  → runtime infrastructure
Kamal      → application deployment
Pi         → AI execution inside GitHub Actions
Bun        → local runtime, tooling and secure local secret access
```

The underlying compute is portable across AWS, Azure, and GCP.

The goal is:

> **Make building applications extremely easy while keeping infrastructure, security, deployment, and data-governance boundaries strong.**

---

# 2. Three-Layer Architecture

## Layer 1 — monkeyOS Distribution

The portable upstream platform:

```text
monkeyOS
├── organization installation tooling
├── application scaffold
├── platform scaffold
├── reusable workflows
├── shared skills
├── Terraform infrastructure
├── provisioning logic
└── documentation
```

It contains no organization-specific assumptions such as domains, GitHub organization names, Supabase projects, cloud accounts, runtime hosts, or credentials.

## Layer 2 — Organization Installation

monkeyOS is installed once into a GitHub organization.

The organization gets:

```text
<organization>/monkeyos-platform
```

This repository owns the organization's canonical:

```text
reusable workflows
shared skills
application provisioning
Terraform infrastructure
deployment implementation
Pi configuration
platform documentation
```

Organization-level configuration covers things such as GitHub rulesets, shared variables/secrets, Supabase, Cloudflare, runtime infrastructure, and deployment credentials.

## Layer 3 — Application Repository

A standard application repository looks approximately like:

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

Application repositories contain application-specific decisions. Platform behavior is inherited centrally wherever technically possible.

---

# 3. No Central monkeyOS Database State

This is a hard architectural rule:

> **monkeyOS owns no central application state in Postgres or Supabase.**

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

monkeyOS is a **control plane and convention layer**, not a runtime data dependency.

State remains with the system that naturally owns it:

```text
GitHub
→ source, CI, configuration, permissions, deployment history

Supabase Auth
→ identity

<app>.*
→ application state, permissions, audit history

Cloudflare
→ edge/routing state

Terraform
→ infrastructure state
```

A standard application never needs to query a monkeyOS database to operate.

---

# 4. Repository Identity Is Application Identity

Repository identity determines application identity.

For:

```text
<organization>/finance
```

monkeyOS derives:

```text
application        finance
database schema    finance
developer role     finance_dev
runtime role       finance_runtime
container image    ghcr.io/<organization>/finance:<git-sha>
production URL     finance.<apps-domain>
```

Multi-word repositories normalize predictably:

```text
finance-reporting → finance_reporting
hr-onboarding     → hr_onboarding
ops-planning      → ops_planning
```

One normalization implementation is reused by provisioning, migrations, local development, and deployment.

Invalid or colliding names fail explicitly.

There is no separate application registry.

---

# 5. Convention Over Configuration

A standard app should require almost no platform configuration:

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

Application repositories do not contain runtime hosts, cloud resource IDs, Cloudflare configuration, production SSH, Terraform configuration, or Kamal host configuration.

Those belong to the organization platform.

---

# 6. `main` Is Source, Not Production

```text
main
= latest accepted source

production
= explicitly promoted immutable artifact
```

A push to `main` never automatically deploys.

Contributors may commit directly to `main` where permitted.

Branches remain optional collaboration tools rather than a platform requirement.

Production requires an explicit:

```text
deploy production
```

---

# 7. Roles & Trust Boundaries

monkeyOS separates **application development**, **production promotion**, and **platform administration**.

### Contributor

A Contributor can:

```text
clone
develop
run locally
change code
change migrations
change tests
commit / push
trigger CI
```

They cannot authorize production deployment.

Typical GitHub access is **Write**.

### Deployer

A Deployer has Contributor capabilities and can additionally authorize promotion of an already-tested artifact to production.

Production authority is controlled separately from repository write access through the repository's protected GitHub `production` environment.

### Platform Admin

A Platform Admin controls:

```text
monkeyOS installation
central workflows
central skills
rulesets
production environment configuration
deployment policy
Terraform
runtime infrastructure
Cloudflare
shared Supabase configuration
platform secrets / credentials
```

The fundamental boundary is:

> **Contributors control application development. Deployers control production promotion. Platform Admins control how and where production runs.**

Repository write access does not imply production deployment authority.

---

# 8. Production Authorization

Production authorization stays in GitHub rather than introducing a monkeyOS permissions database.

Each app has a protected:

```text
production
```

environment.

The lifecycle is:

```text
Contributor
↓
commit / push
↓
CI
↓
immutable GHCR artifact
↓
production deployment requested
↓
GitHub production environment gate
↓
authorized Deployer
↓
central deployment workflow
↓
production
```

A Contributor or coding agent can request deployment without having permission to authorize it.

For less sensitive applications, the same person may be both Contributor and Deployer.

For sensitive applications, Deployer membership can be much narrower.

---

# 9. Developer-Agent Independence

monkeyOS does not depend on Codex, Claude Code, Pi, or another specific developer-side agent harness.

Developers may use any compatible coding agent:

```text
coding agent
    ↓
AGENTS.md
+
monkeyOS skills
    ↓
Git / gh / Bun / Supabase CLI
```

monkeyOS standardizes **behavior and interfaces**, not the developer's agent.

---

# 10. Centralized Workflows

As much GitHub Actions logic as possible lives centrally:

```text
<organization>/monkeyos-platform
```

Application repositories contain thin callers such as:

```yaml
jobs:
  ci:
    uses: <organization>/monkeyos-platform/.github/workflows/ci.yml@v1
```

The same pattern applies to CI, deployment, repository audits, and AI-powered workflows.

This allows improvements such as new security scanners, CI changes, Kamal hardening, Pi updates, or audit improvements to propagate without editing every app.

Applications consume central workflows through a protected compatibility channel:

```text
v1
→ backwards-compatible improvements automatically inherited

v2
→ breaking platform contract requiring deliberate migration
```

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

The flow is:

```text
Application Repo
      ↓
central workflow
      ↓
Pi
      ↓
central monkeyOS skill
```

Pi's version, configuration, and model access are centrally controlled.

---

# 12. Centrally Managed Skills

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

They synchronize into:

```text
.monkeyos/skills/
```

The mechanism remains deliberately simple: centrally managed plain files synchronized into application repositories.

---

# 13. `AGENTS.md` Is Repository-Focused

`AGENTS.md` answers:

> **How should an agent safely modify this application?**

It contains application-relevant information:

- stack
- engineering standards
- state-management rules
- data rules
- application security
- testing expectations

It does not contain platform operational details such as Terraform, production SSH, Cloudflare maintenance, Kamal internals, or runtime topology.

One platform rule is sufficient:

> **monkeyOS-managed files must not be modified as normal application code.**

---

# 14. README Is the Application Front Door

Every application has a useful top-level `README.md`.

No separate documentation hierarchy should be required for ordinary development.

It explains:

- what the application does
- how to start it
- common monkeyOS commands
- login/access behavior
- data ownership
- external/shared data dependencies
- user-level deployment flow
- current application version

Getting started should be approximately:

```text
1. Clone repository
2. Authenticate GitHub if needed
3. Open with preferred coding agent
4. Ask: "start app"
```

Before that, the Platform Team only needs to create/provision the GitHub repository and database setup.

If the app requires development credentials for shared/external systems, the README lists **which secret names are required**, but never their values.

---

# 15. CHANGELOG & Versioning

Every application contains:

```text
CHANGELOG.md
```

The coding agent maintains it automatically.

It records meaningful business/user changes rather than implementation trivia:

```markdown
## 1.4.0

### Added
- Added approval of monthly reports.

### Fixed
- Fixed incorrect totals for reversed entries.
```

Applications use pragmatic semantic versioning:

```text
new capability  → MINOR
bug fix         → PATCH
breaking change → MAJOR
```

The canonical version lives in `package.json`.

CI validates changelog/version consistency.

Production can identify both:

```text
Version   1.6.2
Commit    a83f72c
```

The Git SHA remains the immutable technical deployment identity.

---

# 16. Authentication & Application Access

Every application starts with working authentication:

```text
Login
 ↓
Supabase Auth
 ↓
app membership
 ↓
Application
```

Supabase Auth owns shared identity.

Applications own their own authorization.

For example:

```text
auth.users
    ↓
finance.members
```

The standard membership table remains deliberately small:

```text
user_id
role        admin | member
created_at
created_by
```

There is no central membership table and no shared user directory.

Every app includes an admin-only **Access** page allowing admins to:

```text
add existing Supabase user by exact email
change admin/member role
remove application access
```

User lookup is narrow:

```text
exact email
↓
privileged exact lookup
↓
matching Auth identity
↓
insert into <app>.members
```

Normal browser code cannot browse `auth.users`.

> **Identity is shared. Authorization is local.**

---

# 17. Authorization Is Enforced by RLS

Application access is enforced at the database layer:

```text
auth.uid()
↓
member?
↓
yes → permitted
no  → denied
```

Admin-only operations additionally verify the application's role.

Hiding UI elements is never considered sufficient authorization.

---

# 18. Business Audit Trails

Every application owns its own business audit history:

```text
finance.audit_log
```

A simple record can contain:

```text
timestamp
actor_user_id
action
entity
record_id
before
after
```

Meaningful events should be audited, including:

```text
membership changes
approvals
important status changes
financial changes
sensitive record changes
material permission changes
```

There is no global monkeyOS audit table.

The mechanism should remain simple rather than becoming an event-sourcing framework.

> **Changes that matter to the business should be traceable.**

---

# 19. Data Architecture & Governance

The governing principle is:

> **Own locally. Discover globally. Share explicitly.**

### Own locally

Each application owns its schema and business state:

```text
Production Supabase
├── auth
├── finance
├── hr
├── ops
├── procurement
└── reporting
```

There is no monkeyOS platform-state schema.

monkeyOS also does not create central business concepts such as employees, stores, customers, products, suppliers, or financial records.

### Discover globally

Development roles may inspect database structure across schemas:

```text
tables
views
columns
types
relationships
comments
```

without receiving access to underlying rows.

For example:

```text
finance_dev

finance.*      → metadata + data
hr.*           → metadata only
ops.*          → metadata only
```

Metadata comes from PostgreSQL's actual catalogs rather than a manually maintained monkeyOS catalog.

### Share explicitly

When another domain already owns information, reuse it through narrow contracts:

```text
views
functions / RPC
APIs
```

Cross-domain writes use explicit operations controlled by the source domain rather than broad write access.

> **Use the simplest relational model that preserves business meaning and integrity.**

---

# 20. Shared and External Databases

Applications may also need to consume databases that are **not owned by the app**, including:

```text
shared reporting databases
data warehouses
legacy systems
ERP databases
vendor-managed databases
partner systems
other external databases
```

These are treated as explicit external dependencies.

The default contract is:

> **Application-owned data is read/write. Shared or external databases are read-only unless there is a deliberate exception.**

For example:

```text
finance app
├── finance schema
│   → read/write
│
├── reporting database
│   → read-only
│
└── ERP database
    → read-only
```

Read-only access should be enforced by the source database or external system wherever technically possible, rather than relying on application behavior.

The application must not run migrations or attempt to take ownership of these databases.

---

# 21. External Data Sources in Development

monkeyOS guarantees reproducibility for **application-owned state**.

It does **not** require a local clone or development equivalent of every external database.

That would be unrealistic for systems that may be:

- large
- legacy
- vendor-managed
- shared across many applications
- outside the organization's control

Therefore local development may look like:

```text
Local application
├── local Supabase
│   → app-owned state
│
├── shared reporting DB
│   → remote, read-only
│
└── external ERP
    → remote, read-only
```

The same external source may sometimes be used by both development and production if no separate environment exists and the security/privacy model permits it.

The rule is:

> **Own data is local-first. External systems remain external and may be accessed remotely during development with least-privilege credentials.**

Production data from the application's own schema is still never the normal local-development source.

---

# 22. External Data Dependencies Are Explicit

Each app's README should state which external/shared data sources it consumes and what they are used for.

The application may also maintain a lightweight, non-secret declaration of required connection names, for example:

```text
ERP_DATABASE_URL
REPORTING_DATABASE_URL
```

This declaration exists to support:

```text
documentation
startup validation
tests
agent understanding
provisioning
```

It is **not** a monkeyOS registry and contains no secret values.

---

# 23. Development vs Production Secrets

monkeyOS deliberately separates development and production credentials.

```text
DEVELOPMENT
→ credentials available to authorized developer
→ stored locally using Bun.secrets

PRODUCTION
→ GitHub production environment secrets
→ never distributed to developer
```

For example:

```text
Development
ERP_DATABASE_URL
REPORTING_DATABASE_URL
→ Bun.secrets

Production
ERP_DATABASE_URL
REPORTING_DATABASE_URL
→ GitHub production environment
```

A developer may need a read-only development credential for a shared or external database.

The Platform Team provides that credential to the developer once through an appropriate secure channel.

The developer stores it locally using the monkeyOS `add secret` flow.

Production credentials are never provided to developers.

---

# 24. Bun.secrets for Local Secret Storage

Sensitive local development credentials are stored through **Bun.secrets**, using the operating system's secure credential storage rather than plaintext `.env` files.

Conceptually:

```text
Platform Team
↓
development credential
↓
add development secret
↓
Bun.secrets
↓
OS credential store
```

Secrets should be namespaced by organization and repository so that applications do not collide.

Conceptually:

```text
monkeyOS:<organization>/<repository>

ERP_DATABASE_URL
REPORTING_DATABASE_URL
```

The developer experience should be:

```text
Missing development secret: ERP_DATABASE_URL

Ask the Platform Team for the development credential, then run:

add development secret ERP_DATABASE_URL
```

The command securely prompts for the value and stores it without:

```text
printing it
putting it into Git
putting it into shell history
putting it into README/AGENTS.md
```

---

# 25. One Typed Configuration Wrapper

Application code should **not** call Bun.secrets directly throughout the codebase.

monkeyOS provides a small typed configuration wrapper.

Conceptually:

```text
Development
Bun.secrets
      ↓

Production
process environment
      ↓

Tests
explicit test configuration
      ↓
      └────→ one typed config layer
                    ↓
             application code
```

Application code simply consumes something like:

```text
config.ERP_DATABASE_URL
config.REPORTING_DATABASE_URL
```

The wrapper resolves the value according to environment:

```text
development → Bun.secrets
production  → process environment
tests       → explicit test values
```

Zod validates the resolved configuration at startup.

The application should fail fast with a useful error if a required value is missing or malformed.

This keeps business code independent of secret-storage mechanics.

---

# 26. Secret Classification

Not every configuration value is a secret.

The convention is:

```text
Non-sensitive configuration
→ normal environment/config values

Sensitive local development values
→ Bun.secrets

Sensitive production values
→ GitHub production environment secrets
```

Examples of non-sensitive organization configuration may include:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
APPS_BASE_DOMAIN
```

depending on the specific service semantics.

Secrets include database passwords, private API keys, tokens, and equivalent credentials.

---

# 27. Shared Database Security Rules

Shared/external database access should follow these defaults:

```text
read-only by default
least privilege
only required databases/schemas/tables where possible
no DDL
no migrations
no ownership
separate development and production credentials where possible
```

Where a source system supports individual identities, SSO, or short-lived authentication, prefer those.

Where it only supports a shared database account, create the narrowest app/development-specific read-only account practical.

For example:

```text
finance_dev_reporting_ro
```

rather than one organization-wide unrestricted credential.

External/shared database access is a dependency, not ownership.

---

# 28. Supabase & Database Security

One Supabase project represents the shared production environment/trust boundary rather than one application.

Shared:

```text
Supabase Auth
```

Application-owned:

```text
finance.*
hr.*
ops.*
```

A developer role such as:

```text
finance_dev
```

gets its own-schema development access, structural metadata discovery, and explicit cross-domain contracts.

A runtime role such as:

```text
finance_runtime
```

gets only required own-schema access and explicit runtime contracts, with no DDL or global metadata discovery.

Applications never receive broad credentials such as `postgres`, project owner, or `service_role`.

Security defaults are fail-closed:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

SQL migrations are canonical.

No ORM.

---

# 29. Local Development & Test Data

Local development requires approximately:

```text
compatible coding agent
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

It does not require Terraform, Kamal, cloud CLIs, production SSH, production database credentials, or Cloudflare tooling.

Each app runs its **own state** against local Supabase:

```text
Application
    ↓
Local Supabase
    ├── Postgres
    ├── Auth
    ├── Data API
    └── synthetic test data
```

Every application must be usable locally without production data from its own domain.

### Baseline seed

Each repository contains deterministic baseline data, typically via:

```text
supabase/seed.sql
```

It establishes:

```text
local Auth users
application memberships
representative business records
important edge cases
```

For example:

```text
admin@example.local
→ admin

member@example.local
→ member

nonmember@example.local
→ valid identity, no app membership
```

### Test fixtures

Automated tests may create separate scenario-specific fixtures.

### External-source tests

Where an external source is remote and cannot reasonably be reproduced locally, automated tests should isolate application behavior using the narrowest practical contract/fixture rather than cloning the entire external database.

The purpose is to test monkeyOS application behavior, not recreate third-party infrastructure.

---

# 30. `start app`

The central `start` skill performs approximately:

```text
check tools
↓
sync monkeyOS skills
↓
bun install
↓
validate required local secrets
↓
start local Supabase
↓
apply migrations
↓
create local Auth users
↓
seed memberships
↓
seed representative business data
↓
validate configured external/shared connections
↓
generate database types
↓
start application
↓
report local URL + test users + dependency status
```

For example:

```text
✓ Local Supabase ready
✓ Reporting database available
✓ ERP database available
✓ Application started

App: http://localhost:5173
```

Secret values are never displayed.

---

# 31. Standard Application Stack

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

No routine server-data fetching through `useEffect`.

Avoid unnecessary manual memoization under React Compiler.

No central monkeyOS UI component framework.

---

# 32. Engineering & Review Philosophy

The engineering standard is:

> **SOLID and clean, but simple.**

Avoid both under-engineering:

```text
giant components
duplicated business logic
untyped data
hidden side effects
ad-hoc state
```

and over-engineering:

```text
speculative abstractions
unnecessary factories/interfaces
premature extensibility
deep indirection
frameworks without concrete need
```

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

Review findings are:

```text
BLOCKING
IMPORTANT
SUGGESTION
```

No commit proceeds with blocking findings.

Security review includes:

```text
authentication
authorization
membership
RLS
schema boundaries
cross-domain access
external database access
audit coverage
PII
test-data privacy
local secret handling
production secret isolation
validation
injection
dependencies
frontend security
container security
```

---

# 33. `commit`

The central `commit` skill performs:

```text
inspect change
↓
classify change
↓
update CHANGELOG/version where appropriate
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

This makes quality review part of the development loop rather than something that happens only after code reaches GitHub.

---

# 34. Continuous Integration

Application CI is a thin caller to central monkeyOS CI.

The central workflow performs:

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
audit tests
↓
seed/test-data validation
↓
configuration-schema validation
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

CI verifies that application code does not depend on local-only secret mechanics in production.

It also validates changelog/version consistency.

> **Agent reasoning provides contextual review; CI provides deterministic verification.**

Successful CI produces an immutable artifact:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

It is built once, tested once, security checked once, and deployed unchanged.

---

# 35. GitHub Is the Platform Control Plane

GitHub owns the state it is already good at:

```text
source
CI state
workflow definitions
deployment approvals
deployment history
organization variables
organization secrets
production environment secrets
GHCR
scheduled audits
```

monkeyOS does not mirror this information into another database.

---

# 36. Infrastructure Provisioning with Terraform

All infrastructure provisioning is contained in:

```text
<organization>/monkeyos-platform
```

Terraform owns the **infrastructure lifecycle**:

```text
network
subnet
routing
firewall / security rules
runtime hosts
host bootstrap
infrastructure state
```

Kamal owns the **application lifecycle**.

A normal application deployment never runs Terraform.

### Supported clouds

V1 supports:

```text
AWS
Azure
GCP
```

Each provider uses native infrastructure primitives while exposing the same logical monkeyOS runtime contract:

```text
production/default
├── app-prod-01
└── app-prod-02
```

Each host is Linux, Docker-capable, reachable by trusted deployment, capable of reaching Supabase/external services, and capable of receiving approved application traffic.

> **Compute portability comes from a stable runtime contract, not from pretending AWS, Azure, and GCP are identical.**

### Repository structure

Conceptually:

```text
monkeyos-platform/
└── terraform/
    ├── modules/
    │   └── app-server-pool/
    │       ├── aws/
    │       ├── azure/
    │       └── gcp/
    │
    └── environments/
        └── production/
            ├── aws/
            ├── azure/
            └── gcp/
```

Provider implementations remain separate rather than creating an over-engineered universal cloud abstraction.

### Dedicated runtime network

Terraform provisions:

```text
monkeyOS production network
├── VPC / VNet
├── application subnet
├── routing / internet egress
├── firewall / security rules
├── app-prod-01
└── app-prod-02
```

V1 intentionally uses:

```text
1 dedicated network
1 application subnet
2 interchangeable hosts
```

No per-app subnets, Kubernetes, service mesh, complex peering, or multi-tier orchestration are required.

### Provider implementations

AWS uses native VPC/subnet/routing/security-group/EC2 primitives.

Azure uses native VNet/subnet/routing/NSG/NIC/VM primitives.

GCP uses native VPC/subnet/routing/firewall/Compute Engine primitives.

They need not be internally identical; they must produce the same runtime contract.

### Network policy

Runtime hosts receive only necessary connectivity:

```text
inbound application traffic
inbound trusted deployment SSH
outbound GHCR/image access
outbound Supabase access
outbound configured shared/external database access
outbound required external services
OS/package updates
```

Everything else should be denied or avoided by default.

### Inputs & outputs

Provider implementations expose roughly consistent inputs:

```text
region
instance size/type
instance count       # default 2
SSH public key
network CIDR
subnet CIDR
allowed ingress
tags / labels
```

Outputs include:

```text
runtime hosts
network ID
subnet ID
public/origin addresses
region
```

Provisioning uses the host output to establish shared platform configuration such as:

```text
PROD_DEFAULT_HOSTS
```

### Terraform state

Terraform state remains in an appropriate remote Terraform backend.

It does not live in Supabase or a monkeyOS database.

### Availability & vertical scaling

Infrastructure maintenance happens one host at a time:

```text
drain prod-01
↓
resize / replace / maintain
↓
verify
↓
restore

drain prod-02
↓
resize / replace / maintain
↓
verify
↓
restore
```

Cloudflare keeps traffic on the healthy host.

Vertical scaling remains the default V1 strategy.

> **Scale the small HA cell vertically before introducing placement or orchestration complexity.**

---

# 37. Runtime Architecture

The runtime pool is a **small HA cell**, not an application scheduler:

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

There is no:

```text
app → server registry
scheduler
placement algorithm
routing database
```

> **Any healthy host can serve any standard app in its pool.**

---

# 38. Cloudflare Front Door

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

Because every standard app exists on both hosts, there is no normal need for per-app DNS, per-app load balancers, a routing registry, or a Worker-based router.

---

# 39. Production Deployment

Deployment is:

```text
Application repo
      ↓
central CI
      ↓
immutable GHCR image
      ↓
deployment requested
      ↓
production authorization
      ↓
central monkeyOS workflow
      ↓
GitHub-hosted runner
      ↓
Kamal
      ↓
SSH
      ↓
prod-01 + prod-02
```

There is no dedicated Kamal server.

The application cannot choose:

```text
target hosts
runtime pool
domain
SSH target
Docker privileges
host mounts
arbitrary deployment flags
```

The effective platform API is:

```text
deploy_this_repository()
```

---

# 40. Deployment Security

Authorization and execution are separate:

```text
AUTHORIZATION
→ GitHub production environment
→ authorized Deployer

EXECUTION
→ central monkeyOS workflow
→ Kamal
```

The trusted sequence is:

```text
verify successful CI
↓
verify immutable artifact
↓
receive production authorization
↓
load production secrets / SSH
↓
generate trusted temporary Kamal configuration
↓
deploy
```

No arbitrary app-controlled scripts execute after privileged deployment credentials are loaded.

Production credentials are never exposed to local development.

Application Owners control their image, not the host.

---

# 41. Secrets & Configuration Summary

The canonical split is:

```text
Organization-wide non-secret configuration
→ GitHub organization variables

Shared production secrets
→ GitHub organization secrets where appropriate

App-specific production secrets
→ protected GitHub production environment

Local development secrets
→ Bun.secrets / OS credential store

Application code
→ one typed configuration wrapper
```

Developers should not manage production secret values.

The Platform Team may provide authorized development credentials for external/shared services when required.

The `add secret` skill handles secure local storage.

The `start` skill validates that everything required is available without printing values.

---

# 42. Continuous Repository Security

Security operates at two levels:

```text
change level
+
scheduled repository level
```

Scheduled AI audits run:

```text
GitHub Actions
↓
central monkeyOS workflow
↓
Pi
↓
central security/review skills
```

They ask:

> **Would we still consider this application secure and maintainable if we built it today?**

They check dependencies, authentication, authorization, external access, RLS, audit coverage, data ownership, PII, local and production secret handling, frontend/API security, containers, GitHub Actions, deployment, and missing important tests.

The objective is material risk reduction, not style-only churn.

---

# 43. Standard Application Scaffold Guarantee

Every new monkeyOS app starts with:

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
✓ Access page
✓ exact-email user addition
✓ role changes
✓ access removal
✓ RLS-backed authorization

✓ <app>.audit_log
✓ membership-change auditing
✓ business audit mechanism

✓ local Supabase
✓ deterministic synthetic seed data
✓ local admin/member/non-member users
✓ representative business records
✓ important edge cases
✓ reproducible local reset
✓ no production-data dependency for owned state

✓ support for declared read-only shared/external databases
✓ Bun.secrets local credential storage
✓ typed configuration wrapper
✓ secure add-secret flow
✓ production credentials isolated in GitHub environments

✓ responsive application shell
✓ tests
✓ code-review loop
✓ security-review loop
✓ central CI
✓ immutable GHCR artifact
✓ explicit protected production deployment
```

It does **not** require:

```text
central monkeyOS database
platform business schema
central user directory
central membership store
central audit store
central data catalog
central application registry
central deployment state
local clones of every external database
production credentials for developers
```

---

# 44. Organization Platform Guarantee

A monkeyOS organization installation provides:

```text
✓ monkeyos-platform repository
✓ reusable central workflows
✓ centrally managed skills
✓ Pi configuration
✓ application provisioning tooling

✓ AWS Terraform
✓ Azure Terraform
✓ GCP Terraform
✓ dedicated runtime network
✓ application subnet
✓ firewall/security rules
✓ two-host HA pool
✓ Docker-ready Linux hosts
✓ Terraform remote state

✓ Cloudflare wildcard ingress
✓ shared Supabase environment
✓ GitHub organization controls
✓ Contributor / Deployer separation
✓ protected production environments
✓ protected production credentials
```

---

# 45. New Application Provisioning

Once the organization platform exists:

```text
Platform Team creates repository
↓
repository identity derives application identity
↓
create app schema + roles
↓
configure production environment
↓
configure Deployers
↓
make requester initial application admin
↓
configure required external/shared data sources
↓
provide authorized development credentials if needed
↓
configure production credentials separately
↓
apply standard GitHub controls
↓
grant Contributors access
↓
ready
```

No Terraform change is normally required for a new application.

After this, application development is self-service.

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
        ┌──────────────────┴─────────────────┐
        │                                    │
 monkeyos-platform                     shared services
        │                                    │
 ├── workflows                         Supabase
 ├── skills                            Cloudflare
 ├── provisioning                      GitHub
 └── terraform
        │
   AWS / Azure / GCP
        │
        ▼
 dedicated runtime network
        │
    app subnet
        │
   ┌────┴────┐
   ▼         ▼
prod-01    prod-02
```

Application data:

```text
Application
├── own Supabase schema
│   → read/write
│
├── shared/internal DB
│   → read-only
│
└── external/vendor DB
    → read-only
```

Development secrets:

```text
Platform Team
     ↓
development credential
     ↓
add development secret
     ↓
Bun.secrets
     ↓
OS credential store
     ↓
typed config wrapper
     ↓
local app
```

Production secrets:

```text
GitHub production environment
          ↓
trusted deployment/runtime
          ↓
typed config wrapper
          ↓
production app
```

Application lifecycle:

```text
Contributor
    ↓
Application repo
    ↓
build / commit
    ↓
central CI
    ↓
immutable artifact
    ↓
Deployer authorization
    ↓
central deployment
    ↓
Kamal
    ↓
prod-01 + prod-02
```

Data architecture:

```text
             Supabase Auth
             shared identity
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
       finance     hr      ops
          │
          ├── members
          ├── audit_log
          └── business data

          NO CENTRAL
       monkeyOS DATABASE
```

---

# Guiding Principles

> **monkeyOS is a portable application platform installable into any GitHub organization.**

> **The repository is the application; convention replaces unnecessary configuration.**

> **monkeyOS has no central application-state database. State stays with the system that naturally owns it.**

> **Contributors develop applications; Deployers authorize production promotion; Platform Admins control the platform and infrastructure.**

> **Authentication is shared; application authorization is local and enforced by RLS.**

> **Changes that matter to the business are audited by the application that owns them.**

> **Own locally. Discover globally. Share explicitly.**

> **Application-owned state is reproducible locally. External systems remain external and do not need local replicas.**

> **External/shared database access is explicit, least-privilege, and read-only by default.**

> **Development and production credentials are intentionally separated. Developers receive only authorized development credentials; production credentials remain inside protected GitHub environments.**

> **Sensitive local development credentials live in Bun.secrets rather than plaintext project files.**

> **Application code accesses configuration through one typed wrapper and does not care whether a secret came from Bun.secrets, the production environment, or a test fixture.**

> **Developer-side coding agents are interchangeable; AI inside GitHub Actions uses Pi.**

> **Central workflows and skills let platform improvements propagate across applications.**

> **Every meaningful change receives testing, independent code review, security review, and deterministic CI verification.**

> **`main` is source; production is an explicit, authorized promotion of an immutable tested artifact.**

> **Terraform owns the infrastructure lifecycle; Kamal owns the application lifecycle.**

> **Terraform provisions the entire runtime foundation—network, security, and hosts—not merely VMs.**

> **AWS, Azure, and GCP use their native primitives but expose the same small monkeyOS runtime contract.**

> **The runtime is a small HA cell of interchangeable hosts, not a scheduler. Scale vertically before adding orchestration complexity.**

> **Keep monkeyOS deliberately simple and avoid creating platform-owned services, databases, registries, or abstractions until a concrete requirement justifies them.**
