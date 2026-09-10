---
title: Phase 3 Product Surface Dependency Analysis
status: complete
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-09
---

# Phase 3 product surface dependency analysis

## Decision

No backend capability, Convex table, query, mutation, action, runtime module,
worker path, verification function, evidence function, approval function,
release function, or observability primitive is physically deleted during the
product-surface cutover.

The implementation follows this order:

1. remove historical destinations from enterprise navigation;
2. stop admitting removed routes and redirect consolidated/deprecated routes;
3. remove links from Live surfaces that make Labs appear required;
4. preserve view components and shared backend capability; and
5. consider physical deletion only in a later change with import, API, runtime,
   qualification, and golden-path evidence.

`git diff --name-only --diff-filter=D -- apps convex packages scripts` is empty
for this checkpoint. The todo files were renamed only to record workflow status;
no implementation file was deleted.

## Preserved dependency boundaries

| Required boundary | Dependency finding | Action |
| --- | --- | --- |
| KEEP — LIVE routes | Live views share agents, tasks, projects, schedules, approvals, alerts, workflow runs, evidence, and repository data with historical views. | Preserve shared UI models and all backend modules. |
| KEEP — PREVIEW routes | Preview uses context registry, metrics, policy, gateway, learning, health, ledger, and repository setup APIs that also support Factory qualification and operations. | Preserve and security-qualify; do not delete. |
| Enterprise golden path | Mission → Plan → WorkOrder → Attempt → Candidate → Verification → Evidence → Approval → Release spans shared Convex modules. | Preserve all domain and test fixtures. |
| Factory V2 | Factory definitions, immutable versions, readiness, profiles, admission, leases, routing, and workers are independent of menu placement. | Preserve all Factory V2 code and tests. |
| Runtime execution | Worker, orchestration, sandbox, tool, provider, and service-command code is not owned by presentation routes. | Preserve; qualify separately in Phase 3. |
| Authorization | Several removed, Labs, consolidated, and Preview views touch the inherited authorization-debt set. | Make routes unreachable or gated first; remediate admitted Preview closures without deleting shared functions blindly. |
| Observability | Live Command Center, Audit, WorkOrders, and Trace Inspector consume alerts, events, traces, and evidence also referenced by legacy views. | Preserve the shared records and authorized reads. |

## Removed product entry points

| Route | Former renderer / capability | Shared dependency risk | Physical deletion decision |
| --- | --- | --- | --- |
| `/v2/people` | `PeopleView`, organization membership | Organization/member data can participate in identity and authority. | Preserve implementation and backend. |
| `/v2/org` | `OrgView`, organization hierarchy | Role/team structures may support WorkOrder ownership and authorization. | Preserve implementation and backend. |
| `/v2/office` | `OfficeView`, agents and tasks | Uses canonical agents/tasks and includes agent mutations. | Preserve shared APIs; route is unavailable. |
| `/v2/live-office` | `LiveOfficeView`, agents, tasks, activities | Uses canonical workforce and activity data. | Preserve shared APIs; route is unavailable. |
| `/v2/telegraph` | `TelegraphInbox`, messaging | Messaging may support external notification paths. | Preserve pending service/notification dependency analysis. |
| `/v2/meetings` | `MeetingsView`, meeting/action-item records | Action-item conversion may touch Tasks. | Preserve pending dependency proof. |
| `/v2/voice` | `VoicePanel`, provider action and artifacts | Provider/agent dependencies require separate credential review. | Preserve pending provider-boundary analysis. |
| `/v2/content-pipeline` | `ContentPipelineView`, contentDrops plus Tasks/Agents | Reuses canonical Tasks and Agents. | Preserve shared APIs and legacy implementation. |
| `/v2/crm` | `CrmView`, agent projection | Reuses canonical Agents. | Preserve shared APIs; route is unavailable. |
| `/v2/hiring` | `HiringView`, agentHiring records | May inform future Agent Fleet capacity but is outside current product. | Preserve backend pending explicit retirement decision. |
| `/v2/team` | `TeamView`, static role projection and Agent links | Links into retained Agent/Identity surfaces. | Preserve component pending import cleanup. |
| `/v2/feedback` | `FeedbackView`, QC findings, approvals, alerts, activities | Reuses retained verification, approval, and observability data. | Preserve shared APIs; route is unavailable. |
| `/v2/control-portfolio` | `FactoryOverviewView`, WorkOrder/approval entry points | Component links to retained core routes. | Preserve component; remove only the standalone entry point. |

## UI-only isolation changes

- The enterprise shell is now the only admitted shell. The legacy shell source
  remains present but cannot be enabled by a production feature flag.
- Factory Health Preview renders only the real `FactoryOpsView`; the Demo
  `FactoryHealthView` remains in source for Labs/reference use.
- The Labs flag no longer inserts a demo tour, demo Mission, demo timeline, or
  demo health/recommendation fallback into Live Command Center.
- Live Automation surfaces no longer direct operators to Workshop as if it
  were a required production workflow. Workflow identity remains visible and
  WorkOrder links remain authoritative.

## Deletion gate for future changes

A physical deletion may proceed only when all of these are true:

- no retained Live or Preview import reaches the target;
- no canonical golden-path or Factory V2 test references the target;
- no routing, Factory Version, Execution Profile, worker, verification,
  evidence, approval, release, authorization, or Live observability closure
  reaches the target;
- no service/CLI/runtime caller uses the API;
- no persisted record requires the code for interpretation or recovery;
- a deterministic migration or retirement path exists; and
- full authorization, Factory V2, golden-path, typecheck, build, and browser
  gates pass after deletion.

Until then, unreachable implementation is explicit preservation, not proof of
dead code.
