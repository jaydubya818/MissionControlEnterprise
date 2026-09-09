---
status: complete
priority: p1
issue_id: "066"
tags: [software-factory, authentication, authorization, golden-path, qualification]
dependencies: []
---

# Qualify the authenticated enterprise golden path

## Problem Statement

Mission Control has qualified Factory V2 subsystem and composed-system evidence, but Step C requires one canonical lineage to be proven under authenticated server authorization, durable authoritative storage, qualified and pinned execution identity, independent verification, current evidence, valid approval authority, and exact-candidate release identity.

## Findings

- Required baseline is `b7cd689` (`security: complete live-route authorization remediation`).
- Factory V2 already provides a canonical composed qualification and must remain authoritative.
- The existing V2 composed fixture is strong technical evidence but does not by itself prove authenticated persistence and two-company isolation through one authoritative Convex lineage.
- Production Clerk and two-company browser proof may depend on external credentials and must never be replaced with a bypass.

## Proposed Solutions

### Option 1: Documentation-only aggregation

**Approach:** Repackage existing Factory V2 evidence.

**Pros:** Small change.

**Cons:** Does not prove Step C's authenticated persisted lineage.

**Effort:** Low

**Risk:** High

### Option 2: Canonical persisted qualification

**Approach:** Strengthen existing deterministic qualification around the real Convex domain functions and stores, add focused negative proofs, and emit durable non-secret lineage evidence.

**Pros:** Meets Step C without a parallel product architecture.

**Cons:** Requires careful cross-domain fixture setup and full qualification.

**Effort:** High

**Risk:** Medium

## Recommended Action

Implement Option 2. Reuse canonical Mission, Plan, WorkOrder, routing, Factory, Attempt, verification, evidence, approval, and release code; make only narrow fixes for proven defects; preserve the authorization ratchet and Factory V2 qualification.

## Technical Details

**Expected affected areas:**

- Existing Convex/domain qualification tests
- Existing qualification orchestration
- `docs/testing/evidence/enterprise-golden-path/`
- Readiness documentation only where new evidence justifies updates

**Database changes:** None expected unless a persisted-lineage defect proves one necessary.

## Resources

- User-provided `MISSION CONTROL — STEP C` specification
- `apps/orchestration-server/src/__tests__/systemFactoryQualification.test.ts`
- `scripts/system-factory-e2e-qualification.mjs`
- `docs/testing/evidence/system-factory-e2e-v2/`

## Acceptance Criteria

- [x] Existing authoritative golden-path implementation is mapped before changes.
- [x] One authenticated technical Mission-to-release lineage is deterministically proven and durable evidence is emitted.
- [x] Server-side same-company and cross-company authorization are proven.
- [x] Factory Version and Execution Profile qualification and pinning are proven.
- [x] Candidate, independent verification, current evidence, approval, and release identities match.
- [x] Negative advancement cases fail closed.
- [x] Factory V2 system, authorization, service security, and secret gates are preserved; canonical dependency and root integration blockers are classified.
- [x] Browser qualification verifies the Clerk fail-closed state without an authentication bypass.
- [x] Durable human-readable and machine-readable evidence is written without secrets.
- [x] Final readiness determination is evidence-backed.

## Work Log

### 2026-09-09 - Step C discovery started

**By:** Repository operator via Codex execution

**Actions:**

- Checked out an isolated branch directly from required baseline `b7cd689`.
- Read the complete Step C specification and repository execution instructions.
- Located the existing Factory V2 composed qualification, lifecycle todo, and evidence conventions.

**Learnings:**

- Existing Factory V2 qualification is the correct technical foundation and must be complemented, not replaced.
- Step C's main delta is authenticated persistence and exact same-lineage authority proof.

### 2026-09-09 - Qualification complete

- Strengthened the existing Factory V2 test with authenticated tenant boundaries, approval authority, and exact-candidate release lineage.
- Repaired the four README consistency findings narrowly.
- Passed build, lint, typecheck, unit, authorization, Factory V2 system, golden-path, and browser suites.
- Recorded production Clerk/two-company browser blockers, the root Vitest blocker, and current dependency-advisory blocker without weakening gates.

## Notes

- Do not productize or redesign UI.
- Do not broaden scope to the 184 admitted non-Live read-only authorization findings.
- Do not create a commit until all qualification and evidence review is complete.
