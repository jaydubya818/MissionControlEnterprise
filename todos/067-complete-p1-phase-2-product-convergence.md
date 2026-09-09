---
status: complete
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

- [x] Complete backend-to-product capability and route map exists.
- [x] Navigation reflects the enterprise operator decision hierarchy without duplicate concepts.
- [x] Mission, Plan, WorkOrder, and Attempt expose canonical lineage.
- [x] Verification, evidence, approvals, and release readiness are candidate-bound and discoverable.
- [x] Factory, Factory Version, Execution Profile, capabilities, and routing use authoritative data.
- [x] Health, Control Plane, Work Ledger, Audit, and observability are coherent and cross-linked at their truthful maturity levels.
- [x] Live controls are wired; maturity, loading, empty, error, and degraded states are truthful in the qualified primary journey.
- [x] Changed surfaces pass accessibility, responsive, browser, regression, authorization, and golden-path checks.
- [x] Phase 2 convergence and feature-matrix documentation is complete.

## Work Log

### 2026-09-09 - Discovery

- Read the full 60-part Phase 2 execution scope and product doctrine.
- Created `codex/phase-2-convergence` from the exact qualified baseline.
- Began route, schema, API, test, and existing-view inventory before UI changes.

### 2026-09-09 - Convergence

- Mapped 40 capabilities and retained the 23 Live / 26 Preview / 7 Demo route contract.
- Reorganized the EOS shell around Overview, Operate, Factory, Control, Observe, Build, Knowledge, and Labs.
- Connected Command Center approval exceptions to Decision Center and separated Audit Trail.
- Surfaced the existing Factory Definition, Factory Version, and Execution Profile configuration as Factory Registry.
- Replaced a no-op Swarm control with truthful status.

### 2026-09-09 - Qualification

- Build, lint, typecheck, authorization, secrets, documentation, enterprise golden path, Convex tests, and critical browser/accessibility suites passed.
- Two socket-restricted automation adapter tests passed when rerun with local IPC/network permission.
- Root integration-runner configuration and dependency advisories remain documented Phase 3 release-hardening gates.
