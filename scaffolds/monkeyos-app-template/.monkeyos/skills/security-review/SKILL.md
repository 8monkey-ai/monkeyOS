---
name: security-review
description: Review a monkeyOS change across application and platform trust boundaries.
---

# Security review

Check Auth/session handling, app-local membership, per-operation RLS, indexed policy predicates, exact-email-only privileged lookup, explicit caller checks in every security-definer function, fixed search paths, narrow grants, external read-only enforcement, data classification, Bun.secrets use, production environment isolation, Actions permissions, immutable-image promotion, container user/health, and dependency or secret leakage. Confirm typed query hooks do not turn client filtering, cache state, or hidden controls into an authorization boundary: PostgreSQL RLS must independently protect every operation. Browser code must never receive `service_role`, production database credentials, or a browsable user directory. Treat hidden UI as convenience, never authorization.
