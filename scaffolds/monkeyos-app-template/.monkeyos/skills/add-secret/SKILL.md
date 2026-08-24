---
name: add-secret
description: Store an authorized local development secret in Bun.secrets without disclosure.
---

# Add local secret

Verify the name is declared by the README or external-source declaration. Run `bun run secret:add <NAME>` interactively; the script disables terminal echo and stores under `monkeyOS:<organization>/<repository>`. Never pass values as arguments, paste them into chat, write `.env`, print them, or add them to shell history. Confirm only that storage and typed validation succeeded. Production values belong only to the protected GitHub `production` environment and are never handled by this skill.
