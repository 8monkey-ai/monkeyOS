# Platform acceptance contracts

This checklist is normative for the `v1` compatibility channel.

- [x] Installable in any GitHub organization; no organization, domain, project, cloud account, or host is hard-coded.
- [x] Repository identity is the only application registry and deterministically derives schema, roles, image, and hostname.
- [x] Invalid and colliding normalized names fail before mutation.
- [x] GitHub owns source, CI, approvals, deployment history, environment configuration, secrets, and GHCR artifacts.
- [x] Supabase Auth owns identity; each application schema owns authorization, audit, and business state.
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
- [x] CI and containers use latest stable Bun; compatible package/action releases are maintained through semver ranges, stable moving tags, major action channels, lockfiles, and Dependabot rather than duplicated runtime constants.
- [x] Cloud IaC owns infrequent host/network lifecycle; Kamal owns frequent application lifecycle.
- [x] Application-owned data is local-first; external/shared dependencies are declared, least-privilege, and read-only by default.
- [x] PostgreSQL catalogs are the metadata source; cross-domain contracts are explicit and there is no maintained catalog.
- [x] Local secrets use Bun.secrets; production secrets are released only after the GitHub `production` environment gate.
- [x] Every app starts with `BUSINESS.md` plus at least one authoritative process/module skill.

An installation is not conformant if any unchecked item is waived by introducing central monkeyOS state.
