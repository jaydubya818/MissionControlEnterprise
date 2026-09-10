# Factory recovery

1. Hold new WorkOrder admission and automatic retries.
2. Inventory active WorkOrders, Attempts, leases, workers, sandboxes, verification
   runs, approvals, and releases from authoritative records.
3. Mark no Attempt complete from process output alone. Require its persisted
   terminal result and evidence.
4. Restart one worker at a time. Allow stale-lease recovery only through the
   existing lease/reconciliation contract.
5. For ambiguous provider completion, inspect the idempotency key and provider
   receipt before retrying. Do not repeat publication or deployment blindly.
6. Re-run independent verification against the exact current candidate when
   currentness is uncertain.
7. Confirm no duplicate PR, approval, release, charge, lease, or sandbox exists.
8. Verify Work Ledger, Audit, and Trace reconstruct the full event sequence.
9. Resume only after the incident commander records a safe-state decision.

If persisted state cannot be reconciled, retain the hold and restore from the
last verified backup under the data provider's documented procedure. A local
fixture is not backup/restore evidence.

