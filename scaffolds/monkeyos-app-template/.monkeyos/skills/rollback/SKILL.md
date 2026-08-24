---
name: rollback
description: Restore a previously tested immutable release through the production gate.
---

# Rollback

Identify the last known-good full SHA from GitHub deployment history. Verify its successful central CI and GHCR manifest for the current protected `RUNTIME_ARCH` still exist. Request the normal protected deploy workflow with that SHA, document the operational reason, obtain Deployer approval, verify `/healthz` through Cloudflare and every host in the protected `RUNTIME_HOST` pool, and open follow-up work for the forward fix. Do not rebuild old source or bypass the environment gate. An architecture change requires a newly built artifact and is never performed as rollback.
