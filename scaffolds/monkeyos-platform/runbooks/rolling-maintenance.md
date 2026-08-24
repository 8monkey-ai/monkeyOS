# Rolling drain, resize, and restore

Use this for host replacement, vertical resize, OS work, or network maintenance. Schedule infrastructure changes separately from app deployment.

For each host in `RUNTIME_HOST`, one at a time:

1. Disable/drain the selected endpoint in the Cloudflare pool and confirm sufficient remaining hosts are healthy and serving representative app hostnames.
2. Record the provider deployment/change-set preview and apply the provider-native resize or replacement only to that host.
3. Confirm Docker, deployer SSH, outbound GHCR/Supabase connectivity, disk capacity, and host hardening.
4. Run the trusted Kamal reconciliation for current releases, then test origin `/healthz` and representative apps.
5. Re-enable the endpoint and wait for Cloudflare to report it healthy.

Repeat the same five steps for every remaining host. Never drain more capacity than the configured availability threshold permits. If the remaining pool degrades, stop and restore the drained endpoint before continuing. Record infrastructure history in the provider control plane and operational ticket; do not create a monkeyOS deployment-state database.

## Change CPU architecture

Treat an ARM64/AMD64 change as one coordinated platform operation, never an app-selected deploy flag:

1. Set the provider template architecture input and review compatible compute/image defaults or explicit overrides. Provision a parallel replacement pool when continuous availability is required.
2. Set the organization `RUNTIME_ARCH` variable to the same value (`arm64` or `amd64`). Do not duplicate or shadow it in app environments.
3. Re-run central CI for each release SHA that must move so it builds, tests, and publishes an image for the selected architecture.
4. Replace protected `RUNTIME_HOST` and the Cloudflare pool with the new architecture-matched hosts, then deploy the newly tested SHA artifacts.
5. Validate every app and host before draining and decommissioning the old pool through provider-native IaC.

`amd64` is the OCI name used for x86-64 on both AMD and Intel. Never point a selected-architecture artifact at hosts of another architecture.
