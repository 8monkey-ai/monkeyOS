---
name: review
description: Review monkeyOS application changes for correctness and maintainability.
---

# Review

Inspect the diff and relevant business skills. Classify findings as BLOCKING, IMPORTANT, or SUGGESTION. Check business invariants, SOLID-but-simple design, standard React Router project structure and scripts, official CLI-generated shadcn components and shell composition, React state ownership, schema/migration correctness, test coverage, accessibility, responsive behavior, compatible dependency policy, version/changelog alignment, and accidental platform-file edits. Treat custom framework orchestration, invented placeholder business schema/CRUD, or routine Supabase `.from()`/`.rpc()` calls from routes or visual components as blocking. Real modules must expose typed TanStack Query hooks with stable keys, validated mutation inputs, error propagation, and precise post-success cache invalidation or updates; RLS remains authorization. A hand-written approximation of an available shadcn registry component is blocking: require `bun run ui:add <component>` and keep application composition outside `src/components/ui/`. Prefer concrete file/line evidence. No change proceeds with a blocking finding.
