---
title: Phase 3 Authorization Debt Classification
status: classified-remediation-required
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-09
---

# Phase 3 authorization debt classification

## Decision

The initial ledger classified 157 public unauthenticated Convex reads. The
first remediation tranche converted 79 reads with no admitted or known
repository caller to `internalQuery`, preserving their backend implementation
while removing their public entry points.

The remaining **78 public unauthenticated Convex reads are all network
reachable** to a caller that knows the deployment URL and function identifier.
Removing a route or navigation entry does not secure a public Convex function.

None is reachable from the statically enforced closure of the 17 Live or 14
Preview routes. That limits accidental product admission, but it does not make
the backend safe for an enterprise pilot. All 78 therefore remain pilot and
unrestricted-release blockers until they are authorized, converted to an
explicitly reviewed minimal public contract, internalized, or removed after
dependency proof.

The authoritative function-by-function ledger is
`scripts/authorization-debt-classification.json`, including active and resolved
history. The release gate executes
`scripts/check-authorization-debt-classification.mjs` and fails if the ledger
omits a baseline function, retains a stale function, duplicates a function, or
lacks any required decision field.

## Required fields

Each ledger record applies its decision to every named function and records:

- why the function remains;
- known repository callers (`calledFunctions`; absence means no caller was
  found by exact static reference scanning, not that the public API is
  unreachable);
- whether a product/runtime entry point is admitted;
- confirmation that the function is read-only;
- pilot and unrestricted-release blocking status; and
- the exact remediation path.

## Classification result

| Classification | Initially classified | Internalized | Remaining public |
| --- | ---: | ---: | ---: |
| Legacy | 69 | 40 | 29 |
| Future product surface | 27 | 20 | 7 |
| Internalization candidate | 25 | 18 | 7 |
| Developer tool | 19 | 0 | 19 |
| Preview | 17 | 1 | 16 |
| **Total** | **157** | **79** | **78** |

Exact static references exist for 46 of the 78 remaining functions. The other
32 are deliberately held-back Labs or developer-tool contracts that require
separate decisions; lack of a repository caller does not prove that an
external health, migration, or diagnostic consumer does not exist.

## Admitted runtime blockers

The ledger identifies six reads with known runtime/CLI ownership across
`skillAutomations`, `workflowRuns`, and `workflows`. They require special care:

- service execution must use the signed, workspace/repository-scoped service
  command boundary or a demonstrably equivalent scoped service identity;
- server-to-server composition should use `internalQuery` rather than the
  public API;
- CLI calls require an authenticated operator and explicit project scope; and
- artifact content and execution manifests must never be returned solely on
  possession of an object ID.

These endpoints must not be bulk-wrapped with identity-only authentication.
Identity without company/workspace filtering would hide the scanner finding
without closing cross-company exposure.

## Remediation order

1. Close runtime/service reads used by the canonical golden path.
2. Establish the minimal health/readiness contract required by deployment.
3. Internalize functions with no external caller, starting with server-only
   composition.
4. Add object-derived tenant/workspace authorization where retained Labs or
   future capabilities justify a public contract.
5. Remove legacy components and backend functions only after the Phase 3
   dependency-deletion gate proves them unnecessary.

## Automated evidence

```text
Authorization debt classification: PASS — 78/78 active reads classified; 79 resolved reads retained
Public Convex functions: 838
Authorized: 760
Unauthorized reads: 78
Unauthorized mutations/actions: 0
Live route authorization closure: 17/17 PASS
Preview route authorization closure: 14/14 PASS
```

Classification is complete. The first internalization tranche is complete;
the remaining remediation is not.
