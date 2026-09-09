---
title: Phase 2 Backend to Product Capability Map
status: active
baseline: 5f1e232bb5c1130a718c5289ba5ff0b2eccbe748
updated: 2026-09-09
---

# Phase 2 backend → product capability map

## Decision

Mission Control already has one authoritative governed factory. Phase 2 will expose and connect these records; it will not create another Mission, Factory, routing, Attempt, evidence, approval, release, or health model. Product priority is attention → trust → authority → lineage → health → outcome.

Maturity comes from `apps/mission-control-ui/src/shellV2/routeCapabilities.ts`. A component, fixture, or polished page does not promote a route.

## Capability map

| Capability | Authoritative backend and storage | API | Current product surface / route | Maturity | Authority / evidence / tests | Product gap |
| --- | --- | --- | --- | --- | --- | --- |
| Company/workspace identity | `tenants`, `projects`, `operators`, roles and assignments; `convex/lib/companyAccess.ts` | workspace access helpers; `projects.*` | workspace selector; `/v2/projects` | Live | server-derived membership; `companyAccess.test.ts` | Keep company/workspace context visible on details. |
| Human authentication | Convex `ctx.auth`; Clerk client boundary | authenticated wrappers and access helpers | application boundary | Live contract | fail closed; `authMode.test.ts`, authorization suite | Production Clerk qualification remains external. |
| Workload identity | `serviceCommandReceipts`; `convex/serviceCommands.ts` | signed service commands | Control Plane detail | Live backend | signature, expiry, replay prevention; `serviceCommandAuth.test.ts` | Surface service identity and command result. |
| Mission / intent | `missions`, `missionEvents`, `missionAssignments` | `missions.list/getScoped/createDraft/updateDraft/start/accept` | Missions and Mission detail | Live | object-derived workspace auth; Mission suites | Make Mission the lifecycle anchor and expose trust/delivery state. |
| Plan | `missionPlans`, `validationAssertions` | `missions.savePlanDraft/submitPlan/approvePlan/rejectPlan/forkPlanRevision` | Mission → Plan | Live | author/approver separation; `missionPlan.test.ts` | Make identity, revision, digest, status and materialized WorkOrders explicit. |
| WorkOrder | `workOrders`, revisions/events/supersessions | `workOrders.list/get/create/dispatch/accept/reopen/supersede` | `/v2/control-work-orders` | Live | governed contract and acceptance; WorkOrder suites | Consolidate contract, routing, execution, trust and delivery in one inspector. |
| Task | `tasks`, dependencies, relations, transitions/events | `tasks.get/listAll/getUnifiedTimeline/create/transition/assign` | `/v2/tasks`, Task Graph | Live / Preview graph | transition authority; Tasks suites | Clarify Task as bounded work, not an execution try. |
| Attempt | `workflowRuns`, `runEvents`, `runArtifacts`, execution traces | WorkOrder detail; internal Factory Attempt claim/report | WorkOrder run inspector; Observability | Live | lease/fencing and immutable execution identity; Factory worker suites | Label Attempt consistently and cross-link its pinned contract. |
| Candidate | immutable source/head/artifact identity on runs, verification subjects and PR evidence | WorkOrder/review read models | Review package and run inspector | Live | exact-current verification; qualification V2 | Promote Candidate identity/digest above generic “artifact” summaries. |
| Factory Definition | `factoryDefinitions` | `factory/configuration.list/getDetail/create` | Factory configuration / Factory Board | Live | workspace manage-automation permission | Converge into one Factories entry and detail. |
| Factory Version | `factoryDefinitionVersions`, readiness assessments | `factory/configuration.createVersion/assessReadiness/activate` | Factory configuration panel | Live | immutable digest, readiness and activation tests | Make version/digest/lifecycle composition directly inspectable. |
| Execution Profile | `factorySandboxProfiles` | `factory/configuration.createSandboxProfile/promoteSandboxProfile/getVersionOptions` | Factory configuration panel | Live backend | admission/currentness; `sandboxProfileAdmission.test.ts` | Give profiles a first-class list/detail projection without a new store. |
| Factory qualification | `factoryReadinessAssessments` | `assessReadiness`, active-context queries | Factory and health panels | Live | expiring assessment bound to configuration digest | Explain blockers and qualification expiry. |
| Workflow | `workflows`, snapshots and `workflowRuns` | workflow/run APIs | Factory, WorkOrder, run inspector | Live | version snapshot and verification contract suites | Use “Workflow” only for execution path, not as a synonym for Factory. |
| Worker and lease | host bindings, WorkflowRun/Attempt lease fields | internal Attempt claim/renew/report | run inspector, queue, health | Live | fencing/currentness; worker-runtime tests | Surface worker/session/generation and lease status together. |
| Runtime and sandbox | sandbox profiles, allocations, credential grants | Factory Attempt internal mutations; orchestration runtime | Attempt and Factory Health | Live backend | constrained credentials, cleanup, egress policy; sandbox suites | Explain isolation and capacity without exposing secrets. |
| Harness | generic harness manifest and frozen execution manifest | harness registry/admission helpers | Loop Engineering and Attempt details | Live | exact manifest/digest admission; harness tests | Consolidate operational harness data; keep educational pages secondary. |
| Model route | `modelCatalog`, policies, overrides, `modelRoutingDecisions` | WorkOrder routing and model-routing APIs | `/v2/model-routing`, WorkOrder dispatch | Live | authorization, eligibility and selection snapshots | Add deterministic “why selected / why rejected” facts. |
| Skills/context | context packages, manifests, locks, installations, configuration scans | context registry and activation APIs | Context Catalog, Memory | Live / Preview subviews | provenance, activation and eval receipts | Present as reusable capabilities, not a competing Factory registry. |
| Tool capability | execution manifests and allowlists | policy/execution APIs | Attempt and Control Plane | Partial | pinned grants and command classes | No canonical general MCP runtime; do not imply one. |
| Routing decision | `modelRoutingDecisions`, WorkOrder execution-routing snapshots | WorkOrder dispatch/read model | WorkOrder routing section | Live | policy → compatibility → qualification → health → selection | Expose inputs, filtered candidates, selected tuple and pinned digests. |
| Verification | `verificationRuns`, subjects/plans/receipts | WorkOrder detail and internal report verification | run inspector / review package | Live | independent verifier and exact candidate; verification suites | Make producer/verifier separation visually explicit. |
| Evidence | `evidenceEnvelopes`, run artifacts, release evidence | WorkOrder/review/release read models | Review Evidence Package | Live | currentness and candidate binding; evidence suites | First-class IDs, provenance, current/stale state and direct links. |
| Approval | `approvalDecisions` and legacy `approvals` | `workOrders.approvalQueue/request/decide`; `approvals.*` | `/v2/control-approvals` | Live | permission and separation-of-duties checks | Consolidate decision packet around exact Candidate and evidence. |
| Release readiness | `factoryReleases`, `factoryReleaseEvidence`, release-gate evaluations | `factory/releases.*` | Deployments and release panel | Live | exact candidate/provenance, explicit deploy/verify/promote states | Distinguish eligible, released, deployed, verified and outcome observed. |
| Control Plane | policies, controls, role/permission data, readiness state | `operatorControls.*`, policy and Factory APIs | Harness Control Plane / Policies | Live + Preview policy | deterministic authority and audit | Consolidate authority facts; do not present recommendations as decisions. |
| Work Ledger | Mission/WorkOrder/run/evidence/approval/release events | existing timeline/read-model queries | Harness Work Ledger | Live backend, product route not yet primary | immutable domain events; observability suites | Make delivery lineage primary and keep Audit security-focused. |
| Audit | `changeRecords`, `opEvents`, activities and security events | audit/change queries | `/v2/audit` | Live | authorized event reads | Separate governance/security record from progress activity. |
| Observability | `executionTraces`, traces, observations, eval definitions/scores | `observability.getWorkspaceDashboard/getTraceDetail` | `/v2/trace-inspector` | Live | trace/eval tests | Add direct Mission → WorkOrder → Attempt → Trace navigation. |
| Factory health | readiness, host bindings, workers, leases, routes and integration state | WorkOrder factory overview and health APIs | Factory Health views | Demo route plus Live component data | health/readiness tests | Replace aggregate color with admission, trust, capacity and availability dimensions; retain truthful maturity. |
| Queue/capacity | Tasks, WorkflowRuns, host bindings, scheduled jobs | queue/ATC/work-order queries | Queue / ATC | Live | bounded scheduling and lease rules | Remove activity-wallpaper language; emphasize admission and backpressure. |
| Automations | automation definitions, decisions, artifacts, evaluations | automation APIs | `/v2/automations` | Live | scoped authority and service commands; automation suites | Show trigger, scope, authority, execution profile and evidence. |
| Scheduling | scheduled jobs and execution queues | scheduled-job APIs | Calendar/Schedule variants | Mixed | scheduler tests | Keep one operator time view and one execution-capacity view only if data differs. |
| Cost/economics | `costEvents`, quota snapshots, metrics | cost/quota/analytics queries | Cost/analytics | Preview | real tokens/runtime values; cost may be unknown | Never infer missing provider cost; expose provenance/sample size. |
| Incidents | alerts, op events and telemetry | alert/telemetry APIs | Incidents | Live route | authorized operational reads/writes | Canonical incident aggregate remains Phase 3 work; present current signals truthfully. |
| Agent fleet | templates, versions, instances, identities and runtime `agents` | agent registry APIs | `/v2/agents` | Live | version/identity and permission tests | Emphasize capability, health, compatibility and assignments; Agent ≠ Factory/Harness/Model. |
| Capability admission | agent versions, harness manifests, context verifiers, model catalog, sandbox profiles | Factory options and admission helpers | Factory detail and capability views | Mixed | exact version/digest compatibility tests | Build one projection over existing types, not one flattened backend schema. |
| Repository/integration | repositories, GitHub installations/webhooks, provider receipts | project, GitHub, release APIs | Workspace, Code Review Setup, Deployments | Live + Preview setup | repository scope and provider readiness tests | Clearly distinguish configured, ready, degraded and demo. |
| Policies/budgets | policy envelopes, governance policies, Attempt manifests/budgets | policy and WorkOrder APIs | Policies / Control Plane / Attempt | Preview route, Live enforcement | server enforcement and policy tests | Surface applied version, effective constraints and override authority. |
| Outcome/learning | Mission acceptance, learning signals/clusters/experiments | Factory learning APIs | Improvement History / Mission activity | Preview | proposal-only promotion and acceptance authority tests | Show accepted outcome separately from release and keep learning advisory. |

