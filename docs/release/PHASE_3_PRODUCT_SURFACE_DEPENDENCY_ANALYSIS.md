---
title: Phase 3 Product Surface Dependency Analysis
status: complete
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-10
---

# Phase 3 product surface dependency analysis

## Decision

No backend capability, Convex table, runtime module, worker path, verification
function, evidence function, approval function, release function, or required
observability primitive is physically deleted during the product-surface
cutover. Obsolete frontend renderers were removed only after their route was
made unreachable and import/reference analysis proved that no retained Live,
Preview, Factory V2, golden-path, CLI, service, or runtime path used them.

The implementation follows this order:

1. remove historical destinations from enterprise navigation;
2. stop admitting removed routes and redirect consolidated/deprecated routes;
3. remove links from Live surfaces that make Labs appear required;
4. preserve every shared backend capability, then internalize unnecessary
   public reads without deleting their handlers; and
5. prune only obsolete route-specific UI components whose retained dependency
   closure is empty.

This checkpoint deletes route-specific UI components. It does not delete any
Convex module, package, CLI, runtime service, data model, or worker capability.
The public API is reduced by converting 149 inherited reads to `internalQuery`,
not by removing their implementation.

The route-less outbound webhook subsystem is also preserved, but its unused
create/update/remove/delivery entry points are internal-only. Webhook targets
must be public HTTPS hosts without embedded credentials or non-standard ports;
this prevents an unadmitted backend from remaining an accidental network entry
point.

## Preserved dependency boundaries

| Required boundary | Dependency finding | Action |
| --- | --- | --- |
| KEEP — LIVE routes | Live views share agents, tasks, projects, schedules, approvals, alerts, workflow runs, evidence, and repository data with historical views. | Preserve shared UI models and all backend modules. |
| KEEP — PREVIEW routes | Preview uses context registry, metrics, policy, gateway, learning, health, ledger, and repository setup APIs that also support Factory qualification and operations. | Preserve and security-qualify; do not delete. |
| Enterprise golden path | Mission → Plan → WorkOrder → Attempt → Candidate → Verification → Evidence → Approval → Release spans shared Convex modules. | Preserve all domain and test fixtures. |
| Factory V2 | Factory definitions, immutable versions, readiness, profiles, admission, leases, routing, and workers are independent of menu placement. | Preserve all Factory V2 code and tests. |
| Runtime execution | Worker, orchestration, sandbox, tool, provider, and service-command code is not owned by presentation routes. | Preserve; qualify separately in Phase 3. |
| Authorization | Several removed, Labs, consolidated, and Preview views touched the inherited authorization-debt set. | Routes were isolated first; all 157 inherited findings were then authorized, declared as bounded health probes, or internalized while preserving handlers. |
| Observability | Live Command Center, Audit, WorkOrders, and Trace Inspector consume alerts, events, traces, and evidence also referenced by legacy views. | Preserve the shared records and authorized reads. |

## Removed product entry points

| Route | Former renderer / capability | Shared dependency risk | Physical deletion decision |
| --- | --- | --- | --- |
| `/v2/people` | `PeopleView`, organization membership | Organization/member data can participate in identity and authority. | Remove obsolete renderer; preserve and internalize backend membership reads. |
| `/v2/org` | `OrgView`, organization hierarchy | Role/team structures may support WorkOrder ownership and authorization. | Remove obsolete renderer; preserve authorization data and backend handlers. |
| `/v2/office` | `OfficeView`, agents and tasks | Uses canonical agents/tasks and includes agent mutations. | Remove obsolete renderer; preserve canonical Agent/Task APIs. |
| `/v2/live-office` | `LiveOfficeView`, agents, tasks, activities | Uses canonical workforce and activity data. | Remove obsolete renderer; preserve canonical workforce and observability APIs. |
| `/v2/telegraph` | `TelegraphInbox`, messaging | Messaging may support external notification paths. | Remove obsolete renderer; preserve Telegraph service/package and internalized reads. |
| `/v2/meetings` | `MeetingsView`, meeting/action-item records | Action-item conversion may touch Tasks. | Remove obsolete renderer; preserve meeting backend and task conversion capability internally. |
| `/v2/voice` | `VoicePanel`, provider action and artifacts | Provider/agent dependencies require separate credential review. | Remove obsolete renderer; preserve provider action and internal artifact read. |
| `/v2/content-pipeline` | `ContentPipelineView`, contentDrops plus Tasks/Agents | Reuses canonical Tasks and Agents. | Remove obsolete renderer and E2E entry; preserve shared APIs and internal content handlers. |
| `/v2/crm` | `CrmView`, agent projection | Reuses canonical Agents. | Remove obsolete renderer; preserve canonical Agents. |
| `/v2/hiring` | `HiringView`, agentHiring records | May inform future Agent Fleet capacity but is outside current product. | Remove obsolete renderer; preserve hiring backend internally. |
| `/v2/team` | `TeamView`, static role projection and Agent links | Links into retained Agent/Identity surfaces. | Remove obsolete renderer; preserve canonical Agent and Identity destinations. |
| `/v2/feedback` | `FeedbackView`, QC findings, approvals, alerts, activities | Reuses retained verification, approval, and observability data. | Remove obsolete renderer; preserve canonical verification, approval, and alert APIs. |
| `/v2/control-portfolio` | `FactoryOverviewView`, WorkOrder/approval entry points | Component links to retained core routes. | Preserve component; remove only the standalone entry point. |

## Consolidated-source pruning

After redirects were established, duplicate route renderers for Home,
Directory, Goals, QC dashboards, workflow dashboards, and ten legacy Harness
views were removed. Their useful capabilities remain at the documented
canonical destinations: Command Center, Agent Fleet, Missions, WorkOrders,
Policies, Automations, Releases, Analytics, and Factory Health. Redirects
continue to preserve scope and supported query parameters.

## Product-surface isolation changes

- The enterprise shell is now the only admitted shell. The legacy shell source
  remains present but cannot be enabled by a production feature flag.
- Factory Health Preview renders only the real `FactoryOpsView`; the Demo
  `FactoryHealthView` remains in source for Labs/reference use.
- The Labs flag no longer inserts a demo tour, demo Mission, demo timeline, or
  demo health/recommendation fallback into Live Command Center.
- Live Automation surfaces no longer direct operators to Workshop as if it
  were a required production workflow. Workflow identity remains visible and
  WorkOrder links remain authoritative.
- Live Command Center and Work Orders no longer import, render, or invoke demo
  projections or seed controls. Demo fixtures remain isolated in Labs/reference
  modules.
- Legacy section switches no longer import or render removed People, Org,
  Office, Communications, Quality, Goals, Feedback, Content, or workflow
  dashboard components.

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
