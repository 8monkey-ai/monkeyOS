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
Cloud IaC  → provider-native runtime infrastructure provisioning
Kamal      → application deployment
Pi         → AI execution inside GitHub Actions
Bun        → local runtime, tooling and secure local secret access
```

The underlying compute is portable across AWS, Azure, and GCP.

The goal is:

> **Make building applications extremely easy while keeping infrastructure, security, deployment, and data-governance boundaries strong.**

## Reference scaffolds

The canonical, independently publishable repository sources are maintained alongside this contract:

- [`scaffolds/monkeyos-app-template/`](scaffolds/monkeyos-app-template/) — generic application repository
- [`scaffolds/monkeyos-platform/`](scaffolds/monkeyos-platform/) — generic organization platform repository
- [`validation/VALIDATION_REPORT.md`](validation/VALIDATION_REPORT.md) — latest verification results and scope notes

The subdirectories are the development source of truth. Release automation may publish each one as its own repository; generated ZIP files are not maintained in Git.

---

# 2. Three-Layer Architecture

## Layer 1 — monkeyOS Distribution

The portable upstream platform contains:

```text
monkeyOS
├── organization installation tooling
├── application scaffold
├── platform scaffold
├── reusable workflows
├── shared skills
├── cloud infrastructure definitions
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
cloud infrastructure definitions
deployment implementation
Pi configuration
platform documentation
```

Organization-level configuration covers GitHub rulesets, shared variables/secrets, Supabase, Cloudflare, runtime infrastructure, and deployment credentials.

## Layer 3 — Application Repository

A standard application repository looks approximately like:

```text
finance/
├── README.md
├── BUSINESS.md
├── business/
│   └── skills/
│       └── <process-or-module>/
│           └── SKILL.md
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

cloud provider control plane
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

Application repositories do not contain runtime hosts, cloud resource IDs, Cloudflare configuration, production SSH, cloud infrastructure definitions, or Kamal host configuration.

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
cloud infrastructure provisioning
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

Central workflows use the current supported major channel for each GitHub Action, so compatible minor and patch releases are inherited automatically. Dependabot tracks action major releases and proposes reviewed compatibility updates.

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

GitHub Actions always invokes the latest published Pi coding-agent package. The organization configures the agent explicitly through non-secret `PI_PROVIDER` and `PI_MODEL` variables plus a protected `PI_API_KEY` secret. Central workflows pass the provider, model, and credential to Pi, fail closed when any is missing, and keep Pi in reviewed read-only mode for audits.

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

It contains enforceable application-relevant rules:

- required Bun, TypeScript, React, Supabase, and test stack
- official `shadcn@latest` CLI initialization and registry-generated standard component/shell composition
- SOLID-but-simple engineering standards
- server, local, shared-client, and URL state ownership
- business-contract loading and update rules
- RLS, Auth, audit, external-data, and secret boundaries
- compatible dependency and lockfile policy
- testing, review, security-review, changelog, and version gates
- centrally managed files that application work must not edit

It does not contain platform operational details such as cloud provisioning internals, production SSH, Cloudflare maintenance, Kamal internals, or runtime topology.

One platform rule is sufficient:

> **monkeyOS-managed files must not be modified as normal application code.**

For any change that affects business behavior, the agent reads `BUSINESS.md` and loads the relevant application-owned business skills before making the change.

`AGENTS.md` must be strong enough to guide ordinary implementation decisions without restating platform operations. Repository audits verify that its non-negotiable UI, business, data, security, dependency, and managed-file boundaries remain present.

---

# 14. README Is the Application Front Door

Every application has a useful top-level `README.md`.

No separate general-purpose documentation hierarchy should be required for ordinary development. The Business Application Contract system below is part of the standard application structure.

It explains:

- what the application does
- how to start it
- common monkeyOS commands
- login/access behavior
- data ownership
- external/shared data dependencies
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

Before that, the Platform Team only needs to create/provision the GitHub repository and database setup.

