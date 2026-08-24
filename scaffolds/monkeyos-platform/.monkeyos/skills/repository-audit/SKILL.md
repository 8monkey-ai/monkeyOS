---
name: repository-audit
description: Audit a monkeyOS repository for current security, maintainability, and business-contract integrity.
---

# Repository audit

First run deterministic contract checks. Then evaluate whether the app would still be considered secure and maintainable if built today. Review shadcn-first UI composition, dependencies and compatible-update automation, latest stable Bun, Auth, memberships, RLS, audit coverage, PII/retention, external boundaries, local/production secrets, browser/API security, architecture-matched container delivery, current Actions, deployment, tests, README accuracy, AGENTS.md enforcement, and managed-file drift. Verify that protected `RUNTIME_ARCH` consistently selects provider compute/image defaults, CI, manifest verification, Kamal, and provisioned configuration. Enumerate every business skill routed by `BUSINESS.md`; flag missing or unreferenced skills, overlapping authority, contradictions, stale behavior, broken references, and version/date-suffixed duplicates. Git is history; active skills must describe one current truth. Report material evidence as BLOCKING, IMPORTANT, or SUGGESTION and avoid style-only churn.
