# GCP runtime pool

This Terraform root module is a Google Cloud Infrastructure Manager blueprint. Infrastructure Manager executes it and owns deployment revisions/state in Google's managed control plane; monkeyOS does not configure a local or organization-owned backend.

Variables expose host count, `runtime_arch`, compatible machine-type/image overrides, boot-disk size/type, network/subnet names, and CIDR ranges. ARM64 is the default; AMD64 selects AMD/Intel x86-64 defaults. Store the blueprint in the Platform Admin-controlled source bucket/repository, preview it, then create/update an Infrastructure Manager deployment. Copy `runtime_host_public_ips` into protected `RUNTIME_HOST`, copy `selected_runtime_architecture` into `RUNTIME_ARCH`, and configure the matching Cloudflare pool. App deployment never invokes Infrastructure Manager.