If the app requires development credentials for shared/external systems, the README lists which secret names are required, but never their values.

---

# 15. Business Application Contract System

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

`BUSINESS.md` contains the application's overall business purpose and acts as the routing layer for its detailed business skills. It is not a detailed process specification.

It answers:

> **What business does this application support, which rules must it preserve, and where is the detailed domain guidance?**

It remains concise and records:

- application purpose, users, scope, and explicit out-of-scope boundaries
- named business, process, and data owners, including decision rights
- shared vocabulary, key entities, and authoritative identifiers
- application-wide business invariants
- an index of every business process and module, linked to its business skill
- a routing table describing which business skills apply to which changes
- the priority of business rules when sources appear to conflict
- application-level open decisions and assumptions requiring confirmation

Detailed workflows, permissions, calculations, record rules, integrations, and exceptions do not belong in `BUSINESS.md`. They live in the relevant process or module skill.

## Application Business Skills

Every business process or module has its own skill from the beginning. Each skill covers one bounded capability, policy, or operational process.

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

## Process Evolution & Current Authority

Business skills are living definitions of the current authoritative process. They are not an accumulating archive of every process version.

Before creating a business skill, the agent must search `BUSINESS.md` and the existing `business/skills/` tree.

The rules are:

- if an existing process or module is changing, update its existing skill in place
- create a new skill only for a genuinely new, independently bounded process or module
- do not create parallel variants such as `returns-v2`, `returns-new`, or date-suffixed copies to avoid updating the authoritative skill
- when a process is split, merged, renamed, or retired, update `BUSINESS.md` routing, affected references, and superseded skills in the same change
- ensure there is one clear authoritative instruction path for each current process
- update affected tests and the CHANGELOG together with the business skill and implementation
- leave no active skill or reference describing behavior that the application no longer follows

Git preserves historical process versions. The Business Application Contract system preserves current business truth.

Repository audits should detect business skills that are unreferenced, overlapping, contradictory, stale, or duplicated.

> **Business process evolution updates the existing authoritative skill. New skills represent new processes or modules, not new versions of existing ones.**

Business rules must not exist only in source code, UI behavior, issue discussions, or the memory of individual users.

An application never relies on `BUSINESS.md` alone for process knowledge. The generic scaffold starts with an `application-definition` skill that explicitly records that no business domain has yet been approved; it must not invent placeholder business tables, records, routes, or CRUD. Before the first real module is implemented, its named owners, rules, and acceptance scenarios are captured in a routed authoritative skill. The definition skill is retired once real skills fully own the routing.

The README links to `BUSINESS.md`, and `AGENTS.md` instructs agents to load the relevant business skills before changing business behavior.

> **Every application has an application-owned Business Application Contract system: `BUSINESS.md` states the overall purpose and routes agents, while every business process or module has its own skill from the beginning.**

---

# 16. CHANGELOG & Versioning

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

# 21. Shared and External Databases

Applications may consume databases that are not owned by the app, including:

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

Read-only access should be enforced by the source database or system wherever technically possible.

The application must not run migrations or attempt to take ownership of these databases.

---

# 22. External Data Sources in Development

monkeyOS guarantees reproducibility for application-owned state.

It does not require a local clone or development equivalent of every external database.

Local development may therefore look like:

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

The same external source may sometimes be used by development and production if no separate environment exists and the security/privacy model permits it.

The rule is:

> **Own data is local-first. External systems remain external and may be accessed remotely during development with least-privilege credentials.**

---

# 23. External Data Dependencies Are Explicit

Each app's README should state which external/shared data sources it consumes and why.

The application may maintain a lightweight non-secret declaration of required connection names, for example:

```text
ERP_DATABASE_URL
REPORTING_DATABASE_URL
```

This supports documentation, startup validation, tests, agent understanding, and provisioning.

It is not a monkeyOS registry and contains no secret values.

---

# 24. Development vs Production Secrets

