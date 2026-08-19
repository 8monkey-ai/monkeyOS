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
Supabase   → Postgres + Auth
Cloudflare → DNS, TLS, CDN, load balancing
Terraform  → runtime infrastructure provisioning
Kamal      → application deployment
Pi         → AI execution inside GitHub Actions
```

The underlying compute remains interchangeable:

```text
AWS
Azure
GCP
```

The goal is:

> **Make building applications extremely easy while keeping infrastructure, security and data-governance boundaries strong.**

---

# 2. Three-Layer Architecture

monkeyOS has three distinct layers.

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

The distribution contains no organization-specific assumptions such as:

- GitHub organization name
- application domain
- Supabase project
- cloud account/subscription/project
- cloud region
- runtime hosts
- credentials

---

## Layer 2 — Organization Installation

monkeyOS is installed once into a GitHub organization.

The organization gets a central repository:

```text
<organization>/monkeyos-platform
```

It owns the organization's canonical:

```text
reusable GitHub workflows
shared skills
application provisioning
Terraform infrastructure
deployment implementation
Pi configuration
platform documentation
```

Shared organization configuration also lives at this layer:

```text
GitHub organization variables
GitHub organization secrets
GitHub rulesets
Supabase environment
Cloudflare wildcard domain
Cloudflare load balancer
runtime infrastructure
production deployment credentials
```

---

## Layer 3 — Application Repository

An application repo contains primarily application concerns:

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

The workflows are thin callers into `monkeyos-platform`.

The monkeyOS skills are synchronized copies of centrally managed skills.

> **Application repositories contain application-specific decisions. Platform behavior is inherited centrally wherever technically possible.**

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

cloud provider / Terraform state
→ infrastructure state
```

A standard app never needs to query a monkeyOS database to operate.

---

# 4. Repository Identity Is Application Identity

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

Multi-word names normalize predictably:

```text
finance-reporting → finance_reporting
hr-onboarding     → hr_onboarding
ops-planning      → ops_planning
```

One normalization implementation should be reused everywhere.

Invalid or colliding names fail explicitly.

There is no separate application registry.

---

# 5. Convention Over Configuration

A standard application requires almost no platform configuration.

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

Application repos do not contain:

```text
runtime host lists
cloud resource IDs
Cloudflare configuration
production SSH
Kamal host configuration
Terraform configuration
```

Those belong to `monkeyos-platform`.

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

Production requires:

```text
deploy production
```

Branches remain optional collaboration tools.

---

# 7. Roles and Trust Boundary

## Application Owner

Normally receives GitHub **Write or Maintain**, never Admin.

Controls:

```text
application code
tests
SQL migrations
dependencies
Dockerfile
application behavior
```

Can commit and deploy their own app.

## Platform Admin

Controls:

```text
organization installation
central workflows
central skills
Terraform
GitHub rulesets
production environments
organization variables/secrets
deployment credentials
runtime infrastructure
Cloudflare
shared Supabase setup
```

The rule is:

> **Application Owners control what the application does. Platform Admins control where and how it runs.**

---

# 8. Developer-Side Harness Independence

Developers may use any compatible coding-agent harness.

```text
coding agent
    ↓
AGENTS.md
+
monkeyOS skills
    ↓
Git / gh / Bun / Supabase CLI
```

Skills describe behavior rather than vendor-specific commands.

For reviews:

> Perform an independent review and prefer a fresh reviewer context where supported.

monkeyOS standardizes interfaces and engineering behavior, not which agent is used.

---

# 9. Centralized Workflows

As much GitHub Actions logic as possible lives in:

```text
<organization>/monkeyos-platform
```

Application repos contain tiny callers:

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

Central changes can therefore propagate automatically across applications.

---

# 10. Workflow Compatibility Channels

Applications consume central workflows through a protected channel such as:

```text
@v1
```

The model:

```text
v1
→ backwards-compatible improvements
→ automatically inherited

v2
→ breaking platform contract
→ deliberate migration
```

Third-party Actions remain pinned where appropriate.

---

# 11. AI Inside GitHub Actions

Developer-side agents remain harness-independent.

Inside GitHub Actions:

> **Any AI-powered workflow uses Pi.**

Examples:

```text
repository audit
security review
architecture review
automated maintenance
```

Flow:

```text
Application Repo
      ↓
central workflow
      ↓
Pi
      ↓
central monkeyOS skill
```

