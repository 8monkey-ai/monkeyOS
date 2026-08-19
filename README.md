# Infinite Monkey Application Platform

## Overall Approach & Architecture — Canonical V1

## 1. Objective

The **Infinite Monkey Application Platform** is a self-service environment for business users and developers to build, test, review, secure and deploy production-ready applications primarily through Codex or Claude Code.

The intended user experience remains:

```text
start app
↓
build feature
↓
commit code
↓
deploy production
```

Users should not normally need to understand or operate:

- GitHub Actions
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
Cloudflare → DNS, TLS, CDN, edge/load balancing
Supabase   → Postgres + Auth
Kamal      → deployment
```

The underlying compute can remain Azure, AWS, GCP, Hetzner, bare metal or another Docker-capable environment.

---

# 2. Core Principles

### The repository is the application

```text
company/damaged-stock
```

automatically derives:

```text
app                damaged-stock
database schema    damaged_stock
container image    ghcr.io/company/damaged-stock:<sha>
production URL     damaged-stock.apps.company.com
```

There is no separate application registry.

### Convention over configuration

A standard app requires no:

- per-app infrastructure registration
- server mapping
- DNS configuration
- container registry setup
- Kamal configuration
- cloud provisioning
- central infrastructure repo change
- deployment-state entry

### `main` is source, not production

```text
main       = latest accepted source
production = explicitly promoted artifact
```

`main` never auto-deploys.

Business users may commit directly to `main`. Developers may use branches where useful.

### Quality without bureaucracy

Every meaningful change goes through:

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

Mandatory human PR review is not required for normal application development.

---

# 3. Roles and Trust Boundary

## Application Owner

Normally gets GitHub **Write or Maintain**, not Admin.

Controls:

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
deploy own application
manage permitted app secrets
```

## Platform Admin

Controls:

```text
GitHub rulesets
protected workflows
production environments
deployment credentials
runtime infrastructure
Cloudflare load balancer
Supabase platform configuration
central deployment workflow
```

The core rule remains:

> **Application Owners control what their application does. Platform Admins control where and how it runs.**

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

Not required:

```text
Kamal
cloud provider CLI
production SSH keys
production database credentials
Cloudflare CLI
GitHub runner
registry credentials
```

Each app develops against its own local Supabase stack.

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

Production is not used as the local development database.

---

# 5. Self-Service Bootstrap

The user says:

```text
start app
```

The agent handles:

```text
check tools
↓
bun install
↓
verify container runtime
↓
start local Supabase
↓
apply migrations
↓
seed data
↓
generate DB types
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
Local UI state           React
Shared client state      Zustand, narrowly
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

No npm/pnpm/yarn/npx.

No ORM.

No central Infinite Monkey application-component library.

---

# 7. Engineering Philosophy

> **SOLID and clean, but simple.**

Avoid under-engineering:

```text
giant components
duplicated business logic
untyped data
hidden side effects
business logic embedded in UI
ad-hoc state
```

But also avoid:

```text
unnecessary interfaces
factories without real need
generic frameworks
premature extensibility
deep abstraction hierarchies
excessive indirection
```

Abstractions should solve a concrete problem.

---

# 8. Data Architecture & Governance

The governing rule remains:

> **Own locally. Discover globally. Share explicitly.**

### Own locally

Each application owns its Supabase schema and its data.

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

App-specific workflow data can be created freely inside the application's schema.

### Discover globally

Development agents can inspect metadata across application schemas:

```text
tables
columns
types
relationships
comments
```

but not their row data.

For example:

```text
damaged_stock_dev

damaged_stock.*  → metadata + data
inventory.*      → metadata only
sales.*          → metadata only
```

Metadata is derived from PostgreSQL itself through a constrained platform interface. There is no manually maintained data catalog.

Before introducing an important business entity, the agent checks whether a source of truth already exists.

### Share explicitly

If another app already owns the required data, reuse it instead of copying it.

Cross-domain reads use narrow contracts such as views/APIs/RPCs.

Cross-domain writes require explicit operations controlled by the owning domain rather than broad direct write access.

And:

> **Use the simplest relational model that preserves business meaning and integrity.**

The `database-migration` skill performs these checks automatically alongside RLS, grants and PII review.

---

# 9. Supabase Access Model

Development and runtime access remain separate.

### Development role

```text
damaged_stock_dev
```

gets:

```text
own schema development access
global structural metadata discovery
explicitly approved cross-domain contracts
```

Never:

```text
postgres
project owner
service_role
```

### Runtime role

```text
damaged_stock_runtime
```

gets only:

```text
required own-schema access
required cross-domain contracts
no DDL
no global metadata discovery
```

Application users authenticate through shared Supabase Auth:

```text
User
 ↓