monkeyOS separates development and production credentials:

```text
DEVELOPMENT
→ credential available to authorized developer
→ stored locally using Bun.secrets

PRODUCTION
→ GitHub production environment secrets
→ never distributed to developer
```

The Platform Team provides required development credentials once.

Production credentials remain inside GitHub.

---

# 25. Bun.secrets for Local Secret Storage

Sensitive local credentials are stored through **Bun.secrets**, backed by the OS credential store.

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

Secrets should be namespaced by organization + repository:

```text
monkeyOS:<organization>/<repository>

ERP_DATABASE_URL
REPORTING_DATABASE_URL
```

The value must never be printed, committed, or placed into shell history.

---

# 26. One Typed Configuration Wrapper

Application code should not call Bun.secrets directly throughout the codebase.

monkeyOS provides one typed configuration layer:

```text
Development
Bun.secrets
      ↓

Production
process environment
      ↓

Tests
explicit test values
      ↓
      └────→ typed config wrapper
                    ↓
             application code
```

Zod validates configuration at startup.

The app fails fast if required configuration is missing or malformed.

---

# 27. Secret Classification

The convention is:

```text
Non-sensitive configuration
→ normal environment/config

Sensitive local development values
→ Bun.secrets

Sensitive production values
→ GitHub production environment secrets
```

Developers do not manage production secret values.

---

# 28. Shared Database Security Rules

Shared/external database access defaults to:

```text
read-only
least privilege
only required schemas/tables where possible
no DDL
no migrations
no ownership
separate dev/prod credentials where possible
```

Where individual identities, SSO, or short-lived credentials are supported, prefer them.

Otherwise use the narrowest practical app-specific read-only account.

External/shared database access is a dependency, not ownership.

---

# 29. Supabase & Database Security

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

A developer role such as `finance_dev` gets own-schema development access, structural metadata discovery, and explicit cross-domain contracts.

A runtime role such as `finance_runtime` gets only required own-schema access and explicit runtime contracts, with no DDL or global metadata discovery.

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

# 30. Local Development & Test Data

Local development requires approximately:

```text
compatible coding agent
Git
GitHub CLI
Bun
Supabase CLI
Docker-compatible runtime
```

It does not require cloud infrastructure tooling, Kamal, production SSH, production database credentials, or Cloudflare tooling.

Each app runs its owned state against local Supabase:

```text
Application
    ↓
Local Supabase
    ├── Postgres
    ├── Auth
    ├── Data API
    └── synthetic test data
```

Every app must be usable locally without production data from its own domain.

Baseline seed data provides:

```text
local Auth users
memberships
representative records for each real routed module, when present
important edge cases for those real modules
```

The generic scaffold has no placeholder business schema or records. Tests may add scenario-specific synthetic fixtures only for real routed modules.

External systems do not need to be cloned locally.

---

# 31. `start app`

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
seed representative data for real routed modules, when present
↓
validate configured external/shared connections
↓
generate database types
↓
start application
↓
report URL + test users + dependency status
```

Secret values are never displayed.

---

# 32. Standard Application Stack

```text
Package manager/tests    latest stable Bun
Application server      latest stable Bun
                         Bun.serve + React Router request handler
Language                 strict TypeScript

Frontend                 React 19
                         React Compiler
                         React Router Framework Mode
                         Vite

UI                       Tailwind
                         shadcn/ui as the primary component system
                         Base UI through shadcn components

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
Linting + type checking  oxlint with type-aware compiler diagnostics

