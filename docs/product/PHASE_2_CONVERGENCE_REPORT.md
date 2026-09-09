---
title: Phase 2 Convergence and Productization Report
status: complete-with-limitations
baseline: 5f1e232bb5c1130a718c5289ba5ff0b2eccbe748
updated: 2026-09-09
---

# MISSION CONTROL — PHASE 2 CONVERGENCE & PRODUCTIZATION RESULT

## Overall

**PASS WITH LIMITATIONS.** The proven Factory architecture was not changed. Forty capabilities were mapped before product work. The primary EOS shell now presents one operator model—Overview, Operate, Factory, Control, Observe, Build, Knowledge and Labs—and routes the qualified delivery journey to the existing authoritative screens.

Baseline: `5f1e232bb5c1130a718c5289ba5ff0b2eccbe748`

Resulting commits:

- `7d6be98` — backend → product capability map
- `cc4d940` — operator navigation convergence
- `449ae08` — governed operator-surface connections
- final qualification/documentation checkpoint — this report, feature matrix, browser evidence and route smoke contract

## Backend → product convergence

- Capabilities mapped: **40** in [PHASE_2_BACKEND_PRODUCT_MAP.md](PHASE_2_BACKEND_PRODUCT_MAP.md).
- Backend capabilities newly surfaced or made first-class: **5** — Approvals, Attempt terminology, Factory Registry, Factory Version, and Execution Profile.
- Duplicate/redundant product concepts corrected: **3** — Objectives removed from primary Mission navigation; Approval separated from Audit; authoritative Factory configuration moved from Settings into Factory.
- Architecture duplicated: **0**. All changes use existing Convex tables, APIs and read models.

## Navigation

Before: 11 top-level EOS groups mixed strategy, delivery, operations, intelligence, governance, administration and developer tools. Mission intent appeared twice; Approvals was absent; Approval and Audit were conflated; Factory configuration was under Settings.

After: 8 operator-job groups:

1. Overview — Command Center
2. Operate — Missions, Work Orders, Tasks & Attempts, Approvals
3. Factory — Factory Registry, Factory Runs, Agent Fleet, Routing Decisions, Harnesses & Loops
4. Control — Policies, Automations, Execution Queue, Identities & Authority, Releases & Deployments
5. Observe — Observability & Evals, Audit Trail, Incidents & Telemetry, Cost & Usage, Factory Health
6. Build — Pipelines, Task Graph, code review and quality tools
7. Knowledge — Context Catalog, lifecycle/evals, Memory and Documentation
8. Labs — explicitly gated Preview/Demo experiments

Route registry truth remains **23 Live / 26 Preview / 7 Demo** across 56 declarations. Undeclared routes remain hidden. Preview and Demo routes require their explicit flags and receive visible badges.

## Mission / delivery

| Area | Result | Evidence |
| --- | --- | --- |
| Mission | PASS | `missions.getScoped` joins plans, assertions, WorkOrders, Attempts, approvals, verification, evidence and gates; `/v2/missions/:id` presents intent, required action, plan, execution, WorkOrders, Verification & Evidence, and activity. |
| Plan | PASS | Existing Mission Plan workspace keeps revision/approval/materialization governed by `missions.savePlanDraft`, `submitPlan`, `approvePlan`, `rejectPlan`, and `forkPlanRevision`. |
| WorkOrder | PASS | `/v2/control-work-orders` remains the strongest canonical inspector, backed by `workOrders.list/get/factoryOverview/revisionHistory/governanceValidity`. |
| Attempt | PASS | WorkOrder execution inspector exposes frozen manifest, Factory Version, runtime, agent/model/tools/harness, routing, Candidate, verification, evidence and recovery. Task and Attempt are now named distinctly in primary navigation. |

## Factory

| Area | Result | Evidence |
| --- | --- | --- |
| Factory Registry | PASS | `/v2/projects` now identifies itself as Factory Registry and reuses `factory/configuration.list/getDetail/create`. |
| Factory Version | PASS | Existing immutable version/digest/readiness/activation flow is explicitly named; `createVersion`, `assessReadiness`, `activate` remain authoritative. |
| Execution Profiles | PASS | Existing backend selection, Sandbox Profile, budget, risk, verifier and recovery boundary is now presented as the governed Execution Profile. |
| Capabilities | PARTIAL | Existing agent versions, harness manifests, context verifiers, model catalog, scopes and sandbox profiles are composed by Factory admission; the broad Capability Catalog remains Demo. |
| Agent Fleet | PASS | `/v2/agents` is discoverable in Factory; identity/version and runtime records remain separate. |
| Harness | PASS | `/v2/harness-loops` is Live and exact harness pins remain visible on Attempt manifests. |

## Routing

| Area | Result | Evidence |
| --- | --- | --- |
| Factory routing | PASS | WorkOrder dispatch binds `factoryDefinitionVersionId` and configuration digest. |
| Execution Profile routing | PASS | Execution backend/Sandbox Profile and immutable manifest are pinned before execution. |
| Model routing | PASS | `modelRoutingDecisions` and `/v2/model-routing` retain server-authorized route selection. |
| Routing explainability | PASS | Attempt inspector exposes selected tuple, provider, source, policy/algorithm version, decision digest, evidence cutoff/coverage, explanation and fallback. |

## Trust

