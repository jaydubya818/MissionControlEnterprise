# Enterprise pilot offboarding

Offboarding must preserve auditability while removing operational authority.

- [ ] Stop new Mission, WorkOrder, automation, and release admission.
- [ ] Let safe in-flight work finish or cancel it through governed controls;
  reconcile every Attempt, lease, sandbox, and provider operation.
- [ ] Revoke operator, approver, service, GitHub App, sandbox, model, and alerting
  credentials; record revocation results without secret values.
- [ ] Disable automations, worker consumers, inbound webhooks, and deployment
  triggers.
- [ ] Verify no active lease, pending approval, unpublished accepted candidate,
  queued release, or orphan sandbox remains.
- [ ] Export the authorized audit, Work Ledger, evidence, release, incident, and
  configuration records required by the retention agreement.
- [ ] Verify backup integrity and record retention/deletion owners and dates.
- [ ] Remove company and repository access only after the evidence export is
  verified.
- [ ] Record final costs, unresolved incidents, known limitations, and any data
  that remains with an external provider.
- [ ] Record the final offboarding decision and evidence links in Audit.