Unit tests               Bun test
E2E                      Playwright
```

No routine server-data fetching through `useEffect`.

Every application uses ordinary React Router Framework Mode conventions: standard `react-router dev`, `react-router build`, and `react-router typegen` package scripts, `src/root.tsx`, `src/routes.ts`, route modules, and the generated server build. React Router owns browser bootstrapping, route code splitting, development HMR, server rendering, and production request dispatch. Project-level Bun configuration selects Bun for package CLIs. A small production adapter serves the generated assets and delegates application requests to React Router.

Bun is the JavaScript runtime, package manager, application server, and test runner. Package scripts name their tools normally, as they do in a newly generated project; `bunfig.toml` applies the runtime choice in one place. The Docker build resolves dependencies with Bun, builds the framework artifact once, and runs that exact artifact through the small Bun production adapter.

Each real module owns typed TanStack Query query/mutation hooks and stable query keys. Those hooks own routine Supabase access, Zod validation of untrusted mutation inputs, error propagation, and precise cache invalidation or updates after successful mutations. Pages and visual components consume the hooks instead of calling Supabase `.from()` or `.rpc()` directly. Client filtering and hidden controls are never authorization; PostgreSQL RLS remains authoritative.

Avoid unnecessary manual memoization under React Compiler.

Every app initializes `components.json` through the official `shadcn@latest init` CLI with the Base UI preset. Standard primitives and the application shell—including Sidebar, Button, Card, Dialog, Input, Select, Table, and Textarea—are installed or refreshed through `shadcn@latest add`; agents do not hand-write lookalikes for components available in the official registry. Generated registry source lives in `src/components/ui/`, while application composition lives outside that folder. Intentional generated-source adaptations must preserve accessibility, responsive behavior, slots, and theme tokens.

There is no central monkeyOS UI component framework and no parallel application-level primitive system competing with shadcn. Repository audits verify the official preset, CLI entry point, required generated registry files, and shell composition.

---

# 33. Engineering & Review Philosophy

The engineering standard is:

> **SOLID and clean, but simple.**

Avoid both under-engineering and speculative abstraction.

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

---

# 34. `commit`

The central `commit` skill performs:

```text
inspect change
↓
classify change
↓
load relevant business skills
↓
locate the authoritative existing process/module skill
↓
update it in place, or create a skill only for a genuinely new process/module
↓
update BUSINESS.md routing if the process/module structure changed
↓
update CHANGELOG/version where appropriate
↓
format
↓
lint
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

---

# 35. Continuous Integration

Application CI is a thin caller to central monkeyOS CI.

The central workflow performs:

```text
format
↓
lint
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
selected-architecture Docker build
↓
selected-architecture GHCR publish
```

CI also validates changelog/version consistency.

Successful CI produces:

```text
ghcr.io/<organization>/<repository>:<git-sha>
```

The image targets the organization-selected Linux runtime architecture. It is built once, tested once, security checked once, and deployed unchanged.

Application packages use compatible semantic-version ranges while `bun.lock` records the exact tested resolution. Native Dependabot support refreshes Bun packages, the moving Bun container base, and GitHub Actions through reviewed commits. Workflows install the latest stable Bun, current action major channels, and Pi `@latest`; runtime patch constants are not duplicated in scripts. A deployment never resolves dependencies or rebuilds; a dependency or toolchain refresh creates and validates a new immutable SHA artifact.

---

# 36. GitHub Is the Platform Control Plane

GitHub owns:

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

monkeyOS does not mirror this into another database.

---

# 37. Cloud-Native Infrastructure Provisioning

All infrastructure definitions live under:

```text
<organization>/monkeyos-platform/infrastructure/
```

V1 deliberately uses the cloud provider's native declarative infrastructure tooling rather than forcing one cross-cloud state system.

The structure is intentionally simple:

```text
monkeyos-platform/
└── infrastructure/
    ├── aws/
    ├── azure/
    └── gcp/
```

Each provider folder defines one standard production runtime pool.

Every template exposes host count, instance/VM type, boot-volume size/type, operating-system image, network/subnet names, and CIDR ranges as provider inputs rather than requiring edits to resource definitions. The default pool has two hosts, but any positive supported host count is valid.

