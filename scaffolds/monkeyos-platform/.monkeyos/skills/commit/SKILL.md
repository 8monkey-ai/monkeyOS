---
name: commit
description: Complete the monkeyOS business-contract and engineering gate before commit and push.
---

# Commit

1. Inspect and classify the change, including whether business behavior changes.
2. For business behavior, read `BUSINESS.md`, search the existing `business/skills` tree, and load every relevant skill.
3. Update the existing authoritative skill in place. Create a skill only for a genuinely new bounded process/module; never create `-v2`, `-new`, old, or date-suffixed variants.
4. Update `BUSINESS.md` routing only when process/module structure changes. Resolve stale, overlapping, contradictory, or unreferenced paths.
5. For the first real module, replace the application-definition route with a named, owner-approved skill before adding schema or UI. Never invent placeholder business CRUD. Keep migrations, generated database types, typed TanStack Query hooks, stable keys, RLS tests, and UI consumers coherent.
6. Update behavior tests, then user/business-focused `CHANGELOG.md` and semantic version in `package.json`.
7. Format, generate framework types, run Oxlint type-aware compiler diagnostics, test, build, and run deterministic repository audit.
8. Perform code review, fix BLOCKING findings, then security review and fix BLOCKING findings.
9. Rerun affected checks and the full quality gate. Only then create a focused commit and push. Never push secrets or bypass protected controls.