Pi version, configuration and model access are owned centrally.

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

The sync mechanism stays deliberately simple: plain files from the central repo.

---

# 13. `AGENTS.md` Is Repository-Focused

`AGENTS.md` answers:

> **How should an agent safely modify this application?**

It contains:

- stack
- engineering rules
- state-management rules
- data rules
- security expectations
- testing expectations

It does not contain:

```text
Terraform internals
Kamal internals
production SSH details
Cloudflare maintenance
runtime topology
platform operations
```

One platform rule is enough:

> **monkeyOS-managed files must not be modified as normal application code.**

---

# 14. README Is the Application Front Door

Every application has a useful top-level:

```text
README.md
```

No separate docs directory should be necessary for ordinary app development.

It explains:

- what the app does
- how to start it
- common monkeyOS commands
- login/access behavior
- data ownership
- external data dependencies
- user-level deployment flow
- current version

Getting started:

```text
1. Clone repository
2. Authenticate GitHub if needed
3. Open with preferred coding agent
4. Ask: "start app"
```

If it has not yet been provisioned:

> **Provision this repository as a monkeyOS application.**

---

# 15. CHANGELOG and Versioning

Every app includes:

```text
CHANGELOG.md
```

The coding agent maintains it automatically.

It describes meaningful business/user changes.

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

CI checks changelog/version consistency.

---

# 16. Versioning Is Part of `commit`

The central commit skill:

```text
inspect change
↓
classify change
↓
if meaningful behavior changed:
    update CHANGELOG
    update version
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

Production exposes both:

```text
Version   1.6.2
Commit    a83f72c
```

Git SHA remains the immutable deployment identity.

---

# 17. Authentication Is Built In

Every app starts with working login:

```text
Login
 ↓
Supabase Auth
 ↓
app membership
 ↓
Application
```

Default behavior:

```text
not authenticated
→ login

authenticated + member
→ app

authenticated + non-member
→ access denied
```

Supabase Auth owns identity.

---

# 18. Every App Owns Its Membership

For Finance:

```text
auth.users
    ↓
finance.members
```

Standard membership table:

```text
user_id
role        admin | member
created_at
created_by
```

There is:

```text
no shared user directory
no central membership table
```

Each app includes an admin-only Access page.

Admins can:

```text
add existing Supabase user by exact email
change role
remove app access
```

---

# 19. User Lookup Is Narrow

Browser code does not get general access to `auth.users`.

Adding a user:

```text
exact email
↓
narrow privileged lookup
↓
matching Auth user
↓
insert into app.members
```

No directory browsing or replicated identity store.

The requester normally becomes the initial app admin.

> **Identity is shared. Authorization is local.**

---

# 20. Membership Is Enforced by RLS

Authorization lives in the database, not merely the UI.

```text
auth.uid()
↓
member?
↓
yes → permitted
no  → denied
```

Admin actions also validate role.

---

# 21. Business Audit Trails Are Built In

Every app owns its business audit history.

Example:

```text
finance.audit_log
```

Possible fields:

```text
timestamp
actor_user_id
action
entity
record_id
before
after
```

There is no global monkeyOS audit table.

> **Changes that matter to the business should be traceable.**

Membership changes are always audited.

Other examples:

```text
approvals
important status changes
financial changes
sensitive record changes
material permission changes
```

This remains a simple audit mechanism, not an event-sourcing framework.

---

# 22. No Central Platform Data Model

monkeyOS does not own business entities.

There are no central monkeyOS tables for:

```text
employees
customers
stores
products
suppliers
financial records
applications
memberships
audits
deployments
```

> **monkeyOS governs applications; it does not become another business domain.**

---

# 23. Data Architecture & Governance

The principle:

> **Own locally. Discover globally. Share explicitly.**

## Own locally

```text
Production Supabase
├── auth
├── finance
├── hr
├── ops
├── procurement
└── reporting
```

Each app owns its schema.

There is no central monkeyOS state schema.

## Discover globally

Development roles may inspect structure across schemas:

```text
tables
views
columns
types
relationships
comments
```

but not underlying rows.

For example:

```text
finance_dev

