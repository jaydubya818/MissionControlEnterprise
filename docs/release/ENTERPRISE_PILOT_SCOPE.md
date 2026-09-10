---
title: Enterprise Pilot Scope
status: blocked-pending-production-qualification
updated: 2026-09-10
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
---

# Enterprise pilot scope

## Decision

Mission Control Enterprise is not currently admitted to an enterprise pilot.
This document defines the maximum initial boundary after all pilot-required
gates in `PHASE_3_RELEASE_BOUNDARY.md` pass. It is an operating restriction,
not evidence that those gates have passed.

## Admitted product

The pilot includes only the 17 approved Live routes, presented as 15 primary
navigation destinations:

| Domain | Primary destination | Included detail route |
| --- | --- | --- |
| Overview | `/v2/command-center` | — |
| Operate | `/v2/missions` | `/v2/missions/:missionId` |
| Operate | `/v2/control-work-orders` | — |
| Operate | `/v2/tasks` | — |
| Operate | `/v2/atc` | — |
| Operate | `/v2/control-approvals` | — |
| Operate | `/v2/deployments` | — |
| Factory | `/v2/projects` | — |
| Factory | `/v2/factory` | — |
| Factory | `/v2/agents` | — |
| Control | `/v2/identity` | — |
| Control | `/v2/model-routing` | — |
| Control | `/v2/automations` | `/v2/automation-runs/:runId` |
| Observe | `/v2/audit` | — |
| Observe | `/v2/trace-inspector` | — |

Preview routes remain visibly labeled Preview, receive security and smoke
coverage, and may support diagnosis. They are not part of the pilot service
claim. Labs are disabled by default and excluded from pilot support.

## Initial operating envelope

- One enterprise company and one production workspace.
- One designated operator and one designated approver; separation of duties is
  required for consequential approvals.
- One registered source repository.
- One active Mission and one executing WorkOrder at a time.
- One active Attempt, worker, sandbox, and model route at a time.
- Human approval before candidate acceptance, publication, deployment, or
  release promotion.
- Low-risk bug fixes, bounded features, and behavior-preserving refactors only.
- Security-policy and data/schema work require a separately approved change and
  rollback plan; autonomous deployment is excluded.
- Business-hours supervised operation only, with the support contacts in
  `PILOT_SUPPORT_MODEL.md` available for the full execution window.

These are conservative restrictions derived from the historical V3 evidence,
which measured sequential work only. They must not be increased from repository
evidence alone.

## Explicit exclusions

- Unattended or overnight autonomy.
- Multiple companies, repositories, active workers, or sandboxes under load.
- Automatic merge, deployment, rollback, or release promotion.
- Preview or Labs capability in a contractual production claim.
- Unrestricted network egress from execution sandboxes.
- Guaranteed model or infrastructure cost ceilings; historical cost fields are
  incomplete.
- A contractual availability SLA.

## Admission prerequisites

Every item must have durable evidence tied to the exact release candidate:

1. `pnpm run production:config:check` passes without placing secrets in Vite.
2. A production Clerk session and token refresh pass against the deployed UI.
3. Two real companies prove bidirectional route, query, mutation, and zero-write
   isolation.
4. The same-origin trusted orchestration proxy injects service credentials;
   browsers never receive `CONVEX_SERVICE_AUTH_TOKEN` or the inbound token.
5. One real provider tuple completes the governed Mission golden path and its
   provider receipt matches the recorded Attempt authority.
6. Deployed restart, worker-loss, ambiguous retry, backup/restore, alert, and
   release rollback exercises pass.
7. A non-author performs the incident and recovery tabletop from the published
   runbooks.
8. The exact deployed artifact digest matches the approved candidate.

## Stop conditions

Stop admission immediately on any cross-company visibility, authorization
bypass, stale-candidate acceptance, duplicate consequential side effect,
missing audit/evidence lineage, unknown release digest, unreconciled worker
lease, provider fallback outside the admitted tuple, failed backup verification,
or breached pilot objective. Recovery requires incident ownership, safe state
reconciliation, and a new explicit go decision.

