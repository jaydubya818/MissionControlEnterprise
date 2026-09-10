---
title: Phase 3 Enterprise Route Consolidation Map
status: implemented
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-09
---

# Phase 3 enterprise route consolidation map

## Redirect contract

All 34 approved consolidations are encoded in
`enterpriseRouteContract.ts`. A stale source URL is recognized before its old
view renders, then replaced with the canonical destination. Existing query
parameters, including company and workspace scope, are preserved. The redirect
adds `mcRouteNotice=consolidated` and `mcRouteSource=<source>` so the operator is
told why the location changed.

If the canonical destination is Preview and Preview access is disabled, the
operator is sent to Command Center with an explicit Preview-unavailable notice.
The redirect never treats a feature flag as authorization and never translates
an unverified legacy object ID into a canonical object ID.

| Source surface | Canonical destination | Capability preserved | Deep-link / redirect strategy |
| --- | --- | --- | --- |
| `/v2/home` | `/v2/command-center` | Operator overview, attention, and exception posture | Preserve scope; replace URL and show consolidation notice. |
| `/v2/directory` | `/v2/agents` | Agent templates, versions, and fleet registration | Preserve scope and filters; open Agent Fleet. |
| `/v2/calendar` | `/v2/automations?tab=schedule` | Time-based governed work | Preserve scope; select the authoritative Schedule tab. |
| `/v2/registry-lifecycle` | `/v2/skills?tab=lifecycle` | Context-package lifecycle | Preserve package/scope parameters; select Lifecycle. |
| `/v2/registry-evaluate` | `/v2/skills?tab=evaluate` | Context and skill evaluation | Preserve package/scope parameters; select Evaluate. |
| `/v2/registry-inventory` | `/v2/skills?tab=inventory` | Context inventory | Preserve scope and select Inventory. |
| `/v2/registry-installations` | `/v2/skills?tab=installations` | Installation and activation state | Preserve scope and select Installations. |
| `/v2/registry-runs` | `/v2/skills?tab=evals` | Evaluation receipts and history | Preserve scope and select Evaluation Runs. |
| `/v2/search` | `/v2/skills` | Context/package discovery; global record lookup remains in the command palette | Preserve search parameters; open the gated Context Catalog. |
| `/v2/schedule` | `/v2/automations?tab=schedule` | Workflow-run scheduling | Preserve scope; select the authoritative Schedule tab. |
| `/v2/metrics` | `/v2/analytics` | Cost, quota, and usage metrics | Preserve scope/window parameters; open gated Cost & Usage. |
| `/v2/qc-dashboard` | `/v2/control-work-orders` | Verification posture attached to delivery | Preserve scope and known WorkOrder parameter; open authoritative delivery records. |
| `/v2/qc-runs` | `/v2/control-work-orders` | Verification-run status and evidence | Preserve scope; do not invent a WorkOrder mapping for an unverified QC ID. |
| `/v2/qc-environments` | `/v2/projects` | Qualified execution-environment configuration | Preserve scope; open Factory Registry and Execution Profiles. |
| `/v2/qc-findings` | `/v2/control-work-orders` | Findings tied to exact Candidate and verification evidence | Preserve scope and known WorkOrder parameter; open review evidence. |
| `/v2/qc-metrics` | `/v2/analytics` | Verification trend metrics | Preserve scope/window parameters; open gated Cost & Usage. |
| `/v2/qc-rulesets` | `/v2/policies` | Governed acceptance and quality constraints | Preserve scope; open gated policy authoring. |
| `/v2/schedules` | `/v2/automations?tab=schedule` | Agent scheduling | Preserve scope; select the authoritative Schedule tab. |
| `/v2/radar` | `/v2/command-center` | Alerts and exception scanning | Preserve scope; open the attention-first overview. |
| `/v2/pipeline` | `/v2/code` | Build-pipeline projection | Preserve scope; open gated Pipelines. |
| `/v2/ops-schedule` | `/v2/automations?tab=schedule` | Upcoming operational work | Preserve scope; select the authoritative Schedule tab. |
| `/v2/goals` | `/v2/missions` | Outcome intent and lifecycle | Preserve scope; open Mission portfolio without fabricating a Mission ID. |
| `/v2/dossier` | `/v2/control-work-orders` | Candidate-bound review evidence | Preserve scope and known WorkOrder parameter; open qualified evidence package. |
| `/v2/control-fleet` | `/v2/agents` | Agent capacity and workforce state | Preserve scope; open Agent Fleet. |
| `/v2/harness-health` | `/v2/factory-health` | Factory readiness, capacity, integration, and trust signals | Preserve scope; open gated real-data Factory Health. |
| `/v2/harness-control-plane` | `/v2/policies` | Effective execution constraints and authority | Preserve scope; open gated Policies; identity remains linked separately. |
| `/v2/harness-verifiers` | `/v2/control-work-orders` | Independent verification and receipts | Preserve scope and known WorkOrder parameter; open Attempt/review evidence. |
| `/v2/harness-change-review` | `/v2/control-work-orders` | Candidate review, CI, verification, and evidence | Preserve scope and known WorkOrder parameter; open review evidence. |
| `/v2/harness-change-risk` | `/v2/control-work-orders` | Candidate risk and residual findings | Preserve scope and known WorkOrder parameter; open review evidence. |
| `/v2/harness-launch` | `/v2/deployments` | Release eligibility, deployment, verification, promotion, and rollback | Preserve scope and release parameters; open Releases & Deployments. |
| `/v2/harness-team-pulse` | `/v2/command-center` | Workforce and delivery posture | Preserve scope; open the attention-first overview. |
| `/v2/harness-maintenance` | `/v2/automations?tab=schedule` | Recurring maintenance definitions and cadence | Preserve scope; select Schedule. |
| `/v2/harness-automations` | `/v2/automations?tab=overview` | Governed automation definitions and runs | Preserve scope; open the authoritative automation overview. |
| `/v2/harness-agent-fleet` | `/v2/agents` | Agent health, identity, and assignments | Preserve scope; open Agent Fleet. |

## Deprecated routes

The two deprecated routes use the same deterministic machinery but retain their
distinct classification:

- `/v2/execution` opens `/v2/control-work-orders`, where Attempt execution is
  subordinate to the governed WorkOrder.
- `/v2/live-chat` opens the support-only `/v2/chat` route. It remains absent
  from enterprise navigation while the legacy messaging implementation is
  preserved for bounded migration.

## Removed routes

The 13 removed product entry points resolve to Command Center with an explicit
unavailable notice. Their view components and backend modules are not deleted
by this checkpoint. Unknown `/v2/*` locations receive the same explicit
handling and cannot fall through to a persisted unrelated view.
