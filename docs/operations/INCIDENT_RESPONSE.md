# Enterprise incident response

## Severity

- **SEV-1:** cross-company exposure, unauthorized consequential action, wrong
  artifact deployment, evidence corruption, or uncontrolled external side
  effect. Stop all admission immediately.
- **SEV-2:** production authentication unavailable, stuck/repeated execution,
  provider outage without safe fallback, missing alert, or breached pilot
  objective. Hold affected admission.
- **SEV-3:** bounded degraded Preview capability or operator inconvenience with
  intact authority, persistence, and evidence.

## Response

1. Assign one incident commander and timestamp the declaration.
2. Preserve logs, trace IDs, Attempt/lease IDs, candidate SHA, Factory Version,
   Execution Profile, provider receipts, and audit records. Never copy secrets.
3. Stop admission; revoke or disable only the narrowest unsafe authority.
4. Determine whether data crossed a company boundary or an external side effect
   occurred. Escalate either finding as SEV-1.
5. Select the Factory, provider, authentication, or release recovery runbook.
6. Reconcile authoritative Convex state with worker, sandbox, GitHub, model, and
   deployment state before resuming.
7. Record containment, recovery, validation, residual risk, and the human resume
   decision in Audit.

Never delete or rewrite incident evidence. If the UI disagrees with the
authoritative backend, treat the UI as degraded and operate from verified
records until reconciled.

