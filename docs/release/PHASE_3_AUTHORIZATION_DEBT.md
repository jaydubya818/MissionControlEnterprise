---
title: Phase 3 Authorization Debt Classification
status: classified-remediation-required
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-09
---

# Phase 3 authorization debt classification

## Decision

The remaining **157 public unauthenticated Convex reads are all network
reachable** to a caller that knows the deployment URL and function identifier.
Removing a route or navigation entry does not secure a public Convex function.

None is reachable from the statically enforced closure of the 17 Live or 14
Preview routes. That limits accidental product admission, but it does not make
the backend safe for an enterprise pilot. All 157 therefore remain pilot and
unrestricted-release blockers until they are authorized, converted to an
explicitly reviewed minimal public contract, internalized, or removed after
dependency proof.

The authoritative function-by-function ledger is
`scripts/authorization-debt-classification.json`. The release gate executes
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

| Classification | Functions | Meaning |
| --- | ---: | --- |
| Legacy | 69 | Superseded or removed product surfaces retained only for dependency-safe cleanup. |
| Future product surface | 27 | Potentially useful capability with no approved enterprise owner or admission. |
| Internalization candidate | 25 | Server/runtime implementation detail that should not remain a public query. |
| Developer tool | 19 | Diagnostic, migration, seed, health, or canary surface requiring an explicit bounded contract. |
| Preview | 17 | Labs/experimental backend outside the approved Preview navigation boundary. |
| **Total** | **157** | Exact match to the authorization ratchet baseline. |

Exact static references exist for 46 of the 157 functions. The remaining 111
have no known repository caller, but all 157 remain callable over the public
Convex API until remediated.

## Admitted runtime blockers

The ledger identifies seven reads with known runtime/CLI ownership across
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
Authorization debt classification: PASS — 157/157 reads classified
Public Convex functions: 917
Authorized: 760
Unauthorized reads: 157
Unauthorized mutations/actions: 0
Live route authorization closure: 17/17 PASS
Preview route authorization closure: 14/14 PASS
```

Classification is complete. Remediation is not.
