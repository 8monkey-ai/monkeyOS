---
name: review
description: Review monkeyOS application changes for correctness and maintainability.
---

# Review

Inspect the diff and relevant business skills. Classify findings as BLOCKING, IMPORTANT, or SUGGESTION. Check business invariants, SOLID-but-simple design, shadcn-first standard components and shell composition, React state ownership, absence of server fetching in effects, schema/migration correctness, test coverage, accessibility, responsive behavior, compatible dependency policy, version/changelog alignment, and accidental platform-file edits. Prefer concrete file/line evidence. No change proceeds with a blocking finding.
