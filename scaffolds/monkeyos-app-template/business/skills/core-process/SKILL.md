---
name: core-process
description: Current authoritative work-item lifecycle and operating rules for the neutral starter.
---

# Core work-item process

## When to use

Load this skill for any change to work-item data, validation, states, transitions, permissions, UI, audit, reporting, retention, correction, cancellation, or deletion.

## Purpose, scope, actors, permissions

Members capture and progress small work items. Admins have the same workflow permissions and additionally may permanently delete an item. Non-members have no access. This starter has no approval or separation-of-duty step; adding either changes the process and this skill in place.

## Record and workflow rules

- A work item has an immutable UUID, required title of 1–160 characters, optional description, status, creator, created time, and updated time.
- Allowed states are `open`, `in_progress`, and `done`.
- Members may create in `open`, edit content, and move between any current states so corrections/reopening remain possible.
- Admins may delete. The audit entry remains even after the business row is deleted.
- There are no deadlines, calculations, rounding rules, KPIs, handoffs, cancellation states, or terminal locks in the neutral process.

## Ownership, audit, retention, and external boundaries

The application is source of truth for work items. Every insert/update/delete records actor, action, entity, record identifier, before, after, and timestamp in the app-local audit log. Data classification and retention are **TBD before production**; until confirmed, do not add PII or automated deletion/export. The optional reporting dependency is read-only and is never a source of truth for work-item writes.

## Operating constraints and fallback

The UI supports current mobile, tablet, and desktop browsers. No shared-device, offline, peripheral, language, or multi-time-zone workflow is promised. During an outage, users record urgent work in the business owner's approved manual fallback and reconcile after recovery; the fallback must be defined before production.

## Acceptance scenarios

1. A member signs in, creates an open item, edits it, progresses it to done, and each mutation is audited.
2. A member can reopen a done item and cannot delete it.
3. An admin can delete an item and the audit trail retains before data.
4. An authenticated non-member cannot read or mutate work items.
5. A logged-out visitor reaches only the login screen.