Supabase Auth
 ↓
JWT
 ↓
RLS
 ↓
authorized data
```

Authentication can therefore be shared while authorization remains application-specific.

---

# 10. Engineering and Security Loop

Every meaningful change:

```text
understand
↓
implement
↓
test
↓
code review
↓
fix
↓
security review
↓
fix
↓
quality gate
↓
commit
```

Agent review should preferably use a fresh reviewer context/sub-agent where supported.

Findings are:

```text
BLOCKING
IMPORTANT
SUGGESTION
```

No commit while blocking findings remain.

Security review separately covers:

```text
authentication
authorization
RLS
schema boundaries
PII
cross-domain access
validation/injection
secrets
dependencies
browser security
Docker/runtime privileges
deployment security
```

---

# 11. Commit Workflow

The `commit` skill performs:

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

---

# 12. CI and Immutable Artifacts

Every pushed commit independently runs:

```text
format
↓
lint
↓
typecheck
↓
unit tests
↓
migration / RLS tests
↓
dependency/security checks
↓
secret scanning
↓
build
↓
Playwright
↓
Docker build
↓
GHCR
```

The result is an immutable image:

```text
ghcr.io/company/damaged-stock:<git-sha>
```

Production deploys that already-built image. It does not rebuild source during deployment.

The principle is:

> **Agent review provides contextual reasoning; CI provides deterministic verification.**

---

# 13. GitHub as Platform Control Plane

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

There is no separate deployment-state database or application registry.

---

# 14. Runtime Architecture

This is the important latest change.

## A runtime pool is a small HA cell

Instead of treating the runtime pool as a large cluster that requires application placement, define it as:

> **A small set of interchangeable hosts providing application-level redundancy. Every application assigned to that pool runs on every host in the pool.**

For V1:

```text
production/default

├── app-prod-01
└── app-prod-02
```

And both servers contain the full set of standard applications:

```text
app-prod-01
├── damaged-stock
├── returns
├── stocktake
└── purchasing

app-prod-02
├── damaged-stock
├── returns
├── stocktake
└── purchasing
```

This is deliberate.

There is no:

```text
app → server mapping
placement algorithm
scheduler
routing registry
front-door Worker
```

The pool itself is the unit of deployment and redundancy.

---

# 15. Runtime Pool Configuration

The host list remains centrally managed through a GitHub organization variable:

```text
PROD_DEFAULT_HOSTS=
app-prod-01.example.com,app-prod-02.example.com
```

Normal application repositories know nothing about individual servers.

The deployment mapping is simply:

```text
repository
damaged-stock
      ↓
environment
production
      ↓
runtime pool
default
      ↓
PROD_DEFAULT_HOSTS
      ↓
app-prod-01
app-prod-02
```

Kamal receives those concrete hosts.

---

# 16. Cloudflare Front Door

Because every application exists on every host, the edge layer stays extremely simple.

Use a single wildcard Cloudflare Load Balancer for:

```text
*.apps.company.com
```

pointing to the default runtime pool:

```text
                    *.apps.company.com
                            │
                            ▼
                    Cloudflare LB
                      /          \
                     /            \
                    ▼              ▼
              app-prod-01     app-prod-02
                    │              │
               kamal-proxy    kamal-proxy
```

Cloudflare supports wildcard load-balancer hostnames, so one wildcard can front the shared origin pool rather than requiring a load balancer per application. 

Each server's `kamal-proxy` then uses the original application hostname to route to the correct container. Kamal's proxy supports hosting multiple applications on one proxy and routing based on configured hosts. 

Therefore:

```text
damaged-stock.apps.company.com
```

can land on either runtime host.

Both can answer it.

There is no application-aware routing required at Cloudflare.

---

# 17. Production Deployment

The user says:

```text
deploy production
```

The agent:

```text
identify current repo
↓
identify Git SHA
↓
verify CI
↓
trigger protected workflow
↓
central workflow resolves default hosts
↓
GitHub-hosted runner
↓
Kamal
↓
deploy same image to both hosts
↓
health verification
↓
report result
```

Kamal's proxy switches traffic to the newly started application container once its health endpoint succeeds, which is what allows application deployments to be performed without an application outage. 

---

# 18. GitHub-Hosted Kamal Runner

V1 has **no dedicated Kamal server**.

```text
GitHub Actions
      ↓
