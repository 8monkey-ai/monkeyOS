---
name: test
description: Run the complete deterministic monkeyOS application quality suite.
---

# Test

Run formatting check, lint, strict typecheck, Bun unit tests, local database reset, migration/RLS/membership/audit tests, seed validation, production build, responsive Playwright projects, a Docker build for protected `RUNTIME_ARCH` (ARM64 by default, AMD64 for AMD/Intel x86-64), and the container health smoke test. Use synthetic local data. Never aim tests at production or a linked remote project. Fix blocking failures and rerun the affected layer followed by the full gate.
