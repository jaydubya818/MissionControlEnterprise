# Authentication outage

1. Stop consequential UI actions and new service-command admission.
2. Distinguish Clerk/browser session failure from Convex issuer validation,
   company membership, service identity, and trusted-proxy failure.
3. Never enable anonymous mode, weaken company checks, expose a service token to
   the browser, or broaden CORS as an outage workaround.
4. Preserve affected user, company, request/trace ID, timestamp, and generic
   denial result; do not record tokens.
5. Revoke suspected credentials and rotate through the owning provider when
   compromise is possible.
6. Validate issuer, audience, token refresh, company selection, role, service
   identity, exact origins, and proxy injection in an isolated session.
7. Before resuming, run one authorized same-company read/write and both
   directions of the two-company denial test with zero unauthorized writes.
8. Record recovery and the human resume decision in Audit.

