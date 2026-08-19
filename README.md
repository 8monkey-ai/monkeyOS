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

A coding agent is expected to be the primary development interface, but monkeyOS is deliberately independent of any specific developer-side agent harness.

The standardized platform layer is:

```text
GitHub     → source, CI/CD, configuration, permissions, secrets, GHCR
Supabase   → Postgres + Auth
Cloudflare → DNS, TLS, CDN, load balancing
Terraform  → runtime infrastructure
Kamal      → application deployment
Pi         → AI execution inside GitHub Actions
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
├── BUSINESS.md
├── business/
│   └── skills/
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

A Contributor can develop the application:

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

For example:

```text
"deploy production"
↓
deployment requested
↓
awaiting authorized approval
```

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

This means improvements such as:

```text
new security scanner
better CI
dependency changes
Kamal improvements
deployment hardening
Pi updates
better repository audits
```

can propagate without editing every app.

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

The mechanism should remain deliberately simple: centrally managed plain files synchronized into application repositories.

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

For any change that affects business behavior, the agent reads `BUSINESS.md` and loads the relevant application-owned business skills before making the change.

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
- external data dependencies
- user-level deployment flow
- current application version
- where to find the Business Application Contract system and domain skills

Getting started should be approximately:

```text
1. Clone repository
2. Authenticate GitHub if needed
3. Open with preferred coding agent
4. Ask: "start app"
```

Before that, the Platform Team only needs to:

> **Create/provision the GitHub repo# 15. Business Application Contract System

A single business document is not enough for a complex operational application.

Every application therefore owns a layered Business Application Contract system:

```text
BUSINESS.md
business/
└── skills/
    ├── <business-domain>/
    │   ├── SKILL.md
    │   └── references/
    └── <business-process>/
        ├── SKILL.md
        └── references/
```

For example:

```text
BUSINESS.md
business/
└── skills/
    ├── work-order-lifecycle/
    ├── commissions/
    ├── inventory-costing/
    ├── warranty-handoffs/
    └── customer-data-retention/
```

These are application-owned business instructions. They are separate from centrally synchronized `.monkeyos/skills/`, which define shared platform and engineering workflows.

## `BUSINESS.md` — Business Front Door

`BUSINESS.md` is the business equivalent of a repository front door and routing layer.

It answers:

> **What business does this application support, which rules must it preserve, and where is the detailed domain guidance?**

It remains concise and records:

- application purpose, users, scope, and explicit out-of-scope boundaries
- named business, process, and data owners, including decision rights
- shared vocabulary, key entities, and authoritative identifiers
- application-wide business invariants
- a routing table describing which business skills apply to which changes
- the priority of business rules when sources appear to conflict
- open business decisions and assumptions requiring confirmation

It links to domain-specific business skills rather than duplicating their detailed rules.

## Application Business Skills

Each business skill covers one bounded domain, policy, or operational process.

Its `SKILL.md` defines:

- when the skill must be used
- purpose, scope, actors, roles, and operational permissions
- workflows, states, allowed transitions, handoffs, deadlines, and exception paths
- approval, separation-of-duty, correction, cancellation, reopening, and terminal-record rules
- master/reference-data ownership and change rules
- calculations, KPI definitions, rounding rules, and effective dates
- record classification, retention, archival, anonymization, audit, and export requirements
- external-system ownership, source-of-truth boundaries, reconciliation, and failure handling
- operating constraints such as sites, shared devices, peripherals, languages, time zones, and manual fallback
- acceptance scenarios and references needed to preserve the business behavior

A skill may keep supporting material in its own `references/` folder so agents load detailed knowledge only when the task requires it.

## Agent Behavior

For any change that may affect business behavior, the coding agent must:

```text
read BUSINESS.md
↓
identify affected business domains/processes
↓
load every relevant business skill
↓
preserve documented invariants
↓
surface contradictions or missing decisions
↓
update the contract, tests, and CHANGELOG when behavior changes
```

Business rules must not exist only in source code, UI behavior, issue discussions, or the memory of individual users.

For a simple application, `BUSINESS.md` may be sufficient initially. Business skills are added as soon as a bounded area develops enough rules, exceptions, ownership, or repeated work to benefit from its own context.

The README links to `BUSINESS.md`, and `AGENTS.md` instructs agents to load the relevant business skills before changing business behavior.

> **Every application has an application-owned Business Application Contract system: `BUSINESS.md` routes agents to modular business skills that define the rules the implementation must preserve.**

---

on Contract describing the business rules that its implementation must preserve.**

---

# 16. CHANGELOG & Versioning

Every application contains:

```text
CHANGELOG.md
```

The coding agent automatically maintains it.

It records meaningful user/business changes rather than implementation trivia:

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

Production can identify:

```text
Version   1.6.2
Commit    a83f72c
```

The Git SHA remains the immutable technical deployment identity.

---

# 17. Authentication & Application Access

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

# 18. Authorization Is Enforced by RLS

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

# 19. Business Audit Trails

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

# 20. Data Architecture & Governance

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

Metadata comes from PostgreSQL's actual catalogs rather than a manually maintained monkeyOS data catalog.

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

# 21. Supabase & Database Security

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

# 22. Local Development & Test Data

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

Each app runs against local Supabase:

```text
Application
    ↓
