# Platform acceptance contracts

This checklist is normative for the `v1` compatibility channel.

- [x] Installable in any GitHub organization; no organization, domain, project, cloud account, or host is hard-coded.
- [x] Identity is convention, not configuration: applications store no identity file, and no schema, role, hostname, or image name appears in application source. The repository name is written only to the credential-store namespace and the local Supabase container prefix, neither read by application code.
- [x] Each application owns one Supabase project and therefore the default `public` schema. The baseline exists once, in `supabase/baseline`, and the template ships it verbatim with a recorded checksum; the provisioner renders only cluster roles, migration-history registration, and the initial admin.
- [x] Row level security is the authorization boundary rather than schema isolation: the baseline revokes the permissive `public` defaults for existing and future objects, the application audit fails any table created without it, and applications select no schema anywhere.
- [x] GitHub owns source, CI, approvals, deployment history, environment configuration, secrets, and GHCR artifacts.
- [x] Supabase Auth owns identity; each application project owns authorization, audit, and business state.
- [x] There is no monkeyOS application-state database, registry, user directory, audit store, catalog, deployment-state store, or business schema.
- [x] Contributors can develop; protected `production` environment reviewers authorize promotion; Platform Admins own the mechanism and targets.
- [x] Application workflows are thin callers of protected central `@v1` reusable workflows.
- [x] Canonical skills are plain files synchronized into `.monkeyos/skills` with a manifest.
- [x] shadcn/ui is the primary application component system: `components.json` is initialized with the official `shadcn@latest` Base UI preset, standard primitives and the shell are added through the CLI, and hand-written registry lookalikes are non-conformant.
- [x] Developer agents are interchangeable; AI inside Actions runs through the latest Pi with an explicitly configured provider, model, and protected credential.
- [x] CI builds and smoke-tests one immutable architecture-matched `ghcr.io/<org>/<repo>:<git-sha>` image. Deployment verifies its architecture and reuses it.
- [x] Application repositories cannot provide hosts, runtime architecture, domain, SSH identity, mounts, Docker privileges, or Kamal flags.
- [x] CloudFormation, Bicep/ARM, and GCP Infrastructure Manager own provider state; monkeyOS has no infrastructure-state backend.
- [x] Every provider yields one configurable dedicated network, one app subnet, and a configurable positive number of interchangeable architecture-matched Docker hosts with configurable image, compute, and volume inputs.
- [x] A wildcard Cloudflare Load Balancer fronts the same protected `RUNTIME_HOST` pool; every standard app runs on every configured host.
- [x] `RUNTIME_ARCH` selects `arm64` by default or `amd64` for AMD/Intel x86-64 and drives provider defaults, CI, deployment verification, Kamal, and provisioned app configuration.
- [x] Applications use standard React Router Framework Mode files and package scripts. Project-level Bun configuration selects the runtime, and production serves the generated build through a small Bun adapter.
- [x] CI and containers use latest stable Bun as the only JavaScript runtime, package manager, application server, and test runner; compatible package/action/base-image releases move through semver ranges, moving tags, lockfiles, and Dependabot.
- [x] React Router type generation precedes Oxlint; Oxlint type-aware rules and compiler diagnostics form one lint/type-check gate without a separate `tsc --noEmit` pass.
- [x] Both scaffolds use a TypeScript 7/Bun ESM configuration with `ESNext`, preserved modules, bundler resolution, forced module detection, verbatim module syntax, isolated transforms, checked side-effect imports, and explicit strictness, without redundant compatibility flags.
- [x] Cloud IaC owns infrequent host/network lifecycle; Kamal owns frequent application lifecycle.
- [x] Application-owned data is local-first; external/shared dependencies are declared, least-privilege, and read-only by default.
- [x] PostgreSQL catalogs are the metadata source; cross-domain contracts are explicit and there is no maintained catalog.
- [x] Local secrets use Bun.secrets; production secrets are released only after the GitHub `production` environment gate.
- [x] The generic app starts with only Auth, app-local membership, and audit state; it contains no invented placeholder business schema, records, routes, or CRUD.
- [x] Every app starts with `BUSINESS.md` plus an authoritative application-definition skill; each real process/module receives a routed authoritative skill before implementation.
- [x] Routine Supabase server state is owned by typed TanStack Query hooks with stable keys, validation, errors, and precise cache updates; pages/components consume hooks and RLS remains authoritative.

An installation is not conformant if any unchecked item is waived by introducing central monkeyOS state.