finance.*      → metadata + data
hr.*           → metadata only
ops.*          → metadata only
```

Metadata comes from actual PostgreSQL catalogs.

There is no manually maintained data catalog.

## Share explicitly

Cross-domain reads use narrow contracts such as:

```text
views
functions / RPC
APIs
```

Cross-domain writes use explicit operations owned by the source domain.

> **Use the simplest relational model that preserves business meaning and integrity.**

---

# 24. Supabase Architecture

One Supabase project represents an environment/trust boundary rather than one application.

Shared:

```text
Supabase Auth
```

Application owned:

```text
finance.*
hr.*
ops.*
```

One identity can therefore have different permissions across apps.

---

# 25. Database Roles

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

Never:

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
necessary own-schema access
explicit runtime contracts
no DDL
no global metadata discovery
```

---

# 26. Database Security Defaults

Fail closed:

```text
Data API                         ON
Automatically expose new tables OFF
Automatic RLS                   ON
```

New data requires explicit authorization/grants.

SQL migrations are canonical.

No ORM.

---

# 27. Local Development

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
Terraform
Kamal
AWS/Azure/GCP CLI
production SSH
production DB credentials
Cloudflare CLI
GitHub runner
GHCR credentials
```

Applications run against local Supabase.

---

# 28. Local Test Data Is First-Class

Every app is fully usable locally without production data.

```text
production
→ real production data

local
→ local Supabase
→ deterministic synthetic test data
```

Production data is not a development dependency.

---

# 29. Baseline Seed Data

Every repo contains deterministic baseline data, generally in:

```text
supabase/seed.sql
```

It provides:

```text
local Auth users
memberships
representative business data
important edge cases
```

Standard users could include:

```text
admin@example.local
→ admin

member@example.local
→ member

nonmember@example.local
→ Auth account but no membership
```

---

# 30. Test Fixtures

Automated tests can create scenario-specific fixtures separately from baseline seed data.

```text
Bun tests
→ targeted scenario fixtures

Playwright
→ E2E setup/reset
```

---

# 31. Test Data Follows Ownership

Test data follows the same domain boundaries as production.

```text
finance test data → finance schema
hr test data      → hr schema
```

If an app consumes a cross-domain contract, local development should expose a representative version of that contract rather than copying the entire source domain.

---

# 32. Production Data Is Exceptional in Development

Production snapshots are not copied locally by default.

If production-like data is genuinely necessary, it must be:

```text
sanitized
anonymized where appropriate
minimized
free of production secrets
```

---

# 33. `start app`

The start skill performs approximately:

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
create local users
↓
seed memberships
↓
seed business data
↓
generate DB types
↓
start app
↓
report URL + test users
```

Local state is disposable and reproducible.

---

# 34. Standard Application Stack

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

No normal server data fetching through `useEffect`.

Avoid unnecessary manual memoization under React Compiler.

No central monkeyOS component framework.

---

# 35. Engineering Philosophy

> **SOLID and clean, but simple.**

Avoid both:

```text
under-engineering
→ giant components, duplication, untyped data, hidden side effects

over-engineering
→ speculative abstractions, unnecessary factories, frameworks and indirection
```

Abstractions should solve concrete problems.

---

# 36. Review and Security Loop

Every meaningful change:

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

Security review includes:

```text
authentication
membership
authorization
RLS
schema boundaries
cross-domain access
audit coverage
PII
test-data privacy
validation
secrets
dependencies
browser security
container security
```

---

# 37. Continuous Integration

Application CI calls central monkeyOS CI.

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

It also validates version/changelog consistency.

> **Agent reasoning provides contextual review; CI provides deterministic verification.**

---

# 38. Immutable Artifacts

Successful CI produces:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

The artifact is:

```text
built once
tested once
security checked once
deployed unchanged
```

Production never rebuilds application source.

---

# 39. GitHub as Platform Control Plane

GitHub owns:

```text
source
CI state
workflows
deployment history
organization variables
organization secrets
production environment secrets
GHCR
scheduled audits
```

monkeyOS does not mirror any of this into a database.

---

# 40. Infrastructure Is Provisioned by Terraform

The organization-level:

```text
<organization>/monkeyos-platform
```

contains the Terraform used to provision the app-server runtime infrastructure.

Terraform owns the **infrastructure foundation**, not application deployment.

The boundary is:

> **Terraform provisions networks and hosts. Kamal deploys applications onto those hosts.**

---

# 41. Cloud Providers

V1 supports three infrastructure providers:

```text
AWS
Azure
GCP
```

