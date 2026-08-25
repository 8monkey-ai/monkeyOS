---
name: test
description: Run the complete deterministic monkeyOS application quality suite.
---

# Test

Run formatting check, framework type generation, Oxlint type-aware rules and compiler diagnostics, Bun unit tests, local database reset, migration/RLS/membership tests, seed validation, production build, responsive Playwright projects, a Docker build for protected `RUNTIME_ARCH` (ARM64 by default, AMD64 for AMD/Intel x86-64), and the container health smoke test. Test real module query hooks for success, errors, and exact cache updates when behavior warrants it. Use synthetic local data only for routed real modules; never create placeholder business fixtures or aim tests at production or a linked remote project. Fix blocking failures and rerun the affected layer followed by the full gate.
