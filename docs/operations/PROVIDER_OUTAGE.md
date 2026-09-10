# Provider outage

This applies to model, sandbox, GitHub, notification, and artifact providers.

1. Hold new work that requires the affected provider.
2. Capture provider, operation, correlation ID, Attempt, route decision,
   timestamps, timeout, and whether completion is ambiguous.
3. Do not fall back unless the exact alternate tuple is already admitted by the
   active Factory Version and Execution Profile.
4. On rate limiting, honor bounded backoff and queue limits; do not fan out
   retries.
5. On timeout-after-submit, query provider state before retrying. Reuse the same
   idempotency identity where the provider supports it.
6. Treat missing provider receipts as incomplete evidence even if local output
   exists.
7. Reconcile costs, sandboxes, branches, PRs, notifications, and terminal states
   after recovery.
8. Resume only after a successful bounded probe and a human decision.

If no qualified fallback exists, degraded service means stopped execution, not
silent substitution.