The implementations may use native provider resources, but must expose the same monkeyOS runtime contract.

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

The exact repository structure may remain pragmatic, but provider implementations must remain clearly separated.

---

# 42. Compute Portability by Contract

monkeyOS does not pretend AWS, Azure and GCP are identical.

Each provider implementation can use the native resources best suited to it.

But all must produce the same logical outcome:

```text
production/default
├── app-prod-01
└── app-prod-02
```

Each host is:

```text
Linux
Docker capable
reachable by trusted deployment
capable of reaching Supabase/external services
capable of receiving approved application traffic
```

The principle is:

> **Compute is portable by contract, not by hiding useful cloud differences behind excessive abstraction.**

---

# 43. Terraform Owns the Runtime Network

Terraform does not merely create VMs.

It creates the complete dedicated network foundation for monkeyOS runtime compute.

Each installation gets approximately:

```text
monkeyOS production network
├── VPC / VNet
├── application subnet
├── routing / internet egress
├── firewall / security rules
├── app-prod-01
└── app-prod-02
```

The runtime pool is therefore a **self-contained networked infrastructure unit**.

monkeyOS should not rely on some arbitrary pre-existing corporate network by default.

That keeps installations portable and predictable.

---

# 44. AWS Infrastructure

AWS Terraform should provision the necessary native resources, approximately:

```text
VPC
├── subnet
├── route table
├── Internet Gateway / appropriate egress
├── security group
├── EC2 app-prod-01
└── EC2 app-prod-02
```

plus required:

```text
SSH keys/configuration
public/static IPs where required
base Linux configuration
Docker/bootstrap
resource tags
```

---

# 45. Azure Infrastructure

Azure Terraform should provision approximately:

```text
VNet
├── subnet
├── route configuration
├── Network Security Group
├── NIC / Public IP → app-prod-01
└── NIC / Public IP → app-prod-02
```

plus:

```text
Linux VMs
SSH configuration
Docker/bootstrap
resource tags
```

---

# 46. GCP Infrastructure

GCP Terraform should provision approximately:

```text
VPC
├── subnet
├── routes / internet egress
├── firewall rules
├── Compute Engine app-prod-01
└── Compute Engine app-prod-02
```

plus:

```text
external/static IPs where required
SSH configuration
Docker/bootstrap
resource labels
```

---

# 47. Runtime Network Policy

The network should follow a minimal-access model.

The app hosts require only what is necessary for:

```text
inbound application traffic
inbound trusted deployment SSH
outbound GHCR/image access
outbound Supabase connectivity
outbound required external services
OS/package updates
```

Everything else should be denied or avoided by default.

For V1, keep the topology simple:

```text
1 dedicated network
1 application subnet
2 interchangeable hosts
```

Do not introduce prematurely:

```text
per-app subnets
service mesh
complex VPC/VNet peering
internal orchestration networks
Kubernetes
multiple application tiers
```

---

# 48. Infrastructure Inputs and Outputs

The three provider implementations should expose approximately the same simple inputs:

```text
region
instance size/type
instance count      # default 2
SSH public key
network CIDR
subnet CIDR
allowed ingress settings
tags / labels
```

Outputs should include at least:

```text
runtime hosts
network ID
subnet ID
public/origin addresses
region
```

The provisioning workflow can use the runtime-host output to establish:

```text
PROD_DEFAULT_HOSTS
```

centrally.

No application repository needs to know anything about this.

---

# 49. Terraform State

Terraform state must not be stored in Supabase or any monkeyOS database.

Use an appropriate remote Terraform backend/provider-native state mechanism.

Conceptually:

```text
AWS deployment
→ standard remote Terraform state

Azure deployment
→ standard remote Terraform state

GCP deployment
→ standard remote Terraform state
```

The important rule is:

> **Infrastructure state stays with Terraform's state system, not monkeyOS application data.**

---

# 50. Infrastructure Provisioning Is Separate From App Deployment

Infrastructure provisioning is expected to be infrequent:

```text
create infrastructure
resize infrastructure
replace infrastructure
network maintenance
```

Application deployment is frequent:

```text
build feature
↓
commit
↓
deploy production
```

Therefore:

```text
Terraform
→ infrastructure lifecycle

Kamal
→ application lifecycle
```

A normal application deployment never runs Terraform.

---

# 51. Runtime Architecture

