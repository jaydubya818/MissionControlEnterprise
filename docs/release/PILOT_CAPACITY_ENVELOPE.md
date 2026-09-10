---
title: Pilot Capacity Envelope
status: historical-bound-only
updated: 2026-09-10
---

# Pilot capacity envelope

## Evidence boundary

No Phase 3 production-equivalent load or soak run has been executed for the
current enterprise candidate. The only measured basis is the immutable
`production-factory-pilot-v3` packet at source
`db44819ec59e79cdd71ba9ed36fce8064a120af3` (runtime contract v30). It is
historical evidence from the broader Mission Control repository, not current
candidate certification.

## Measured historical cohort

| Measure | Result |
| --- | ---: |
| Governed executions | 15 sequential |
| Workload mix | 3 bug, 3 feature, 3 refactor, 3 security, 3 data/schema |
| Accepted | 15/15 |
| Attempts / retries / failed attempts | 15 / 0 / 0 |
| Local samples | 12 |
| Remote sandbox samples | 3 |
| Maximum observed remote concurrency | 1 |
| Total-cycle median / P95 | 31,616 ms / 230,971 ms |
| Local execution median / P95 | 29,377 ms / 51,858 ms |
| Remote execution median / P95 | 68,886 ms / 210,716 ms |
| Remote allocation median / P95 | 3,613 ms / 3,656 ms |
| Remote readiness median / P95 | 4,385 ms / 4,419 ms |
| Verification median / P95 | 276 ms / 285 ms |
| Input / output tokens | 1,223,309 / 25,638 |
| Model / infrastructure cost | Not recorded |

Sources: `docs/testing/evidence/production-factory-pilot-v3/`.

## Conservative pilot ceiling

Until a current stepped-load and soak qualification passes, the hard ceiling is
the minimum actually exercised shape: one company, one workspace, one
repository, one active operator flow, one Mission, one WorkOrder, one Attempt,
one worker, one sandbox, and one model route at a time. Parallel remote work is
not admitted. Historical latency is an observation, not an SLO guarantee.

## Capacity dimensions still unproven

| Dimension | Current classification | Required proof |
| --- | --- | --- |
| Concurrent operators and companies | BLOCKED — ENVIRONMENT | Two or more production-authenticated cohorts with isolation checks |
| Repositories and active Missions | BLOCKED — ENVIRONMENT | Stepped workload with queue/query percentiles |
| WorkOrders and Attempts | BLOCKED — ENVIRONMENT | Increasing concurrency to first saturation signal |
| Workers and sandboxes | BLOCKED — PROVIDER | Concurrent leases, allocation, loss, recovery, and teardown |
| Model routes | BLOCKED — PROVIDER | Rate-limit, timeout, fallback, and no-fallback cohorts |
| Convex query/mutation pressure | BLOCKED — ENVIRONMENT | Deployment metrics correlated to workload |
| Cost per accepted outcome | BLOCKED — PROVIDER DATA | Complete model and infrastructure receipts |
| Soak / leak behavior | BLOCKED — ENVIRONMENT | Supervised duration run with memory, queue, lease, and error trends |

## Saturation and abort policy

The first current load qualification must begin at the conservative ceiling and
increase one dimension at a time. Stop on any authorization error, duplicate
side effect, lost lineage, unrecovered lease, rising backlog without drain,
provider throttling outside retry policy, P95 exceeding the proposed objective
for three consecutive windows, or resource utilization above the provider's
documented safe threshold. Do not infer production capacity from local fixture
throughput.