The organization variable `RUNTIME_ARCH` selects `arm64` or `amd64` and defaults to `arm64`. `amd64` is the standard OCI architecture name for x86-64 processors from both AMD and Intel. The same value must drive provider compute/image defaults, the CI image platform, Kamal's builder architecture, deployment verification, and application production configuration. Changing it is a coordinated platform operation that provisions compatible hosts and publishes a newly tested immutable image; applications cannot override it.

## AWS

Use **CloudFormation**.

For example:

```text
infrastructure/aws/
└── template.yaml
```

CloudFormation manages the stack through AWS's own control plane.

No monkeyOS-managed Terraform state is required.

## Azure

Use **Bicep / ARM**.

For example:

```text
infrastructure/azure/
└── main.bicep
```

Azure Resource Manager owns the deployment/resource state.

No separate state file is required.

## GCP

Use **Google Cloud Infrastructure Manager with Terraform**.

For example:

```text
infrastructure/gcp/
└── main.tf
```

Infrastructure Manager owns deployment revisions and managed Terraform state in Google Cloud's control plane.

No monkeyOS-managed infrastructure state backend is required.

The implementation detail may differ from AWS/Azure.

The important rule is:

> **Cloud-specific infrastructure code may differ; the resulting runtime contract must remain the same.**

---

## 37.1 Runtime Contract

Every provider implementation must produce:

```text
production/default
├── app-prod-01
├── app-prod-02
└── ... app-prod-N
```

The host count is configurable and defaults to two. Each host must be:

```text
Linux matching RUNTIME_ARCH
Docker-capable
reachable by trusted deployment
able to reach Supabase
able to reach configured external services
able to receive approved application traffic
```

> **Compute portability comes from a stable runtime contract, not from pretending AWS, Azure, and GCP are identical.**

---

## 37.2 Dedicated Runtime Network

Each provider definition provisions the complete runtime foundation:

```text
monkeyOS production network
├── VPC / VNet
├── application subnet
├── routing / internet egress
├── firewall / security rules
└── configurable architecture-matched runtime hosts
```

V1 intentionally uses:

```text
1 dedicated network
1 application subnet
N interchangeable architecture-matched hosts (default 2)
```

No per-app subnets, Kubernetes, service mesh, complex peering, or multi-tier orchestration are required.

---

## 37.3 Native Provider Resources

AWS CloudFormation should create the required native resources such as:

```text
VPC
subnet
route table
Internet Gateway / egress
security groups
EC2 instances
SSH/bootstrap configuration
```

Azure Bicep should create:

```text
VNet
subnet
routing
Network Security Group
NICs / public IPs where required
Linux VMs
SSH/bootstrap configuration
```

GCP should use its native equivalents:

```text
VPC
subnet
routing / egress
firewall rules
Compute Engine
external/static IPs where required
SSH/bootstrap configuration
```

The source definitions do not need to look identical.

---

## 37.4 Network Policy

Runtime hosts receive only necessary connectivity:

```text
inbound application traffic
inbound trusted deployment SSH
outbound GHCR/image access
outbound Supabase access
outbound configured external/shared database access
outbound required external services
OS/package updates
```

Everything else should be denied or avoided by default.

---

## 37.5 Infrastructure State

monkeyOS does **not** maintain its own infrastructure-state database or state files.

Infrastructure state is owned by the cloud provider's control plane wherever practical:

```text
AWS
→ CloudFormation stack state

Azure
→ Azure Resource Manager deployment/resource state

GCP
→ Infrastructure Manager deployment revisions and managed Terraform state
```

The principle is:

> **Use the cloud provider as the source of truth for infrastructure whenever possible.**

This keeps monkeyOS from introducing another state system solely for a very small, rarely changing runtime footprint.

---

## 37.6 Infrastructure Lifecycle

Infrastructure changes are intentionally infrequent:

```text
initial provisioning
host resize
host replacement
network/security changes
```

Application changes are frequent.

Therefore:

```text
cloud-native IaC
→ infrastructure lifecycle

Kamal
→ application lifecycle
```

A normal app deployment never executes CloudFormation, Bicep, or other infrastructure provisioning.