The runtime pool is a **small HA cell**, not an application scheduler.

Default:

```text
production/default

├── app-prod-01
└── app-prod-02
```

Every standard application runs on every host:

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

> **Any healthy host can serve any standard app in the pool.**

---

# 52. Cloudflare Front Door

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

Because every standard application runs on both hosts:

```text
no per-app DNS
no per-app load balancer
no routing registry
no Cloudflare Worker router
```

is required.

---

# 53. GitHub-Hosted Deployment

Deployment remains:

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
SSH
      ↓
runtime hosts
```

There is no dedicated Kamal server.

---

# 54. Production Deployment Contract

The app cannot choose:

```text
target host
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

The central workflow derives everything else.

---

# 55. Deployment Security

The trusted sequence:

```text
verify CI
↓
verify immutable GHCR artifact
↓
load deployment SSH
↓
generate trusted temporary Kamal config
↓
kamal deploy
```

No arbitrary app-controlled scripts execute after privileged deployment credentials are loaded.

Production SSH is never exposed to:

```text
local development
ordinary CI
application runtime
application source
```

---

# 56. Container Privilege Boundary

Application Owners control their image, not the host.

Applications cannot request:

```text
privileged mode
Docker socket
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker flags
```

These remain under monkeyOS control.

---

# 57. Availability, Maintenance and Vertical Scaling

Infrastructure changes happen one host at a time:

```text
drain prod-01
↓
maintain / resize / replace
↓
verify
↓
restore

drain prod-02
↓
maintain / resize / replace
↓
verify
↓
restore
```

Terraform can manage the infrastructure-side resize/replacement where appropriate.

Cloudflare keeps application traffic on the healthy host.

Vertical scaling remains the default V1 strategy.

> **Scale the small HA cell vertically before introducing placement or orchestration complexity.**

---

# 58. Secrets and Configuration

Examples of GitHub organization variables:

```text
PROD_DEFAULT_HOSTS
PROD_SSH_USER
APPS_BASE_DOMAIN
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

Shared platform secrets use GitHub organization secrets.

App-specific production secrets use each repository's `production` environment.

Infrastructure credentials required by Terraform are platform-level credentials and never belong to application repos.

No monkeyOS database mirrors any of this state.

---

# 59. Mobile and Testing

Every app supports:

```text
mobile
tablet
desktop
```

Tests cover:

```text
authentication
membership
access management
RLS
audit behavior
CRUD
permissions
test data
important error states
responsive layouts
```

Representative Playwright sizes:

```text
390 × 844
768 × 1024
1440 × 900
```

---

# 60. Continuous Repository Security

Security operates at two levels:

```text
change level
+
scheduled repository level
```

AI-enabled audits:

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

It checks material issues rather than generating style churn.

---

# 61. Standard Application Scaffold Guarantee

A new monkeyOS app starts with:

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
✓ remove access
✓ RLS-backed authorization

✓ <app>.audit_log
✓ membership-change auditing
✓ business audit mechanism

✓ local Supabase
✓ deterministic seed data
✓ local admin/member/non-member users
✓ representative business records
✓ edge cases
✓ reproducible local reset
✓ no production-data dependency

✓ responsive app shell
✓ tests
✓ review/security workflow
✓ central CI
✓ immutable GHCR artifact
✓ explicit production deployment
```

It does not require:

```text
central monkeyOS database
platform business schema
central user directory
central membership store
central audit store
central data catalog
central app registry
central deployment state
production data for development
```

---

# 62. Organization Platform Guarantee

A monkeyOS organization installation provides:

```text
✓ monkeyos-platform repo
✓ reusable central workflows
✓ centrally managed skills
✓ Pi configuration
✓ application provisioning tooling

✓ AWS Terraform implementation
✓ Azure Terraform implementation
✓ GCP Terraform implementation

✓ dedicated runtime network
✓ application subnet
✓ firewall/security rules
✓ two-host HA pool
✓ Docker-ready Linux hosts
✓ Terraform remote state
✓ runtime-host outputs

✓ Cloudflare wildcard ingress
✓ shared Supabase environment
✓ GitHub organization configuration
✓ protected deployment controls
```

---

# 63. New Organization Installation

Conceptually:

