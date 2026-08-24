---
name: application-definition
description: Current authoritative rules for defining the application's first real bounded business capability.
---

# Application definition

## When to use

Load this skill while the application has no implemented business process, and for any change that defines its purpose, owners, first process/module, actors, decisions, data ownership, or operating constraints.

## Current truth

The generic scaffold intentionally assumes no business domain and owns no placeholder business records. It provides authentication, app-local membership, access administration, audit infrastructure, configuration, testing, and delivery only. No business workflow, state machine, calculation, approval, retention rule, integration, KPI, or exception path is authoritative until an owner confirms it.

## Definition rules

- Name the business, process, and data owners before implementing the first domain capability.
- Define the first capability as a genuinely bounded process or module, create its business skill, and route it from `BUSINESS.md` before adding business tables or UI.
- Capture actors, permissions, states, transitions, validations, approvals, exceptions, ownership, audit events, retention, integrations, and acceptance scenarios in that skill.
- Add only real application-owned schema, deterministic synthetic records, RLS policies, audit coverage, and tests derived from the confirmed process.
- Retire this definition skill and its route in the same change once all open definition decisions have moved to authoritative process/module skills. Git preserves this history.

## Engineering handoff

Each real module exposes server state through typed TanStack Query hooks with stable query keys. Hooks own Supabase queries and mutations, input validation, error propagation, and precise cache invalidation. Pages and visual components consume those hooks and do not call Supabase directly for routine business data. PostgreSQL RLS remains the authorization boundary.

## Acceptance scenarios

1. A member can authenticate and reach the protected application foundation without finding invented business records or processes.
2. An authenticated non-member is denied by app-local membership.
3. The first business implementation is preceded by named owners, a routed business skill, real owned-data boundaries, and acceptance scenarios.
4. New business tables include explicit grants, RLS, audit behavior, deterministic seeds, generated types, and negative authorization tests.
