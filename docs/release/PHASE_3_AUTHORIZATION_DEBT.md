---
title: Phase 3 Authorization Debt Remediation
status: complete
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-10
---

# Phase 3 authorization debt remediation

## Decision

All 157 inherited public unauthenticated Convex reads are resolved. No active
authorization-debt entry remains and no inherited unauthenticated read remains
network-reachable through the public Convex contract.

The implementation preserves backend capability unless dependency analysis
proved that the public entry point was unnecessary:

- 149 reads were converted to `internalQuery`; their handlers and persisted
  data remain available to explicit server-side composition;
- 6 reads remain public with server-side authentication, object-derived
  company/workspace authorization, and negative-path coverage; and
- 2 deployment health probes use the reviewed `publicQuery` contract, require
  a literal justification, and return only bounded non-tenant status fields.

The authoritative function-by-function history is
`scripts/authorization-debt-classification.json`. The release gate fails if a
resolved function becomes unauthenticated again, if an internalized function
reappears in the public contract, or if a declared-public query lacks its
reviewed reason.

## Resolution result

| Original classification | Initially classified | Authorized | Declared public | Internalized | Active |
| --- | ---: | ---: | ---: | ---: | ---: |
| Legacy | 69 | 0 | 0 | 69 | 0 |
| Future product surface | 27 | 0 | 0 | 27 | 0 |
| Internalization candidate | 25 | 5 | 0 | 20 | 0 |
| Developer tool | 19 | 0 | 2 | 17 | 0 |
| Preview | 17 | 1 | 0 | 16 | 0 |
| **Total** | **157** | **6** | **2** | **149** | **0** |

## Runtime and service boundary

The six retained authorized reads are the scoped Captures listing plus runtime
reads across `skillAutomations`, `workflowRuns`, and `workflows`.

- Workflow run events and artifacts derive authority from the run's workspace
  and, when present, its authoritative WorkOrder ownership.
- Execution manifests require the same WorkOrder authority before artifact
  content or secret references can be returned.
- Project-owned workflow definitions are omitted or denied across company
  boundaries; global workflow definitions still require an authenticated
  identity.
- The CLI, orchestration server, workflow executor, and factory worker require
  `CONVEX_SERVICE_AUTH_TOKEN` before creating an authenticated Convex client.
- Fuzzy unscoped workflow-run search is internal-only; CLI status requires an
  exact run identifier.

## Automated evidence

```text
Authorization debt classification: PASS — 0/0 active; 157 resolved
Resolved AUTHORIZED: 6
Resolved DECLARED_PUBLIC: 2
Resolved INTERNALIZED: 149
Public Convex functions: 762
Authorized: 760
Declared public: 2
Unauthorized reads: 0
Unauthorized mutations/actions: 0
Live route authorization closure: 17/17 PASS
Preview route authorization closure: 14/14 PASS
```

Focused tests prove anonymous denial, cross-company denial, valid
same-workspace access, invalid-object failure, and WorkOrder-bound runtime
manifest access. This closes the repository authorization-debt blocker; it does
not substitute for production Clerk or two-session browser qualification.
