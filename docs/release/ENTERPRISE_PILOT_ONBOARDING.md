# Enterprise pilot onboarding

The release manager owns this checklist. No item may be waived silently.

- [ ] Pilot scope and exclusions are acknowledged by operator and approver.
- [ ] Exact enterprise repository and approved release-candidate SHA recorded.
- [ ] Production configuration preflight passes; no credential is exposed as a
  `VITE_*` variable or committed file.
- [ ] Clerk issuer, company memberships, operator role, approver role, and
  separation of duties verified with real sessions.
- [ ] Two-company negative isolation evidence attached.
- [ ] Company, workspace, repository, default branch, and GitHub App authority
  verified.
- [ ] Factory Version and Execution Profile are activated and match the admitted
  worker, sandbox, model, verification, and egress policies.
- [ ] Orchestration endpoint is HTTPS, exact-origin CORS is configured, and a
  trusted server-side proxy supplies inbound service authentication.
- [ ] Backup/restore responsibility, retention, provider escalation paths, and
  data residency are recorded.
- [ ] Health, audit, trace, provider, and alert dashboards are accessible to the
  pilot support team.
- [ ] Incident commander, primary on-call, backup, security contact, release
  manager, and enterprise contact are named.
- [ ] Incident, Factory recovery, provider outage, authentication outage, and
  release recovery tabletop completed by a non-author.
- [ ] One bounded read-only smoke and one governed golden path pass on the exact
  deployed artifact.
- [ ] Go decision recorded in Audit with links to the qualification packet.