Local Supabase
    ├── Postgres
    ├── Auth
    ├── Data API
    └── synthetic test data
```

Every application must be fully usable locally without production data.

### Baseline seed

Each repository contains deterministic baseline data, typically through:

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

Automated tests may create separate scenario-specific fixtures:

```text
Bun tests
→ targeted fixtures

Playwright
→ E2E setup/reset
```

### Data ownership still applies locally

```text
finance test data → finance schema
hr test data      → hr schema
```

If an app consumes a cross-domain contract, local development provides a representative version of that contract rather than copying the source domain's entire model.

Production snapshots are not copied locally by default.

Any exceptional production-like dataset must be sanitized, appropriately anonymized, minimized, and free of production secrets.

Local state is disposable and reproducible.

---

# 23. `start app`

The central `start` skill performs approximately:

```text
check tools
↓
sync monkeyOS skills
↓
bun install
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
generate database types
↓
start application
↓
report local URL + test users
```

The result should be a working application immediately.

---

# 24. Standard Application Stack

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

# 25. Engineering & Review Philosophy

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

Review findings are classified as:

```text
BLOCKING
IMPORTANT
SUGGESTION
```

No commit proceeds with blocking findings.

Security review covers authentication, authorization, RLS, schema boundaries, cross-domain access, audit coverage, PII, test-data privacy, validation, injection, secrets, dependencies, frontend security, uploads, and container security.

---

# 26. `commit`

The central `commit` skill performs:

```text
inspect change
↓
classify change
↓
load relevant business skills
↓
update BUSINESS.md / business skills where business behavior changed
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

# 27. Continuous Integration

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

CI also verifies migrations from scratch and version/changelog consistency.

> **Agent reasoning provides contextual review; CI provides deterministic verification.**

Successful CI produces an immutable artifact:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

It is:

```text
built once
tested once
security checked once
deployed unchanged
```

---

# 28. GitHub Is the Platform Control Plane

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

# 29. Infrastructure Provisioning with Terraform

All infrastructure provisioning is contained in the organization-level:

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

Each provider uses its native infrastructure primitives while exposing the same logical monkeyOS runtime contract:

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

Terraform provisions the complete runtime foundation:

```text
monkeyOS production network
├── VPC / VNet
├── application subnet
├── routing / internet egress
├── firewall / security rules
├── app-prod-01
└── app-prod-02
```

monkeyOS does not rely on an arbitrary existing corporate network by default.

V1 intentionally uses:

```text
1 dedicated network
1 application subnet
2 interchangeable hosts
```

No per-app subnets, Kubernetes, service mesh, complex peering, or multi-tier orchestration are required.

### Native provider implementations

AWS uses approximately:

```text
VPC
subnet
route table
Internet Gateway / required egress
security group
EC2
SSH/bootstrap configuration
```

Azure uses approximately:

```text
VNet
subnet
routing
Network Security Group
NICs / public IPs where required
Linux VMs
SSH/bootstrap configuration
```

GCP uses approximately:

```text
VPC
subnet
routing / egress
firewall rules
Compute Engine
external/static IPs where required
SSH/bootstrap configuration
```

They need not be internally identical; they must produce the same monkeyOS runtime contract.

### Network policy

Runtime hosts receive only necessary connectivity:

```text
inbound application traffic
inbound trusted deployment SSH
outbound GHCR/image access
outbound Supabase access
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

Application repos never need the cloud-specific details.

### Terraform state

Terraform state remains in an appropriate remote Terraform backend.

It does not live in Supabase or a monkeyOS database.

> **Infrastructure state stays with Terraform's state system.**

### Infrastructure lifecycle

Infrastructure changes are relatively infrequent:

```text
create infrastructure
resize hosts
replace hosts
change networking
change firewall rules
```

Application changes are frequent.

Therefore:

```text
Terraform → infrastructure lifecycle
Kamal     → application lifecycle
```

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

# 30. Runtime Architecture

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

# 31. Cloudflare Front Door

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

Because every standard app exists on both hosts, there is no normal need for per-app DNS, per-app load balancers, a routing registry, or a Cloudflare Worker router.

---

# 32. Production Deployment

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

The effective platform API is simply:

```text
deploy_this_repository()
```

The central platform derives everything else.

---

# 33. Deployment Security

Authorization and execution are separate:

```text
AUTHORIZATION
→ GitHub production environment
→ authorized Deployer

EXECUTION
→ central monkeyOS workflow
→ Kamal
```

The trusted execution sequence is:

```text
verify successful CI
↓
verify immutable artifact
↓
receive production authorization
↓
load production SSH credential
↓
generate trusted temporary Kamal configuration
↓
deploy
```

No arbitrary app-controlled scripts execute after privileged deployment credentials are loaded.

Production SSH is never exposed to local development, normal CI, or application runtime.

Application Owners control their image, not the host.

They cannot request:

```text
privileged mode
Docker socket
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker flags
```

---

# 34. Secrets & Configuration

Platform configuration uses the systems that naturally own it.

Examples of GitHub organization variables:

```text
PROD_DEFAULT_HOSTS
PROD_SSH_USER
APPS_BASE_DOMAIN
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Shared sensitive values use organization secrets.

App-specific production secrets use that repository's protected `production` environment.

Terraform/cloud credentials remain platform-level credentials.

Production deployment credentials are available only to the trusted deployment path.

Secrets are never printed back to users or coding agents.

---

# 35. Continuous Repository Security

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

They check dependencies, authentication, authorization, RLS, audit coverage, data ownership, PII, test-data hygiene, secrets, frontend/API security, containers, GitHub Actions, deployment, and missing important tests.

The objective is to find material problems, not create style-only churn.

---

# 36. Standard Application Scaffold Guarantee

Every new monkeyOS app starts with:

```text
✓ README.md
✓ BUSINESS.md
✓ application-owned business skills where needed
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
✓ no production-data dependency

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
production data for development
```

---

# 37. Organization Platform Guarantee

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
✓ protected deployment credentials
```

---

# 38. New Application Provisioning

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

Local development:

```text
Application Repo
      ↓
start app
      ↓
Local Supabase
      ↓
migrations
      ↓
synthetic Auth users
      ↓
memberships
      ↓
representative business data
      ↓
fully usable local app
```

---

# Guiding Principles

> **monkeyOS is a portable application platform installable into any GitHub organization.**

> **The repository is the application; convention replaces unnecessary configuration.**

> **monkeyOS has no central application-state database. State stays with the system that naturally owns it.**

> **Contributors develop applications; Deployers authorize production promotion; Platform Admins control the platform and infrastructure. Repository write access never automatically grants production authority.**

> **Authentication is shared; application authorization is local and enforced by RLS.**

> **Changes that matter to the business are audited by the application that owns them.**

> **Every application has an application-owned Business Application Contract system: `BUSINESS.md` provides the business map and routing rules, while modular business skills preserve detailed domain and process knowledge.**

> **Own locally. Discover globally. Share explicitly.**

> **Every application is fully usable locally with deterministic synthetic test data and no dependency on production data.**

> **Developer-side coding agents are interchangeable; AI inside GitHub Actions uses Pi.**

> **Central workflows and skills let platform improvements propagate across applications.**

> **SOLID and clean, but simple: use the right abstractions without speculative architecture.**

> **Every meaningful change receives testing, independent code review, security review, and deterministic CI verification.**

> **`main` is source; production is an explicit, authorized promotion of an immutable tested artifact.**

> **Terraform owns the infrastructure lifecycle; Kamal owns the application lifecycle.**

> **Terraform provisions the entire runtime foundation—network, security, and hosts—not merely VMs.**

> **AWS, Azure, and GCP use their native primitives but expose the same small monkeyOS runtime contract.**

> **The runtime is a small HA cell of interchangeable hosts, not a scheduler. Scale vertically before adding orchestration complexity.**

> **Keep monkeyOS deliberately simple and avoid creating platform-owned services, databases, registries, or abstractions until a concrete requirement justifies them.**