| Area | Result | Evidence |
| --- | --- | --- |
| Verification | PASS | Exact-subject independent verification is visible in Mission execution and Attempt inspector. |
| Evidence | PASS | Review Evidence Package exposes criteria, envelope IDs, provenance, digests, currentness and raw-source escape hatch. |
| Approvals | PASS | Decision Center displays requested decision, authority, scope, evidence, unknowns, blockers, dispatch effect and exact-candidate resume behavior. |
| Release Readiness | PASS | `factory/releases.*` distinguishes eligibility, approval, deploy, verify, promote and rollback against the exact Candidate. |

## Operations

| Area | Result | Evidence |
| --- | --- | --- |
| Overview / Command Center | PASS | Attention-first queue, exceptions, automation posture, workforce, capacity and readiness; approval actions now open Decision Center. |
| Factory Health | PARTIAL | Live readiness and capacity signals exist; the dedicated `/v2/factory-health` route remains truthfully Demo. |
| Control Plane | PASS | Live authority is distributed across Decision Center, identity, automation, queue and Attempt/Factory details; Preview policy authoring is not overstated. |
| Work Ledger | PARTIAL | Durable Mission/WorkOrder/run/evidence/approval/release events exist and appear in scoped timelines; the dedicated ledger route is not promoted. |
| Audit | PASS | `/v2/audit` is now clearly historical Audit Trail, not an approval workspace. |
| Observability | PASS | `/v2/trace-inspector` exposes workspace dashboards and exact trace detail from `observability.getWorkspaceDashboard/getTraceDetail`. |

## Product truth

- No-op controls remaining on the qualified primary Live journey: **0 identified**. The non-operational “Swarm live” button was replaced by status.
- Misleading Live surfaces in the qualified primary journey: **0 identified** after navigation convergence.
- Demo/Preview surfaces clearly labeled: **PASS** through route capability badges and feature-gated visibility.

## Security regression

- Live unauthorized: **0**
- P0: **0**
- P1: **0**
- P2: **0**
- Unauthorized mutations/actions: **0**
- Remaining non-Live read-only: **184**
- Authorization scan: **917 total / 733 authorized / 0 declared-public / 184 ratcheted debt — PASS**.

## Golden-path regression

- Technical golden path: **PASS**
- Factory Version identity: **PASS**
- Execution Profile identity: **PASS**
- Candidate binding: **PASS**
- Verification independence: **PASS**
- Evidence currentness: **PASS**
- Approval authority: **PASS**
- Release binding: **PASS**

`pnpm run qualify:enterprise-golden-path` passed the full-system Factory V2 fixture, 34 authentication/tenant tests, 54 governed lifecycle/fail-closed tests, service replay protection, client auth contract and documentation consistency. Generated evidence is in `docs/testing/evidence/enterprise-golden-path/`.

## Qualification

| Gate | Result | Detail |
| --- | --- | --- |
| Build | PASS | `pnpm run build` |
| Lint | PASS | Typecheck is clean; repository skill/document consistency checks pass. |
| Typecheck | PASS | `pnpm run typecheck` across 19 workspace projects. |
| Unit | PASS | Effective total **1,991 passed / 1 skipped** after rerunning the two socket-restricted adapter cases outside the sandbox. |
| Integration | BLOCKED | Root `pnpm test:integration` runner hardening remains explicitly deferred; package and Factory integration suites pass. |
| E2E | PASS | `pnpm run test:e2e:critical`: **9/9**. |
| Browser | PASS | Desktop navigation/route checks, responsive shell, keyboard reachability and critical axe checks pass. |
| Authorization | PASS | Ratchet unchanged at 184 non-Live read-only functions. |
| Golden path | PASS | Enterprise golden-path qualifier complete. |
| Dependency audit | FAIL — DEFERRED | Production: 4 high and 4 unaccepted moderate advisories; dependency changes are outside this convergence scope. |

Browser screenshots:

- [Factory Registry](../testing/evidence/phase-2-convergence/factory-registry.png)
- [Decision Center](../testing/evidence/phase-2-convergence/decision-center.png)

## Top product gaps closed

1. Replaced architecture-shaped navigation with an operator-job information architecture.
2. Made live Approvals discoverable and corrected every Command Center approval link to Decision Center.
3. Separated authority decisions from historical Audit.
4. Surfaced the existing Factory Definition/Version/Execution Profile implementation as Factory Registry.
5. Clarified Mission, WorkOrder, Task, Attempt, Candidate, verification and evidence terminology without new domain models.

## Remaining Phase 2 limitations

1. Dedicated Factory Health and Work Ledger pages are not Live; qualified data is available through existing Live components and scoped timelines.
2. Capability Catalog, cost analytics, policy authoring, Task Graph and advanced build/review surfaces remain Preview or Demo.
3. Browser evidence used the repository's shell-only fixture; production Clerk and live two-company isolation were not available.

## Deferred Phase 3 / release-hardening work

1. Production Clerk qualification.
2. Production two-company authenticated browser isolation.
3. Remaining 184 non-Live read-only authorization functions.
4. Root integration-runner hardening.
5. Dependency advisory remediation (including current `fast-uri`, `react-router-dom`, `hono`, `browserslist`, `qs`, Vitest and browser-mapping advisories).
6. Load, soak and failure-injection qualification.
7. Provider and capacity qualification.
8. Canonical incident aggregation and dedicated Live Work Ledger/Factory Health promotion, each only after authorization and browser qualification.

## Final determination

**READY FOR PHASE 3.** Phase 2's convergence objective is met: the primary product journey now exposes the already-qualified Factory without changing its architecture, and all changed Live routes pass build, type, unit, authorization, golden-path, browser and accessibility gates. This is not release-ready: the dependency audit, production identity/isolation evidence, non-Live authorization debt and operational qualification remain explicit Phase 3 gates.
