---
status: complete
priority: p1
issue_id: "067"
tags: [authentication, authorization, clerk, reconciliation, telegram]
dependencies: ["066"]
---

# Reconcile the production Clerk golden path

## Problem Statement

Unique Clerk browser-qualification work was built on a stale branch whose
authorization baseline regressed from 184 to 490 findings.

## Findings

- Canonical commit `5f1e232` already contains the stronger server authorization
  architecture, technical golden path, actor derivation, and internal approval
  cron functions.
- The stale branch adds useful issuer configuration and real two-session browser
  qualification infrastructure.
- Telegram approval remains a supported channel and already carries a
  server-only Convex operator token, but caller-supplied identity arguments and
  duplicate callback registration obscure that boundary.

## Proposed Solutions

### Option 1: Merge the stale branch

Rejected because it restores obsolete authorization files and raises the ratchet.

### Option 2: Selectively reapply additive changes

Preserve canonical authorization, add only Clerk/browser infrastructure, and
clarify Telegram's authenticated operator boundary.

## Recommended Action

Execute Option 2 and require every canonical release gate before one clean commit.

## Acceptance Criteria

- [x] Canonical authorization architecture and 184 ratchet are preserved.
- [x] Clerk issuer is environment-bound and fails closed.
- [x] Two-company server handler tests pass against canonical code.
- [x] Browser preflight rejects missing, legacy, and demo configuration.
- [x] Browser sessions keep Convex tokens in memory only.
- [x] Telegram approvals use a mapped operator token and ignore chat actor claims.
- [x] All requested validation passes.
- [x] One clean commit is prepared; post-commit cleanliness is verified after commit creation.

## Work Log

### 2026-09-09 - Reconciliation started

**By:** Codex

**Actions:**

- Preserved the stale working set in `authenticated-golden-path-pre-reconciliation`.
- Created the reconciliation branch directly from `5f1e232`.
- Excluded stale Task, Approval, cron, and authorization-baseline changes.

### 2026-09-09 - Reconciliation completed

**By:** Codex

**Actions:**

- Added fail-closed Clerk issuer validation and environment wiring.
- Added canonical two-company production-handler authorization tests and a
  secret-safe two-session Playwright harness.
- Kept Telegram approvals supported behind a dedicated mapped-operator token;
  removed caller-supplied actor fields and duplicate callback registration.
- Preserved the 184-function authorization ratchet with Live and P0/P1/P2 at
  zero.
- Passed the technical auth suite, full Factory V2 qualification, dependency
  audit, secret scan, and browser blocked/skip behavior.