---

## 37.7 Availability & Vertical Scaling

Infrastructure maintenance happens one host at a time:

```text
select one host from RUNTIME_HOST
↓
drain
↓
resize / replace / maintain
↓
verify
↓
restore
↓
repeat for the next host
```

Cloudflare keeps traffic on the healthy remainder of the pool. Maintenance never drains more capacity than the configured availability threshold permits.

Vertical scaling remains the default V1 strategy.

> **Scale the small HA cell vertically before introducing placement or orchestration complexity.**

---

# 38. Runtime Architecture

The runtime pool is a **small configurable HA cell**, not an application scheduler:

```text
production/default

├── app-prod-01
├── app-prod-02
└── ... app-prod-N
```

The protected GitHub environment variable `RUNTIME_HOST` contains the unique semicolon-separated hostname/IP list used by trusted deployment, for example:

```text
app-prod-01.example.com;app-prod-02.example.com;app-prod-03.example.com
```

Every standard app runs on every configured host. The protected `RUNTIME_ARCH` value selects the pool and image architecture (`arm64` by default, or `amd64` for AMD/Intel x86-64). The application cannot set or override `RUNTIME_HOST` or `RUNTIME_ARCH`.

There is no:

```text
app → server registry
scheduler
placement algorithm
routing database
```

> **Any healthy host can serve any standard app in its pool.**

---

# 39. Cloudflare Front Door

One wildcard Cloudflare Load Balancer fronts the complete `RUNTIME_HOST` pool:

```text
*.apps.company.com
        │
        ▼
   Cloudflare LB
        │
        ▼
 prod-01 ... prod-N
        │
        ▼
   kamal-proxy
```

Because every standard app exists on every configured host, there is no normal need for per-app DNS, per-app load balancers, a routing registry, or a Worker-based router.

---

# 40. Production Deployment

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
every host in RUNTIME_HOST
```

There is no dedicated Kamal server.

The application cannot choose:

```text
target hosts
runtime pool
runtime architecture
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

# 41. Deployment Security

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

# 42. Secrets & Configuration Summary

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

Developers do not manage production secret values.

The Platform Team may provide authorized development credentials for external/shared services when required.

The `add secret` skill handles secure local storage.

The `start` skill validates that everything required is available without printing values.

---

# 43. Continuous Repository Security

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

Repository audits also check that every process/module is routed from `BUSINESS.md` and that business skills are not unreferenced, overlapping, contradictory, stale, or duplicated as process versions.

They also reject invented placeholder business schema or CRUD and routine Supabase table/RPC access from pages or visual components. Real modules expose typed TanStack Query hooks with stable keys, validation, error propagation, and exact cache updates while RLS independently protects every operation.

The objective is material risk reduction, not style-only churn.

---

# 44. Standard Application Scaffold Guarantee

Every new monkeyOS app starts with:

```text
✓ README.md
✓ BUSINESS.md
✓ authoritative application-definition skill until the first real module
✓ application-owned business skill for every real process or module
✓ no invented placeholder business schema, records, routes, or CRUD
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
✓ representative records and edge cases for every real routed module
✓ reproducible local reset
✓ no production-data dependency for owned state

✓ support for declared read-only shared/external databases
✓ Bun.secrets local credential storage
✓ typed configuration wrapper
✓ secure add-secret flow
✓ production credentials isolated in GitHub environments

✓ components.json initialized by the official shadcn CLI with the Base UI preset
✓ official CLI-generated shadcn standard components
✓ responsive application shell composed from the CLI-generated shadcn Sidebar
✓ latest stable Bun runtime, package management, React Router server, and tests
✓ standard React Router Framework Mode without parallel app-owned server/build plumbing
✓ tests
✓ code-review loop
✓ security-review loop
✓ central CI
✓ immutable architecture-matched GHCR artifact
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

# 45. Organization Platform Guarantee

A monkeyOS organization installation provides:

```text
✓ monkeyos-platform repository
✓ reusable central workflows
✓ centrally managed skills
✓ latest Pi with configured provider/model/credential
✓ application provisioning tooling