GitHub-hosted runner
      ↓
Kamal
      ↓
SSH
      ↓
app-prod-01
app-prod-02
```

A self-hosted runner remains a future option if private-only deployment networking becomes worth the additional infrastructure.

It does not change the application model.

---

# 19. Protected Deployment Boundary

Application Owners cannot alter where deployment goes.

Protect at least:

```text
.github/workflows/**
```

using GitHub rulesets.

The real deployment implementation lives in a centrally controlled reusable workflow.

The application cannot specify:

```text
target app
target repo
target hosts
runtime pool
domain
SSH target
Docker privileges
host mounts
```

The deployment interface is effectively:

```text
deploy_this_repository()
```

---

# 20. Deployment Credential Isolation

The production SSH credential is loaded only inside the trusted deployment phase.

Safe flow:

```text
verify CI
↓
verify immutable GHCR image
↓
load deployment credentials
↓
generate temporary Kamal configuration
↓
kamal deploy
```

After the credential has been loaded, the workflow must not execute arbitrary application-controlled scripts.

The deployment credential is never exposed to:

```text
normal CI
application containers
developers' local machines
application-controlled scripts
```

---

# 21. Container Privilege Boundary

Application Owners control their application image.

They do not control host-level Docker privileges.

The platform prevents applications from requesting:

```text
privileged mode
Docker socket
host filesystem mounts
host networking
arbitrary host ports
arbitrary Docker options
```

Those settings belong to the trusted platform-generated Kamal configuration.

---

# 22. Zero-Downtime Infrastructure Maintenance

The two-host runtime pool also gives us a very simple maintenance model.

For any operation requiring a host restart:

```text
app-prod-01
app-prod-02
```

never take both down together.

Instead:

```text
1. drain app-prod-01
2. perform maintenance
3. boot / verify app-prod-01
4. return it to traffic

5. drain app-prod-02
6. perform maintenance
7. boot / verify app-prod-02
8. return it to traffic
```

Cloudflare Load Balancing supports taking an endpoint out of rotation and endpoint draining, so new traffic can be moved away from one host while existing connections are allowed to finish before maintenance. 

This procedure applies to:

```text
OS maintenance
Docker maintenance
VM resizing
host replacement
some networking changes
```

---

# 23. Vertical Scaling

Vertical scaling is the **default infrastructure scaling strategy for V1**.

If the runtime pool needs more CPU or RAM:

```text
2 × current VM size
```

becomes:

```text
2 × larger VM size
```

using rolling replacement/resize:

```text
Cloudflare

     ↓ drain 01

prod-01   prod-02
   X         ✓
             │
       all traffic here

resize / restart 01
        ↓
verify
        ↓
return 01

     ↓ drain 02

prod-01   prod-02
   ✓         X
   │
all traffic here

resize / restart 02
        ↓
verify
        ↓
return 02
```

Thus the VM itself does not need to support a magical zero-downtime resize. **Application availability comes from the other host remaining in service.**

This keeps V1 much simpler than introducing horizontal application placement.

---

# 24. Host Failure Model

The same topology provides basic host-level redundancy:

```text
both healthy
→ traffic can use both

prod-01 unavailable
→ prod-02 continues serving every application

prod-02 unavailable
→ prod-01 continues serving every application
```

The crucial property is:

> **Any healthy host in the pool can serve any standard application.**

That is what keeps ingress, deployment and operations simple.

---

# 25. Scaling Beyond the Initial Pool

For V1, do **not** pre-design:

```text
10-host cluster
application scheduling
sparse placement
per-app load balancing
routing databases
Kubernetes-style orchestration
```

Instead:

### First

Scale the two hosts vertically.

### Later, only when actually required

Revisit whether the workload should be split into additional pools or moved to a more sophisticated scheduler.

Potential future reasons might include:

```text
very high compute workloads
security isolation
special networking
large number of applications
different availability requirements
```

But those are not V1 concerns.

This gives us the right architectural stance:

> **Do not solve tomorrow's orchestration problem today.**

---

# 26. Secrets & Configuration

### Organization variables

Non-sensitive platform configuration:

```text
PROD_DEFAULT_HOSTS
APP_DOMAIN
etc.
```

### Organization secrets

Shared sensitive configuration where appropriate.

### Repository production environment

App-specific production credentials:

```text
DATABASE_URL
OPENAI_API_KEY
third-party credentials
```

Production secrets are not required locally and are never printed back by the agent.

---

# 27. Mobile & Testing Requirements

All applications must support:

```text
mobile
tablet
desktop
```

including:

- no horizontal overflow
- usable forms/navigation
- viewport-safe dialogs
- appropriate touch targets
- accessible primary actions
- mobile-friendly table representation

Playwright covers representative device sizes.

Database tests cover:

```text
migrations
RLS
grants
constraints
schema assumptions
cross-domain contracts
```

---

# 28. Continuous Repository Security

Security operates at two levels:

```text
CHANGE LEVEL
every meaningful change

REPOSITORY LEVEL
scheduled even if untouched
```

A periodic audit asks:

> **Would we still consider this application secure and maintainable if we built it today?**

It reviews:

- dependencies
- authentication/authorization
- RLS/grants
- data architecture
- PII
- secrets
- frontend security
- API boundaries
- Docker configuration
- Actions
- deployment configuration
- logging
- obsolete patterns
- unnecessary complexity
- important missing tests

It should fix or raise material issues, not create stylistic churn.

---

# 29. Agent Skills

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

Important orchestration:

```text
commit
├── test
├── review
├── security-review
├── verify
├── commit
└── push
```

and:

```text
database-migration
├── inspect own schema
├── discover global metadata
├── check existing sources of truth
├── review model simplicity
├── review RLS / grants / PII
├── migrate
└── test
```

---

# 30. New Application Bootstrap

Creating an application requires approximately:

```text
1. Create repository from scaffold
2. Create Supabase application schema
3. Create schema-scoped developer role
4. Create narrower runtime role
5. Grant metadata discovery capability
6. Configure production secrets
7. Apply protected-workflow ruleset
8. Give Application Owner Write/Maintain
```

Then the Application Owner should be self-service.

No per-app infrastructure work.

---

# 31. Future Staging

Staging remains V2.

Eventually:

```text
local
↓
CI
↓
production-like anonymized staging
↓
migration test
↓
staging deploy
↓
UI/security tests
↓
production
```

The user still says:

```text
deploy production
```

The staging gate remains invisible.

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
                           │
                   review + secure
                           │
                     commit / push
                           │
                           ▼
                       GitHub CI
                           │
                           ▼
                  Immutable GHCR Image
                           │
                   deploy production
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
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
       app-prod-01                   app-prod-02
            │                             │
       kamal-proxy                   kamal-proxy
            │                             │
       ALL APPS                       ALL APPS
            │                             │
            └──────────────┬──────────────┘
                           │
                           ▼
                        Supabase


                  Cloudflare
                      │
          *.apps.company.com
                      │
              wildcard Load Balancer
                 /             \
                ▼               ▼
           app-prod-01      app-prod-02


Maintenance / scaling:

drain host 1 → maintain/resize → verify → re-enable
drain host 2 → maintain/resize → verify → re-enable
```

# Updated Guiding Principles

> **The repository is the application.**

> **Application Owners control application behavior; Platform Admins control infrastructure and deployment policy.**

> **`main` is source. Production is an explicit promotion of an immutable artifact.**

> **A runtime pool is a small HA unit of interchangeable hosts, not a general-purpose application scheduler.**

> **Every application assigned to a runtime pool runs on every host in that pool, so any healthy host can serve any application.**

> **Scale vertically and perform host maintenance one machine at a time before introducing more sophisticated placement or orchestration.**

> **Keep ingress dumb: one wildcard Cloudflare load balancer fronts the runtime pool; Kamal Proxy routes requests to applications on each host.**

> **Own locally. Discover globally. Share explicitly.**

> **Use the simplest architecture and data model that preserves correctness, maintainability and security.**

> **Every meaningful change receives code review and security review before commit.**

> **Agent reasoning and deterministic CI complement one another.**

> **Security remains continuous even when application code has not changed.**

> **GitHub, Cloudflare, Supabase and Kamal are standardized; the compute underneath remains replaceable.**

I think this is materially cleaner than the sparse-placement version: **two interchangeable hosts, all apps on both, one wildcard load balancer, and rolling host maintenance/vertical scaling.** No front-door application registry and no scheduler.
