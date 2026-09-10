# Pilot support model

The initial pilot is supervised during declared business-hour execution
windows. It has no contractual 24×7 SLA.

| Role | Responsibility |
| --- | --- |
| Pilot operator | Admits bounded work, monitors exceptions, stops on unsafe state |
| Approver | Reviews exact candidate evidence and owns consequential decisions |
| Incident commander | Coordinates containment, evidence, recovery, and resume |
| Application security | Owns auth, company isolation, credential, and exposure events |
| Runtime engineer | Owns workers, leases, sandboxes, retries, and provider reconciliation |
| Release manager | Owns candidate identity, deployment, rollback, and release evidence |
| Enterprise contact | Confirms business impact and receives incident communication |

Before each window, named people and provider escalation contacts must be
recorded in the pilot evidence. SEV-1 pages all named roles immediately. SEV-2
pages the operator, incident commander, and owning engineer. Preview-only SEV-3
issues may wait until the next support window if Live authority and evidence are
intact.

No support role may bypass approval, company scope, exact-candidate checks, or
evidence requirements to restore service.

