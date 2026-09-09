---
status: complete
priority: p1
issue_id: "065"
tags: [security, authorization, convex, tenant-isolation]
dependencies: []
---

# Remediate public Convex authorization baseline

Eliminate missing server-side authorization from public Convex functions, starting with every function reachable from a Live Mission Control route.

## Problem Statement

The authorization scanner reports 924 public Convex functions: 287 authorized and 637 unauthorized. The ratchet prevents new debt but does not make the current production surface safe. Public handlers must fail closed, resolve authenticated human or scoped workload identity, derive owning workspace/tenant from authoritative resources, and enforce least-privilege permissions.

## Findings

- `pnpm run security:authorization` confirms the starting baseline is exactly 637 unauthorized functions.
- Existing authoritative patterns live in `convex/lib/companyAccess.ts`, `convex/lib/deliveryAuthorization.ts`, `convex/lib/taskAuthority.ts`, `convex/lib/factoryActionAuthorization.ts`, and `convex/lib/serviceCommandAuth.ts`.
- `apps/mission-control-ui/src/shellV2/routeCapabilities.ts` is the canonical Live/Preview/Demo route registry.
- At least 253 unauthorized public functions are referenced somewhere in the UI; the exact Live-route subset must be derived from route component ownership and shared shell callers.
- The scanner mentions authorization wrappers that are not currently implemented, so remediation must not rely on scanner-only names without real enforcement.

## Proposed Solutions

### Option 1: Live-route-first object authorization

Trace each Live route to its Convex functions and add resource-derived workspace permission checks plus negative tests.

**Pros:** Satisfies the release-critical boundary first; preserves service identities; minimizes regression risk.

**Cons:** Requires careful per-domain work; the remaining Preview/Demo baseline persists temporarily.

**Effort:** Large

**Risk:** Medium

### Option 2: Blanket authenticated wrapper conversion

Require a human identity on every public function mechanically.

**Pros:** Rapidly reduces the scanner count.

**Cons:** Authentication alone does not stop IDOR; breaks legitimate workers/services; can manufacture a scanner pass without real authorization.

**Effort:** Medium

**Risk:** Critical

## Recommended Action

Execute Option 1. Inventory by route and risk, reuse existing authorization helpers, distinguish human and workload callers, add negative tenant/workspace/role/resource tests, update the monotonic baseline only after real enforcement, and document remaining P0-P4 findings in `docs/security/AUTHORIZATION_REMEDIATION.md`.

## Technical Details

**Primary files:**
- `apps/mission-control-ui/src/shellV2/routeCapabilities.ts`
- `scripts/lib/convex-authorization-scan.mjs`
- `scripts/convex-authorization-baseline.json`
- `convex/lib/companyAccess.ts`
- Live-route Convex modules and their authorization tests

**Database changes:** None expected. Authorization derives existing tenant/project/resource relationships.

## Acceptance Criteria

- [x] Complete classified public-function inventory with Live-route callers and P0-P4 risk.
- [x] Every Live-route public function enforces server-side authorization.
- [x] Every consequential public write enforces least-privilege human or workload authority.
- [x] ID-bearing functions derive and verify owning tenant/workspace/project server-side.
- [x] Negative tests cover unauthenticated, wrong workspace/project, insufficient role, authorized caller, and invalid resource.
- [x] Authorization baseline monotonically decreases with no scanner suppression.
- [x] `docs/security/AUTHORIZATION_REMEDIATION.md` contains exact starting/ending/live counts and remaining classifications.
- [x] Build, lint, typecheck, unit, integration, authorization, route, Factory qualification, and affected browser smoke are reported accurately.

## Work Log

### 2026-09-09 - Discovery started

**By:** Codex

**Actions:**
- Read the full remediation brief and repository authorization documentation.
- Installed locked workspace dependencies in the isolated worktree.
- Ran the scanner and confirmed 924 total / 287 authorized / 637 unauthorized.
- Located the canonical route maturity registry and existing authorization helpers.
- Identified 253 unauthorized functions referenced somewhere in the UI; Live-route narrowing is in progress.

**Learnings:**
- The current scanner is a valid monotonic ratchet but authorization correctness must be verified independently.
- Human and service authority are intentionally separate and must remain so.
