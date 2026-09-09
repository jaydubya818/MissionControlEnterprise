---
status: ready
priority: p1
issue_id: "067"
tags: [product, convergence, software-factory, operator-experience]
dependencies: ["066"]
---

# Converge the governed factory product experience

## Problem Statement

Mission Control's authoritative backend already knows the governed delivery lineage, but its product surfaces and navigation expose that truth inconsistently. Phase 2 must converge the existing product around attention, trust, authority, lineage, health, and outcome without creating duplicate domain systems.

## Findings

- Baseline `5f1e232` proves the technical factory and authorization boundaries.
- The EOS route-capability registry is the maturity authority, while multiple legacy/harness navigation groupings compete with the operator model.
- Mission and WorkOrder surfaces already expose substantial canonical Convex data; Factory, trust, health, and ledger capabilities exist across focused views that need consolidation and cross-linking.

## Proposed Solutions

### Option 1: Rebuild the operator shell

High risk and explicitly outside scope because it would duplicate proven architecture.

### Option 2: Map and converge existing surfaces

Inventory authoritative backend/API/test ownership, simplify navigation over existing routes, enrich canonical Mission/WorkOrder/Factory views with existing data, and preserve truthful maturity labels.

## Recommended Action

Execute Option 2 in checkpoints: map/product truth; core delivery; trust; Factory; operations; polish and qualification.

## Acceptance Criteria

- [ ] Complete backend-to-product capability and route map exists.
- [ ] Navigation reflects the enterprise operator decision hierarchy without duplicate concepts.
- [ ] Mission, Plan, WorkOrder, and Attempt expose canonical lineage.
- [ ] Verification, evidence, approvals, and release readiness are candidate-bound and discoverable.
- [ ] Factory, Factory Version, Execution Profile, capabilities, and routing use authoritative data.
- [ ] Health, Control Plane, Work Ledger, Audit, and observability are coherent and cross-linked.
- [ ] Live controls are wired; maturity, loading, empty, error, and degraded states are truthful.
- [ ] Changed surfaces pass accessibility, responsive, browser, regression, authorization, and golden-path checks.
- [ ] Phase 2 convergence and feature-matrix documentation is complete.

## Work Log

### 2026-09-09 - Discovery

- Read the full 60-part Phase 2 execution scope and product doctrine.
- Created `codex/phase-2-convergence` from the exact qualified baseline.
- Began route, schema, API, test, and existing-view inventory before UI changes.
