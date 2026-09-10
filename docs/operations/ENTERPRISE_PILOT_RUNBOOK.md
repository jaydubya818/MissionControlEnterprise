# Enterprise pilot runbook

## Before the window

1. Confirm the exact candidate and deployed artifact digest.
2. Run production configuration, security, Live browser, and startup gates.
3. Confirm the pilot remains inside `ENTERPRISE_PILOT_SCOPE.md`.
4. Verify Factory Version, Execution Profile, repository, provider tuple,
   approver, alerts, and backup status.
5. Name the incident commander and open the evidence record for the window.

## Operate

Use Command Center for admission and exceptions, Missions for intent, Work
Orders for the delivery contract, Tasks/ATC for execution, Approvals for human
authority, Deployments for the exact release, and Audit/Trace for evidence.
Every consequential transition must leave persisted lineage. Preview surfaces
may aid diagnosis but are not authoritative decision surfaces.

## Hold or stop

Stop new admission on any scope violation, inconsistent authority, stale
candidate, lost evidence, duplicate external effect, unknown worker/sandbox
state, degraded authentication, or false-health signal. Do not repair records
directly or bypass approval. Declare an incident and follow the specific
runbook.

## End the window

Drain or govern-cancel work, reconcile leases and sandboxes, verify audit and
evidence completeness, record provider/cost data, review alerts, and document a
go/hold decision for the next window.

## Commands

```bash
pnpm run production:config:check
pnpm run release:security
pnpm run qualify:production-startup
pnpm run qualify:enterprise-golden-path
pnpm run test:e2e:critical
pnpm run test:e2e:enterprise-surfaces
```

Run commands from the exact Enterprise candidate. Never run a deployment
command from the preserved MissionControl repository.

