---
title: Mission Control Feature Matrix
status: active
baseline: 5f1e232bb5c1130a718c5289ba5ff0b2eccbe748
updated: 2026-09-09
---

# Mission Control feature matrix

This matrix records product truth. Backend-qualified means a persisted, authorized implementation exists; it does not by itself make a route Live. Route maturity is owned by `apps/mission-control-ui/src/shellV2/routeCapabilities.ts`.

| Product capability | Backend | Product surface | Maturity | Phase 2 disposition |
| --- | --- | --- | --- | --- |
| Command Center | Qualified projections | `/v2/command-center` | Live | Attention, exceptions, capacity and readiness remain the operator entry point. |
| Mission | Qualified | `/v2/missions`, Mission detail | Live | Canonical intent anchor; duplicate Objectives removed from primary navigation. |
| Plan | Qualified | Mission → Plan | Live | Revision, approval and WorkOrder materialization remain on the Mission. |
| WorkOrder | Qualified | `/v2/control-work-orders` | Live | Canonical delivery contract and cross-domain inspector. |
| Task | Qualified | `/v2/tasks` | Live | Presented as bounded work, distinct from an Attempt. |
| Attempt | Qualified | WorkOrder execution inspector | Live | Surfaced in primary navigation as Tasks & Attempts; immutable run details remain subordinate to WorkOrder. |
| Candidate | Qualified | Review package / Attempt inspector | Live | Exact source/head/PR identity remains visible. |
| Verification | Qualified | Attempt inspector / review package | Live | Independent verifier and exact-subject results remain explicit. |
| Evidence | Qualified | Review evidence package | Live | IDs, provenance, currentness and links remain available. |
| Approvals | Qualified | `/v2/control-approvals` | Live | Added to primary Operate navigation; Command Center now routes here. |
| Audit | Qualified | `/v2/audit` | Live | Separated from approval decisions and labeled Audit Trail. |
| Release / deployment | Qualified | `/v2/deployments`, release panels | Live | Labeled Releases & Deployments; eligibility and deployment remain distinct. |
| Factory Definition | Qualified | `/v2/projects` configuration | Live | Authoritative configuration surfaced as Factory Registry. |
| Factory Version | Qualified | Factory Registry | Live | Immutable version terminology and creation action made explicit. |
| Execution Profile | Qualified | Factory Registry | Live | Existing execution boundary presented as the governed Execution Profile. |
| Factory run | Qualified | `/v2/factory` | Live | Renamed from Factory Board to Factory Runs. |
| Agent fleet | Qualified | `/v2/agents` | Live | Moved into the Factory domain; remains distinct from capability catalog. |
| Harness / loops | Qualified | `/v2/harness-loops`, Attempt manifest | Live | Operational harness entry moved into Factory; exact pins stay on Attempt. |
| Model / route | Qualified | `/v2/model-routing`, Attempt inspector | Live | Labeled Routing Decisions; explanation and frozen routing evidence remain available. |
| Queue / admission | Qualified | `/v2/atc` | Live | Labeled Execution Queue under Control. |
| Automations | Qualified | `/v2/automations` | Live | Kept under Control; definitions and runs remain governed records. |
| Identity / authority | Qualified | `/v2/identity` | Live | Labeled Identities & Authority. |
| Observability / evals | Qualified | `/v2/trace-inspector` | Live | Kept separate from Audit and operational telemetry. |
| Incidents / telemetry | Qualified current signals | `/v2/telemetry` | Live | Truthfully labeled Incidents & Telemetry; canonical incident aggregate remains deferred. |
| Context catalog | Qualified | `/v2/skills` | Live / Global | Retained as a reusable capability catalog, not another Factory registry. |
| Memory | Qualified | `/v2/memory` | Live | Remains workspace-scoped supporting knowledge. |
| Documentation | Qualified | `/v2/docs` | Live / Global | Retained in Knowledge. |
| Policy authoring | Qualified enforcement | `/v2/policies` | Preview | Enforcement is Live; authoring route remains Preview. |
| Task graph | Qualified task relations | `/v2/dag` | Preview | Kept out of default navigation until route qualification. |
| Cost and usage | Qualified partial data | `/v2/analytics` | Preview | Unknown provider cost is not inferred. |
| Code review setup | Qualified partial workflow | `/v2/harness-code-review-wizard` | Preview | Remains Build/Preview. |
| Change review | Qualified partial workflow | `/v2/harness-change-review` | Preview | Remains Build/Preview. |
| Quality rulesets | Qualified | `/v2/qc-rulesets` | Preview | Remains Build/Preview. |
| Factory Health | Qualified component data | `/v2/factory-health` | Demo | Not promoted; default UI uses Live readiness signals. |
| Environment readiness | Qualified partial data | `/v2/readiness` | Demo | Not promoted. |
| Capability Catalog | Qualified projection | `/v2/agent-catalog` | Demo / Global | Remains distinct from Agent Fleet and hidden by default. |
| Evidence Dossiers | Qualified projection | `/v2/dossier` | Demo | Review Evidence Package remains the Live evidence surface. |
| Effectiveness / friction / recommendations | Qualified projections | Labs routes | Demo | Hidden by default and visibly badged when enabled. |
| Workshop / education | Existing harness views | hidden or Preview | Secondary | Not promoted into the primary operator journey. |
| Factory assistant | Existing chat dock | Live shell support | Supporting | No independent approval, verification, publication or merge authority. |

## Release-hardening boundary

Production Clerk qualification, two-company authenticated browser isolation, 184 non-Live read-only authorization functions, dependency advisories, root integration-runner cleanup, load/soak/failure injection and provider capacity qualification remain outside this convergence checkpoint.
