# Pilot service objectives

These are proposed internal pilot objectives, not measured achievements or a
customer SLA. They apply only after pilot admission.

| Objective | Target | Measurement / response |
| --- | --- | --- |
| Unauthorized cross-company access | 0 | Any event is SEV-1 and stops the pilot |
| Consequential actions without valid authority/evidence | 0 | Any event is SEV-1 |
| Duplicate publication/deployment/release | 0 | Any event stops admission and requires reconciliation |
| Accepted outcomes with complete lineage | 100% | Mission through release/evidence linkage audit |
| Incident acknowledgement | <= 15 minutes during window | Incident declaration to named owner acknowledgement |
| Unsafe admission stop | <= 5 minutes after confirmed SEV-1/2 | Alert/confirmation to gate closure |
| Recovery objective | <= 60 minutes for bounded worker/provider interruption | Incident declaration to reconciled safe state |
| Recovery point for governance/audit records | 0 acknowledged records lost | Backup/restore and provider durability evidence |
| Sequential total-cycle latency | Observe against historical P95 230,971 ms | Three consecutive breaches trigger hold and review; not an SLA |

Availability, load, soak, backup RPO/RTO, and provider-cost objectives remain
unqualified until the production exercises in the release boundary pass.

