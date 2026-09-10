# Phase 3 failure-injection matrix

`PASS — DETERMINISTIC` is repository contract evidence. `PASS — HISTORICAL`
comes from the immutable V3 packet and is not current-candidate production
proof. `BLOCKED` requires a deployed environment or real provider.

| Boundary / injection | Safe expected result | Classification |
| --- | --- | --- |
| Anonymous Live/Preview Convex call | Denied, no write | PASS — DETERMINISTIC |
| Cross-company object ID | Generic denial, no disclosure/write | PASS — DETERMINISTIC |
| Contradictory company/workspace scope | Denied before query/mutation | PASS — DETERMINISTIC |
| Invalid object ID | Safe unavailable response | PASS — DETERMINISTIC |
| Missing service token | Orchestration/workflow process refuses work | PASS — DETERMINISTIC |
| Missing inbound orchestration token in production | Startup fails | PASS — DETERMINISTIC |
| Wildcard/non-HTTPS production CORS | Startup fails | PASS — DETERMINISTIC |
| Stale Attempt/lease | Cannot claim current execution authority | PASS — DETERMINISTIC |
| Stale verification candidate | Cannot become eligible/accepted | PASS — DETERMINISTIC |
| Verifier equals executor | Independence gate fails | PASS — DETERMINISTIC |
| Missing evidence/failed quality criterion | Acceptance/release fails closed | PASS — DETERMINISTIC |
| Wrong release candidate/artifact | Approval/promotion denied | PASS — DETERMINISTIC |
| Duplicate/stale governed operation | Idempotent or denied by currentness | PASS — DETERMINISTIC |
| Remote malformed/missing structured output | Attempt fails; no false completion | PASS — HISTORICAL |
| Remote sandbox allocation/readiness/teardown failures | Bounded failure and reconciliation | PASS — HISTORICAL |
| Real worker SIGKILL during active Attempt | Recover lease exactly once, preserve lineage | BLOCKED — DEPLOYED ENVIRONMENT |
| Convex process/provider interruption | Surface degraded, recover persisted state | BLOCKED — PROVIDER |
| Timeout after GitHub/provider commit | Reconcile receipt before retry; no duplicate | BLOCKED — PROVIDER |
| Model rate limit/timeout | Bounded backoff or admitted fallback only | BLOCKED — PROVIDER |
| Sandbox outage/exhaustion | Queue safely; no unqualified fallback | BLOCKED — PROVIDER |
| Clerk outage/token refresh failure | Deny actions; no anonymous bypass | BLOCKED — CLERK |
| Alert transport outage | Health shows degraded; incident still auditable | BLOCKED — NOTIFICATION PROVIDER |
| Backup restore | Meet documented RPO/RTO without lineage loss | BLOCKED — DATA PROVIDER |
| Deployment failure and rollback | Exact prior artifact restored and reconciled | BLOCKED — HOSTING PROVIDER |

