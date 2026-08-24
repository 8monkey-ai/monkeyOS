---
name: deploy
description: Request protected promotion of an already tested immutable app image.
---

# Deploy

Confirm the full 40-character SHA is on accepted source and has successful central CI and an existing GHCR image. Dispatch the thin app `deploy.yml` with that SHA. GitHub's protected `production` environment authorizes the promotion; a Contributor may request but only a Deployer approves. The central workflow chooses hosts, pool, domain, SSH identity, privileges, proxy, and Kamal behavior. Never rebuild, retag `latest`, run app-controlled privileged scripts, or obtain production credentials locally.
