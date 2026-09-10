---
title: Phase 3 Preview Security Review
status: pass
upstream_baseline: ffd58077989a23004819a85f529ca74c955b1422
updated: 2026-09-10
---

# Phase 3 Preview security review

## Executive summary

**PASS for the approved Preview boundary.** Static UI dependency analysis maps
all 14 Preview routes through their local import closures to every referenced
public Convex function. Every reachable function now establishes server-side
authentication and, where records are scoped, company/workspace authorization.

The Preview work closed 14 inherited unauthenticated reads and the subsequent
Live closure closed another 13. Product dependency analysis then resolved all
157 remaining inherited findings: 149 were internalized, 6 received explicit
server authorization, and 2 became bounded declared-public health probes.
There are now zero unauthorized public reads, mutations, or actions across the
repository.

## Findings and remediation

| Severity before fix | Surface | Finding | Remediation | Status |
| --- | --- | --- | --- | --- |
| High | Policies | Policy, template, version, and tenant reads could be invoked without a server identity; mixed object IDs could cross scopes. | Require authenticated company/workspace access, reject contradictory tenant/project/version bindings, and filter registry results to the authorized scope. | Resolved |
| High | Task Graph | `coordinator:getDependencyGraph` could read a deployment-wide graph when no scope was supplied. | Resolve the parent Task or require `projectId`, authorize the workspace, and query only that workspace. | Resolved |
| High | Telemetry | Operational event list and statistics reads accepted unscoped public calls. | Require an authorized project, tenant, or agent-instance scope and reject mismatched scope arguments. | Resolved |
| High | Work Ledger | The dedicated ledger could scan tasks without an authorized workspace. | Require workspace read authority and query the project index directly. | Resolved |
| High | Code Review Setup | Evidence gathering accepted an optional workspace and included QC runs from other projects. | Make the workspace required, authorize it, and scope both PR and QC reads by project. | Resolved |
| Medium | Gateway | The stored upstream URL was readable without an identity. | Require an authenticated human or configured service identity; retain administrator-only writes. | Resolved |
| Low | Change Risk defaults | Static rule defaults were exposed through an unclassified public query. | Require authentication so every Preview route dependency follows one explicit policy. | Resolved |

## Negative-path evidence

`convex/__tests__/authorizationRemediation.test.ts` proves:

- unauthenticated denial for every remediated Preview read;
- cross-company denial for project, policy, registry, telemetry, ledger, and
  review-evidence reads;
- invalid and contradictory object-scope denial;
- authorized empty/read behavior inside the selected workspace; and
- cross-company denial before policy/template/version writes.

## Automated gate

`pnpm run security:enterprise-routes` performs a source-aware closure walk from
the 14 approved Preview renderers. It follows local UI imports, extracts public
Convex references, and fails if any reachable function is not server-authorized,
including a deliberately anonymous public function.

Current result:

```text
17 Live routes PASS
14 Preview routes PASS
0 admitted routes reach an unauthenticated public Convex function
762 total public Convex functions
760 authorized
2 bounded declared-public health probes
0 active unauthorized functions
157 reads retained in resolved classification history
0 unauthorized mutations/actions
```

## Risk matrix

| Risk | Current severity | Disposition |
| --- | --- | --- |
| Admitted Preview route reaches an unauthenticated function | None detected | Release gate; must remain zero. |
| Cross-company access through remediated Preview reads | None detected | Negative tests required on every change. |
| Remaining public unauthenticated reads outside admitted routes | None detected | The zero baseline and resolved-history checker prevent silent re-exposure. |
| Gateway service identity missing or invalid | Medium, fail-closed | Surface degraded/unconfigured status; production configuration proof remains pending. |

## Security checklist

- Input and object scope validation: PASS for remediated endpoints.
- Authentication and authorization: PASS for the approved Preview closure.
- Cross-company isolation: PASS in deterministic server tests.
- Unauthorized mutations/actions: PASS at zero.
- Hardcoded credentials: none introduced.
- Error safety: generic unavailable/unauthorized responses used for invalid or
  inaccessible objects.
- Dependency/CSP/transport and production Clerk proof: tracked by the broader
  Phase 3 release qualification and not claimed by this focused review.
