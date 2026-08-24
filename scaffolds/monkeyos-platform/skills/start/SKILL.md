---
name: start
description: Prepare and run a monkeyOS application locally without exposing secrets.
---

# Start application

1. Read the application README and `BUSINESS.md`; do not assume production access.
2. Run `check-environment` and synchronize the protected `v1` platform skills into `.monkeyos/skills`.
3. Install with the committed Bun lockfile.
4. Start local Supabase, reset migrations and deterministic seed, store its public local client configuration through `bun run config:local`, and generate types.
5. Validate other required local secret names through the typed config loader; report only presence or absence.
6. Validate declared external sources with read-only, least-privilege development credentials. Never clone external production data.
7. Start the app and report its URL, synthetic test-user emails, and dependency status without values.
