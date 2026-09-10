---
status: ready
priority: p1
issue_id: "068"
tags: [enterprise, product, navigation, qualification, phase-3]
dependencies: []
---

# Rationalize the enterprise product surface

## Problem Statement

The imported reference implementation exposes Live, Preview, Demo, hidden,
legacy, and experimental routes. Qualifying all of them equally would preserve
historical product sprawl and spend release effort on surfaces that do not
belong in the enterprise software-factory operating model.

## Findings

- The enterprise route-capability registry declares 56 routes: 23 Live, 26
  Preview, and 7 Demo.
- The combined legacy and EOS menus contain 102 distinct view IDs; Mission and
  automation detail routes bring the route-pattern inventory to 104.
- Forty-eight legacy menu destinations have no route-capability declaration and
  are hidden only when EOS capability enforcement is active.
- Several hidden or Preview routes call functions in the inherited 184-item
  unauthenticated read-only baseline; they cannot be admitted without explicit
  security review or removal.

## Proposed Solutions

### Option 1: Qualify the inherited surface

Keep all historical routes and apply the full Live acceptance contract broadly.

**Pros:** Minimal navigation churn.

**Cons:** Expensive, preserves overlap, and conflicts with the enterprise
curation requirement.

### Option 2: Curate an enterprise distribution

Retain a small authoritative Live core, keep bounded secondary capabilities as
Preview, consolidate duplicate routes, and remove or isolate unrelated Labs and
legacy surfaces.

**Pros:** Smaller attack surface, clearer operator model, and a defensible
qualification boundary.

**Cons:** Requires migration redirects and careful regression coverage.

## Recommended Action

Use Option 2. Produce the complete route decision matrix first, obtain Product
Owner approval, then change navigation and routing without modifying the
upstream reference implementation.

## Acceptance Criteria

- [x] Enterprise repository and exact upstream baseline are verified and documented.
- [x] Inherited Phase 2 qualification baseline passes in the enterprise repository.
- [x] Every route/menu destination has the required Phase 3.0 decision fields.
- [ ] Product Owner approves or adjusts the recommendation set.
- [ ] Enterprise navigation exposes only approved Live and Preview destinations.
- [ ] Removed/consolidated routes have deterministic redirects or explicit not-found behavior.
- [ ] Retained Live routes receive the full acceptance contract.
- [ ] Preview and Labs routes remain security-reviewed, isolated, and truthfully labeled.
- [ ] Browser, accessibility, authorization, build, and route-contract tests pass.

## Work Log

### 2026-09-09 - Repository safety and baseline

**Actions:**
- Created `jaydubya818/MissionControlEnterprise` as a separate public repository.
- Imported exact upstream commit `ffd58077989a23004819a85f529ca74c955b1422` as `main`.
- Recorded enterprise-only `origin` and upstream `MissionControl` provenance.
- Ran `CI=true pnpm run qualify:factory:v2`; all composed baseline checks passed.
- Restored regenerated historical V2 evidence and recorded the replay under Phase 3 evidence.

**Learnings:**
- The inherited technical baseline is green, but route scope is materially wider than the enterprise maturity registry.
- Product-surface decisions must precede further release qualification.

### 2026-09-09 - Decision matrix proposed

**Actions:**
- Reconciled all 104 `MainView` identifiers against the historical and EOS navigation contracts.
- Recorded maturity, backend ownership, user/job, overlap, security/data truth, and one allowed recommendation for every route.
- Proposed a 17-route Live contract, including two contextual detail routes, and a 14-route Preview contract.
- Proposed consolidation, Labs isolation, hiding, deprecation, or removal for the other 73 routes.
- Defined a compact 15-destination primary Live navigation and an explicit approval gate before implementation.

**Validation:**
- Inventory contains 104 data rows and exactly ten required columns per row.
- Inventory has no missing, extra, or duplicate `MainView` identifiers.
- Every recommendation uses an allowed Phase 3.0 value.

**Pending:**
- Product Owner approval or route-level amendments.
