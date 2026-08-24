---
name: commit
description: Complete the monkeyOS business-contract and engineering gate before commit and push.
---

# Commit

1. Inspect and classify the change, including whether business behavior changes.
2. For business behavior, read `BUSINESS.md`, search the existing `business/skills` tree, and load every relevant skill.
3. Update the existing authoritative skill in place. Create a skill only for a genuinely new bounded process/module; never create `-v2`, `-new`, old, or date-suffixed variants.
4. Update `BUSINESS.md` routing only when process/module structure changes. Resolve stale, overlapping, contradictory, or unreferenced paths.
5. Update behavior tests, then user/business-focused `CHANGELOG.md` and semantic version in `package.json`.
6. Format, lint, typecheck, test, build, and run deterministic repository audit.
7. Perform code review, fix BLOCKING findings, then security review and fix BLOCKING findings.
8. Rerun affected checks and the full quality gate. Only then create a focused commit and push. Never push secrets or bypass protected controls.
