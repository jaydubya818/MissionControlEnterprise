---
title: Phase 3 Enterprise Product Surface Rationalization
status: proposed
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-09
---

# Phase 3 enterprise product surface rationalization

## Decision status

**PROPOSED — PRODUCT OWNER APPROVAL REQUIRED**

This document defines the recommended enterprise product boundary. It does not
authorize route deletion, navigation changes, or maturity promotion. Phase 3
release qualification remains gated until the Product Owner approves or adjusts
this recommendation set.

The exhaustive 104-route decision record is
[`PHASE_3_PRODUCT_SURFACE_INVENTORY.csv`](./PHASE_3_PRODUCT_SURFACE_INVENTORY.csv).

## Repository boundary

```text
UPSTREAM_REPOSITORY: jaydubya818/MissionControl
UPSTREAM_BASELINE: ffd58077989a23004819a85f529ca74c955b1422
ENTERPRISE_REPOSITORY: jaydubya818/MissionControlEnterprise
```

This work applies only to `MissionControlEnterprise`. The upstream
`MissionControl` repository remains the unchanged reference implementation and
Labs source. Full verification is recorded in
[`ENTERPRISE_UPSTREAM_PROVENANCE.md`](./ENTERPRISE_UPSTREAM_PROVENANCE.md).

## What was evaluated

The inventory covers every member of the `MainView` route contract:

- 100 destinations in the historical navigation;
- 2 additional destinations introduced by the EOS navigation; and
- 2 non-menu detail views for Mission and automation-run deep links.

That produces 104 distinct view identifiers with no missing or duplicate
records. The automation row records both its list and definition-detail URL
shape. Mission detail records the canonical `/v2/missions/:missionId` shape;
the legacy query-string form is an alias to deprecate during implementation.

Each route was tested against six questions: contribution to the factory job,
authoritative backend ownership, duplication, Mission Control fit, enterprise
legibility, and the consequence of removal. Evidence came from the route
registry, both navigation configurations, render ownership, direct Convex API
usage, the Phase 2 backend/product map, the feature matrix, and the inherited
authorization baseline.

## Current-state finding

The implementation has one strong governed software-factory core surrounded by
a much larger historical surface:

| Current contract | Count |
| --- | ---: |
| Declared Live | 23 |
| Declared Preview | 26 |
| Declared Demo | 7 |
| Undeclared views | 48 |
| **Total views** | **104** |

The inherited route registry is not a sufficient enterprise boundary. Some
declared Live pages are useful supporting capabilities but do not yet deserve
the full production claim. Many undeclared pages remain directly deep-linkable
and several touch the inherited 184-function unauthorized read-only debt.

## Recommended disposition

| Recommendation | Count | Meaning |
| --- | ---: | --- |
| KEEP — LIVE | 17 | Full Phase 3 qualification contract, including 2 detail routes |
| KEEP — PREVIEW | 14 | Security closure, smoke coverage, truthful labeling, and isolation from Live claims |
| CONSOLIDATE WITH canonical route | 34 | Preserve the job in a stronger authoritative surface; add deterministic migration behavior |
| MOVE TO LABS | 19 | Retain only in an explicitly experimental boundary |
| HIDE FROM ENTERPRISE NAV | 5 | Keep as support/developer access, not as a product domain |
| DEPRECATE | 2 | Maintain a bounded migration path before removal |
| REMOVE | 13 | Outside the enterprise software-factory product |
| **Total** | **104** | |

### Proposed Live contract

These are the only routes recommended for unrestricted enterprise release
qualification:

| Domain | Route | Product job |
| --- | --- | --- |
| Overview | `/v2/command-center` | Attention, exceptions, readiness, and action |
| Operate | `/v2/missions` | Intent, plan, and outcome governance |
| Operate | `/v2/missions/:missionId` | One Mission's authoritative lifecycle |
| Operate | `/v2/control-work-orders` | Delivery contract and execution lineage |
| Operate | `/v2/tasks` | Bounded work and Attempts |
| Operate | `/v2/control-approvals` | Exact-candidate decisions |
| Factory | `/v2/projects` | Factory Definition, Version, Profile, and readiness |
| Factory | `/v2/factory` | Factory runs |
| Factory | `/v2/agents` | Agent fleet |
| Control | `/v2/model-routing` | Explainable model routing |
| Control | `/v2/automations[/:automationId]` | Governed automation definitions |
| Control | `/v2/automation-runs/:runId` | Automation execution evidence |
| Control | `/v2/atc` | Queue, admission, and capacity |
| Control | `/v2/identity` | Human and service authority |
| Control | `/v2/deployments` | Release, deployment, verification, and rollback |
| Observe | `/v2/trace-inspector` | Execution traces and evaluations |
| Observe | `/v2/audit` | Governance and security history |

The primary navigation contains 15 Live destinations; Mission detail and
automation-run detail remain contextual deep links rather than menu items.

### Proposed Preview contract