```text
install monkeyOS
↓
configure GitHub organization
↓
choose AWS / Azure / GCP
↓
configure Terraform backend
↓
apply Terraform
↓
create dedicated network
↓
create app subnet
↓
create 2-host runtime pool
↓
bootstrap Docker hosts
↓
configure Cloudflare wildcard LB
↓
publish PROD_DEFAULT_HOSTS
↓
configure Supabase
↓
monkeyOS ready
```

---

# 64. New Application Provisioning

Once the organization platform exists:

```text
create repo from scaffold
↓
provision repo as monkeyOS app
↓
derive schema/roles from repo
↓
configure production environment
↓
make requester initial admin
↓
apply standard controls
↓
grant Write/Maintain
```

No Terraform change should normally be required to create an application.

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
       ┌─────────────────────┴──────────────────────┐
       │                                            │
monkeyos-platform                              shared services
       │                                            │
├── workflows                                Supabase Auth
├── skills                                   Cloudflare
├── provisioning                             GitHub
└── terraform
       │
       ├──────── AWS
       ├──────── Azure
       └──────── GCP
                 │
                 ▼
           dedicated network
                 │
              app subnet
                 │
         ┌───────┴────────┐
         ▼                ▼
      prod-01          prod-02
         │                │
         └───────┬────────┘
                 │
              Docker
             Kamal Proxy


          APPLICATION REPOSITORY
                 │
      ┌──────────┼───────────┐
      │          │           │
     code     own schema   app shell
                 │        login/access
                 │        audit
                 │        README
                 │        changelog
                 │        local test data
                 │
                 ▼
              Supabase
```

Infrastructure lifecycle:

```text
monkeyos-platform
      ↓
Terraform
      ↓
AWS / Azure / GCP
      ↓
VPC/VNet
      ↓
Subnet + firewall
      ↓
2 × app hosts
```

Application lifecycle:

```text
Application repo
      ↓
central CI
      ↓
immutable GHCR image
      ↓
deploy production
      ↓
central deploy workflow
      ↓
Kamal
      ↓
prod-01 + prod-02
```

Ingress:

```text
Internet
   ↓
Cloudflare wildcard LB
   ↓
┌──────────────┐
▼              ▼
prod-01      prod-02
   ↓              ↓
kamal-proxy   kamal-proxy
```

Data:

```text
Supabase Auth
shared identity
      │
 ┌────┼─────┐
 ▼    ▼     ▼
finance hr  ops
  │
  ├── members
  ├── audit_log
  └── business data

NO CENTRAL monkeyOS DATABASE STATE
```

---

# Guiding Principles

> **monkeyOS is a portable application platform installable into any GitHub organization.**

> **monkeyOS has no central application-state database.**

> **State belongs to the system that naturally owns it: application state to applications, identity to Supabase Auth, configuration/deployment history to GitHub, routing to Cloudflare, infrastructure state to Terraform.**

> **The repository is the application, and repository identity determines database and deployment identity.**

> **Application repositories contain application concerns; platform behavior is inherited centrally wherever possible.**

> **Authentication is shared; authorization is local to each application.**

> **Changes that matter to the business are audited by the application that owns them.**

> **Every application is fully usable locally using deterministic synthetic test data without requiring production data.**

> **Own locally. Discover globally. Share explicitly.**

> **Metadata discovery reflects the actual PostgreSQL structure rather than a platform-maintained catalog.**

> **The README is the application's front door; the changelog and semantic version are maintained as part of normal development.**

> **Developer-side coding-agent usage is harness-independent; AI execution inside GitHub Actions uses Pi.**

> **Central workflows and skills allow improvements to propagate across applications.**

> **Terraform owns the runtime infrastructure lifecycle; Kamal owns the application deployment lifecycle.**

> **The app-server pool is provisioned as its own dedicated networked infrastructure unit.**

> **AWS, Azure and GCP implementations use native resources but expose the same monkeyOS runtime contract.**

> **Compute portability comes from a stable contract, not from pretending different clouds are identical.**

> **A runtime pool is a small HA cell of interchangeable hosts, not an application scheduler.**

> **Any healthy host can serve any standard application in its pool.**

> **Scale vertically before adding application placement or orchestration complexity.**

> **`main` is source; production is an explicit promotion of an immutable, already-tested artifact.**

> **Every meaningful change receives code review, security review and deterministic verification before becoming deployable.**

> **Keep monkeyOS deliberately simple and avoid creating platform-owned services or state unless a real requirement makes them unavoidable.**
