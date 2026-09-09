# Enterprise golden-path qualification

Overall: **TECHNICAL GOLDEN PATH PASS; PRODUCTION AUTHENTICATION BLOCKED EXTERNALLY**

This packet complements the existing Factory V2 qualification with authenticated tenant-boundary, approval-authority, exact-candidate release, and machine-readable lineage proof. It does not claim an external production deployment.

## Baseline

- Baseline commit: `b7cd6890b5ac8ced093a4163dbff8d8ae103f8f9`
- Qualified head before generated evidence: `449ae081368a80f3ec211e133e033709b096d0d2`
- Qualification date: `2026-09-09T17:58:15.632Z`
- Environment: darwin arm64; v24.18.1

## Authentication and tenancy

- Deterministic Clerk-compatible Convex identity contract: **PASS**
- Same-company read/write: **PASS**
- Cross-company read/write: **DENIED**
- Unauthenticated request: **DENIED**
- Production-equivalent Clerk browser authentication: **BLOCKED — EXTERNAL**
- Two-company production browser isolation: **BLOCKED — EXTERNAL**
- Blocker: Production Clerk mode and credentials were not available in the qualification environment.

## Canonical lineage

`mission-system-factory-e2e-v2` → `plan-system-factory-e2e-v2` r1 → `work-order-system-factory-e2e-v2` → `routing-decision-system-factory-e2e-v2` → `factory-version-progressive-software-v1` + `fake-system-factory-v2:v1` → `attempt-source-current-head` → `candidate:fa42e1cb35a8f76b294c06e5f6d53cfbd8fa159d` → `verification-run:attempt-verification-current-head` → `evidence:attempt-verification-current-head:factory-negative-constraints`, `evidence:attempt-verification-current-head:factory-change-budget`, `evidence:attempt-verification-current-head:mission:independent-verification`, `evidence:attempt-verification-current-head:spec:VERIFY-001` → `approval-system-factory-e2e-v2` → `release-system-factory-e2e-v2`

The candidate revision remains `fa42e1cb35a8f76b294c06e5f6d53cfbd8fa159d` through verification, approval, and release readiness. Full digests and relationships are in [lineage.json](lineage.json).

The isolated qualification persists the exact Git candidate and reloadable JSON lineage/evidence. An external Convex process-restart exercise was not available, so this is technical persistence proof, not production-environment certification.

## Negative qualification

Unauthenticated access, cross-company read/write, stale lease, specification mismatch, stale candidate/head, verification failure, insufficient approval, and different release candidate all fail closed in the recorded deterministic qualification.

## Qualification commands

| Command | Result |
| --- | --- |
| `pnpm run ci:prepare` | PASS |
| `pnpm --filter @mission-control/orchestration-server exec vitest run src/__tests__/systemFactoryQualification.test.ts` | PASS |
| `pnpm exec vitest run convex/__tests__/companyAccess.test.ts convex/__tests__/authorizationRemediation.test.ts convex/__tests__/deliveryAuthorizationFailClosed.test.ts convex/__tests__/modelRoutingAuthorization.test.ts` | PASS |
| `pnpm exec vitest run convex/__tests__/missionPlan.test.ts convex/__tests__/missionWorkOrderContract.test.ts convex/__tests__/factoryDispatch.test.ts convex/__tests__/sandboxProfileAdmission.test.ts convex/__tests__/factoryRuntimeGoldenPath.test.ts convex/__tests__/verificationPersistence.test.ts convex/__tests__/workOrderGovernance.test.ts convex/__tests__/factoryRelease.test.ts` | PASS |
| `pnpm exec vitest run convex/__tests__/serviceCommandAuth.test.ts` | PASS |
| `pnpm --filter mission-control-ui exec vitest run src/auth/authMode.test.ts src/auth/clerkConvexDiagnostic.test.ts` | PASS |
| `pnpm run docs:factory-check` | PASS |

## External blockers

1. Production Clerk mode and credentials were not available in the qualification environment.
2. No production-equivalent second Clerk company identity was available for browser isolation.

## Browser evidence

- Canonical shell smoke/accessibility suite: **PASS** (`pnpm run test:e2e:critical`, 9 tests).
- Phase 2 convergence screenshots: [Factory Registry](../phase-2-convergence/factory-registry.png) and [Decision Center](../phase-2-convergence/decision-center.png).

## Full qualification classification

- Build, typecheck, unit, authorization, browser/accessibility, and golden-path qualification: **PASS**.
- Integration: **BLOCKED — PRE-EXISTING** pending root integration-runner hardening; package and Factory integration suites pass.
- Security: authorization, secret scan, service authentication, and fail-closed tenant checks pass. The registry-backed dependency audit fails on advisories affecting the unchanged baseline dependency graph and remains Phase 3 release-hardening work.

## Pre-existing blockers repaired

1. README Factory consistency was restored without changing the underlying claims or checker.
2. The Factory V2 fixture now uses Node's native TypeScript stripping instead of a nested `tsx` IPC socket, preserving the same test under managed sandboxes.