The following capabilities remain valuable but should not carry an
unrestricted enterprise claim yet:

| Route | Why it remains Preview |
| --- | --- |
| `/v2/policies` | Server enforcement is qualified; policy authoring still needs full route security proof. |
| `/v2/dag` | Task relations are authoritative, but a dependency read is in authorization debt. |
| `/v2/telemetry` | Current signals are real; a canonical incident aggregate and degraded-mode contract are missing. |
| `/v2/analytics` | Usage is partial and provider cost may be unknown. |
| `/v2/factory-health` | Real component data exists, but the current route is mixed with Demo projections. |
| `/v2/harness-work-ledger` | Durable lineage exists; the dedicated read is in authorization debt. |
| `/v2/code` | Pipeline data is useful but the end-to-end build contract is incomplete. |
| `/v2/skills` | Context governance is real but supporting, global, and not required for the golden path. |
| `/v2/memory` | Workspace knowledge is useful but needs route-level isolation and persistence proof. |
| `/v2/operator-evals` | Evaluations support improvement but are not an operating-system prerequisite. |
| `/v2/harness-loops` | The backend is substantial, but the route is broader than the bounded pilot. |
| `/v2/gateway` | Integration state is real; a gateway read remains in authorization debt. |
| `/v2/harness-code-review-wizard` | Repository setup is partial and externally dependent. |
| `/v2/harness-meta-loop` | Improvement proposals are advisory and need explicit acceptance-authority proof. |

Factory Health is a target Preview recommendation, not an automatic promotion.
Its Demo projection must be removed or isolated and its real admission,
capacity, trust, and availability dimensions must pass the Preview contract
before the registry changes.

## Recommended enterprise information architecture

```text
OVERVIEW
  Command Center

OPERATE
  Missions
  Work Orders
  Tasks & Attempts
  Approvals

FACTORY
  Factory Registry
  Factory Runs
  Agent Fleet

CONTROL
  Routing Decisions
  Automations
  Execution Queue
  Identities & Authority
  Releases & Deployments

OBSERVE
  Observability & Evals
  Audit Trail

PREVIEW (collapsed and visibly labeled)
  Policies
  Task Graph
  Incidents & Telemetry
  Cost & Usage
  Factory Health
  Work Ledger
  Pipelines
  Context Catalog
  Memory
  Operator Evals
  Harnesses & Loops
  Gateway
  Code Review Setup
  Improvement History

LABS (disabled by default)
  Approved experimental routes only
```

Documentation should remain reachable through Help and contextual links, not
as a primary operating domain. Developer-only Database and Design DNA surfaces
should require an explicit support/development path. Search should become a
capability within Context Catalog or the command palette rather than another
navigation domain.

## Important maturity corrections

Five currently Live routes are intentionally downgraded to Preview:

- Incidents & Telemetry lacks the canonical incident and degraded-state model
  required by its label.
- Context Catalog and Memory are valuable supporting knowledge capabilities,
  but removing either would not break the bounded factory golden path and both
  need Phase 3 isolation proof.
- Operator Evals is an improvement surface, not a prerequisite for operating
  the factory.
- Harnesses & Loops has a real backend but is too broad to include in the first
  unrestricted enterprise qualification boundary.

The dedicated Factory Health and Work Ledger routes move toward Preview only
after Demo isolation and authorization debt are corrected. No route is promoted
to Live by this decision.

## Security interpretation

The exact baseline replay passed with 917 public functions scanned, 733
authorized, 184 ratcheted unauthorized read-only functions, zero Live
unauthorized functions, and zero unauthorized mutations/actions. That is a
regression-safe inherited baseline, not a Phase 3 release approval.

The matrix identifies routes known to touch authorization debt. A route that is
consolidated, moved to Labs, hidden, deprecated, or removed must not remain a
deep-link bypass around enterprise navigation. Preview and Labs access must also
enforce company/workspace scope; labels and feature flags are not security
boundaries.

## Implementation contract after approval

1. Make the enterprise route registry the authority for navigation and direct
   URL admission in every shell configuration.
2. Render only the 15 approved Live menu destinations by default.
3. Put the 14 Preview destinations behind one explicit, labeled Preview policy.
4. Keep Labs disabled by default and excluded from production claims.
5. Add deterministic canonical redirects for consolidation decisions; do not
   silently redirect invalid or unauthorized object IDs.
6. Return an explicit not-found or unavailable state for removed routes and
   verify that stale deep links cannot access their data.
7. Remove implementation only after dependency and deep-link analysis proves it
   is safe; retain migration notes for deprecated routes.
8. Run the full Live acceptance contract only against the approved Live set.
9. Run security, basic functional smoke, labeling, and isolation checks against
   Preview and Labs surfaces.

## Approval requested

Approve this boundary as written, or identify route-level changes in the CSV.
Navigation implementation, route removal, and full Phase 3 release
qualification must not start until that decision is recorded.
