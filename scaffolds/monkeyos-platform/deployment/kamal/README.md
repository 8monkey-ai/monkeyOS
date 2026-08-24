# Trusted Kamal deployment

The reusable deployment workflow checks out this directory from the protected `v1` channel after the `production` gate releases credentials. It validates a full Git SHA, verifies successful CI and an existing GHCR manifest matching protected `RUNTIME_ARCH`, and then generates `config/deploy.yml` from protected environment values. `RUNTIME_ARCH` defaults to `arm64` and accepts `amd64` for AMD/Intel x86-64. The protected `RUNTIME_HOST` variable is a semicolon-separated list of one or more unique hostnames/IP addresses; the trusted generator validates it and supplies the complete pool to Kamal.

Applications supply only the repository and tested SHA. They cannot supply hosts, hostname, SSH user, mounts, Docker privileges, proxy flags, or lifecycle hooks. The generated files are temporary and mode `0600`; GitHub-hosted runners are discarded after the job.

The workflow installs the latest compatible Kamal 2.x release, so minor and patch fixes do not require editing a version constant. Rollback is promotion of an earlier successful immutable SHA through the same gate. It is not an application-controlled command or image rebuild.