## Route truth

The registry currently declares **56 routes**: **23 Live**, **26 Preview**, **7 Demo**, with every undeclared route hidden under capability enforcement. Live navigation must use the existing authoritative views; Preview and Demo routes stay labeled and hidden unless their flags are enabled.

### Product-truth findings

1. The EOS shell duplicates Missions as “Missions” and “Objectives”; only Mission is the canonical outcome object.
2. “Factory Board” is operationally weaker than the existing Factory Definition/Version configuration surface.
3. “Approvals & Audit” collapses a decision queue and a security/governance record that have different jobs.
4. Factory Health appears in multiple implementations; the currently declared EOS route is Demo and cannot be promoted by presentation work alone.
5. Agent Registry, Agent Capability Catalog, harness education, context registry, and model routing are distinct capabilities and must not be flattened into a generic “agent” page.
6. Calendar/Schedule/Run Schedule require data-owner validation before more than one is retained in primary navigation.
7. Live WorkOrders already provide the strongest cross-domain read model and should anchor Task, Attempt, Candidate, verification, evidence and approval drill-down.

## Phase 2 implementation boundary

First converge the Live operator journey using existing APIs and read models. Preview/Demo routes receive truthful labels and cross-links but do not become Live without authorization, persistence and browser qualification. Missing canonical incident and MCP/tool-runtime aggregates remain Phase 3 work.
