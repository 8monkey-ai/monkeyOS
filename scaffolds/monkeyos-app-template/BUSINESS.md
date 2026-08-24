# Business Application Contract

## Purpose and scope

This generic scaffold intentionally defines no business domain. It provides the secure application foundation while the first real bounded process or module is identified. It is out of scope to invent placeholder workflows, business records, organization-wide identity, deployment state, shared-data ownership, or infrastructure.

## Owners and decision rights

- Business owner: **TBD before the first business implementation** — decides purpose, scope, and priority.
- Process owner: **TBD before the first business implementation** — decides workflows, rules, and exceptions.
- Data owner: **TBD before the first business implementation** — decides classification, retention, sharing, and source-of-truth boundaries.
- Platform Team: decides identity, production authorization mechanism, runtime, and infrastructure; it does not decide business behavior.

## Vocabulary and invariants

- **Member**: existing Supabase Auth user granted local application access.
- **Admin**: member allowed to manage app-local access.
- **Business module**: a real, independently bounded capability confirmed by its owners and defined in its own skill.
- Identity is shared; authorization, audit, and future business state are application-local.
- Membership changes are traceable in the local audit log; each future business module must define its own material audit events.
- External/shared dependencies are explicit and read-only unless the data owner approves a source-owned operation.
- No placeholder business table, record, process, or UI is authoritative.

## Process and module index

- [Application definition](business/skills/application-definition/SKILL.md) — governs the owner-confirmed transition from the empty foundation to the first real business modules.

## Routing table

| Change                                                                                   | Required business skill                                                           |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Purpose, owners, first process/module, data boundaries, or initial operating constraints | `business/skills/application-definition/SKILL.md`                                 |
| Existing implemented process/module behavior                                             | Its current routed business skill; update it in place                             |
| A genuinely new independent process/module                                               | Search existing skills first; create and route a new skill only when none owns it |
| Membership/access mechanism                                                              | Relevant operational skills for business impact plus platform security skills     |

## Rule priority

Confirmed owner decisions override assumptions. Then this routing contract selects the relevant skill; the selected business skill is authoritative for detailed current behavior. If code, tests, issues, or UI conflict with a skill, stop and surface the contradiction rather than silently choosing.

## Open decisions

- Name the business, process, and data owners.
- Define the first real bounded processes/modules and their acceptance scenarios.
- Confirm classification, retention, export, accessibility, localization, integrations, reconciliation, and operating constraints before implementing affected behavior.
- Retire the application-definition skill after all current business behavior is routed to real authoritative module/process skills.
