# Business Application Contract

## Purpose and scope

This neutral starter supports a lightweight work-item lifecycle so teams can replace it with a real bounded application process. Users are authenticated staff with explicit app membership. It is out of scope to model organization-wide identity, HR records, deployment state, shared data ownership, or infrastructure.

## Owners and decision rights

- Business owner: **TBD before production** — decides purpose and prioritization.
- Process owner: **TBD before production** — decides work-item states and exceptions.
- Data owner: **TBD before production** — decides classification, retention, and sharing.
- Platform Team: decides identity, production authorization mechanism, runtime, and infrastructure; it does not decide business behavior.

## Vocabulary and invariants

- **Work item**: app-owned record identified by immutable UUID.
- **Member**: existing Supabase Auth user granted local application access.
- **Admin**: member allowed to manage local access and delete work items.
- Identity is shared; authorization, audit, and business state are local.
- Every material work-item and membership change is traceable in the local audit log.
- External/shared dependencies are explicit and read-only unless the data owner approves a source-owned operation.

## Process and module index

- [Core work-item process](business/skills/core-process/SKILL.md) — creation, state progression, correction, deletion, audit, and acceptance.

## Routing table

| Change                                                                                                     | Required business skill                                                           |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Work-item fields, validation, states, transitions, permissions, deletion, audit, retention, or UI behavior | `business/skills/core-process/SKILL.md`                                           |
| Membership/access mechanism                                                                                | Core process for operational impact plus platform security skills                 |
| A genuinely new independent business process/module                                                        | Search existing skills first; create and route a new skill only when none owns it |

## Rule priority

Confirmed owner decisions override assumptions. Then this routing contract selects the relevant skill; the selected business skill is authoritative for detailed current behavior. If code, tests, issues, or UI conflict with the skill, stop and surface the contradiction rather than silently choosing.

## Open decisions

- Replace all **TBD** owners before production.
- Confirm real classification, retention, export, accessibility, localization, and operating constraints.
- Replace or deliberately retain the neutral work-item process before the first domain release.