✓ AWS CloudFormation
✓ Azure Bicep
✓ GCP Infrastructure Manager with Terraform
✓ dedicated runtime network
✓ application subnet
✓ firewall/security rules
✓ configurable HA host count, default two
✓ configurable network, architecture-aware compute/image, and volume inputs
✓ ARM64-default, AMD64-capable Docker-ready Linux hosts
✓ no monkeyOS-managed infrastructure state backend

✓ Cloudflare wildcard ingress
✓ shared Supabase environment
✓ GitHub organization controls
✓ Contributor / Deployer separation
✓ protected production environments
✓ protected production credentials
```

---

# 46. New Application Provisioning

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

No infrastructure change is normally required for a new application.

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
 └── infrastructure/
       ├── aws/       → CloudFormation
       ├── azure/     → Bicep
       └── gcp/       → Infrastructure Manager
        │
        ▼
 dedicated runtime network
        │
    app subnet
        │
        │
        ▼
 configurable architecture-matched host pool
 prod-01 ... prod-N
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
every host in RUNTIME_HOST
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

> **Every application has an application-owned Business Application Contract system: `BUSINESS.md` contains the overall purpose and business map, while every process or module is defined in its own business skill from the beginning.**

> **The generic scaffold invents no business domain. The first real module begins with named owners and an authoritative routed skill, then adds coherent schema, typed query hooks, RLS, audit, UI, and tests.**

> **Business skills describe current authoritative processes. Existing processes are updated in place; Git preserves history, and new skills are created only for genuinely new processes or modules.**

> **Own locally. Discover globally. Share explicitly.**

> **Application-owned state is reproducible locally. External systems remain external and do not need local replicas.**

> **External/shared database access is explicit, least-privilege, and read-only by default.**

> **Development and production credentials are intentionally separated. Developers receive only authorized development credentials; production credentials remain inside protected GitHub environments.**

> **Sensitive local development credentials live in Bun.secrets rather than plaintext project files.**

> **Application code accesses configuration through one typed wrapper and does not care whether a secret came from Bun.secrets, the production environment, or a test fixture.**

> **Developer-side coding agents are interchangeable; AI inside GitHub Actions uses the latest Pi with an explicitly configured provider, model, and protected credential.**

> **shadcn/ui is the primary application component system, including the shell. Initialize and add official Base UI registry components through `shadcn@latest`; do not hand-write approximations of available registry components.**

> **CI and containers use the latest stable Bun as the only JavaScript runtime; compatible dependency, base-image, and action releases are maintained through semantic ranges and Dependabot, and deployment always promotes the exact tested architecture-matched artifact.**

> **Central workflows and skills let platform improvements propagate across applications.**

> **Every meaningful change receives testing, independent code review, security review, and deterministic CI verification.**

> **`main` is source; production is an explicit, authorized promotion of an immutable tested artifact.**

> **Use provider-native declarative infrastructure tooling: CloudFormation on AWS, Bicep on Azure, and Infrastructure Manager with Terraform on GCP.**

> **Infrastructure state should remain with the cloud provider control plane wherever possible rather than introducing a monkeyOS-owned state backend.**

> **The provider implementations may differ; the monkeyOS runtime contract remains the same.**

> **Infrastructure provisioning owns the runtime foundation; Kamal owns the application lifecycle.**

> **The runtime is a small configurable HA cell of interchangeable architecture-matched hosts, not a scheduler. The protected semicolon-separated `RUNTIME_HOST` list defines the pool, while `RUNTIME_ARCH` selects `arm64` by default or `amd64` for AMD/Intel x86-64; scale vertically before adding orchestration complexity.**

> **Keep monkeyOS deliberately simple and avoid creating platform-owned services, databases, registries, or abstractions until a concrete requirement justifies them.**
