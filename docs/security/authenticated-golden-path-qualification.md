# Authenticated golden-path qualification

This runbook qualifies the canonical Step C delivery path with two real Clerk
identities and two isolated Mission Control companies:

`Mission → Plan / WorkOrder → Task → Attempt → Candidate / Evidence → Independent Verification → Approval → Release Readiness`

The deterministic tests can run without external credentials. The live browser
qualification cannot.

## Current classification

`PRODUCTION AUTHENTICATION QUALIFICATION: BLOCKED — EXTERNAL CONFIGURATION`

This is not a product PASS and must not be replaced with demo, legacy, anonymous,
or fabricated-token evidence.

## Values the Product Owner must supply

| Value | Configuration location | Secret handling |
| --- | --- | --- |
| Clerk publishable key | UI build/deployment as `VITE_CLERK_PUBLISHABLE_KEY` | Public browser configuration; do not commit or write to evidence |
| Authentication mode | UI build/deployment and qualification shell as `VITE_AUTH_MODE=clerk` | Any other value blocks qualification |
| Clerk Frontend API/JWT issuer origin | Target Convex deployment as `CLERK_JWT_ISSUER_DOMAIN` | Public deployment configuration; must match the publishable-key instance |
| User A exact Clerk subject | `operators.authId` for one active Company A operator; non-secret lineage manifest | Stable ID is allowed in evidence; no password/session data |
| User B exact Clerk subject | `operators.authId` for one active Company B operator; non-secret lineage manifest | Stable ID is allowed in evidence; no password/session data |
| Company A and B Convex IDs | Non-secret lineage manifest | Must be distinct active `tenants` records |
| Workspace A and B IDs/project slugs | Non-secret lineage manifest | Each workspace must belong to its named company |
| Canonical lineage IDs for both companies | Non-secret lineage manifest | Mission, WorkOrder, Task, Attempt, candidate ID/SHA, verification subject/plan, approval, and release IDs |
| User A and B authenticated browser state paths | `MC_AUTH_GOLDEN_PATH_USER_A_STORAGE_STATE` and `MC_AUTH_GOLDEN_PATH_USER_B_STORAGE_STATE` | Absolute paths outside the repository; files contain session material and must never become artifacts |
| Deployed application URL | `MISSION_CONTROL_URL` in the qualification shell | Must point to the deployment built with `VITE_AUTH_MODE=clerk` |
| Deployed Convex URL | `MC_AUTH_GOLDEN_PATH_CONVEX_URL` in the qualification shell | Public `.convex.cloud` URL used for direct authenticated boundary probes |

The existing integration does not require a Clerk secret/server key. Do not
supply one unless the implementation changes to use a Clerk server API.

## Configure the deployment

1. Activate Clerk's native Convex integration. Its session token must carry the
   `convex` audience.
2. Set the exact public issuer on the relevant Convex deployment:

   ```bash
   pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN https://your-instance.clerk.accounts.dev
   pnpm exec convex dev --once
   ```

3. Build/deploy the UI with `VITE_AUTH_MODE=clerk`, the matching
   `VITE_CLERK_PUBLISHABLE_KEY`, and the target `VITE_CONVEX_URL`.
4. Link User A only to Company A and User B only to Company B using exact Clerk
   subjects. Assign each the roles needed for the governed path.
5. Create or qualify one complete persisted lineage in each company. Copy
   `tests/fixtures/authenticated-golden-path.manifest.example.json` to a secure
   runtime location and replace placeholders with stable non-secret IDs.
6. Establish one authenticated Playwright storage-state file per user outside
   the repository. Treat these files like session tokens: do not commit, upload,
   screenshot, or attach them to evidence.

## Preflight and browser proof

Export only runtime references in the qualification shell:

```bash
export MISSION_CONTROL_URL=https://your-qualified-deployment.example
export MC_AUTH_GOLDEN_PATH_CONVEX_URL=https://your-deployment.convex.cloud
export VITE_AUTH_MODE=clerk
export VITE_CLERK_PUBLISHABLE_KEY=provided-at-runtime
export CLERK_JWT_ISSUER_DOMAIN=https://your-instance.clerk.accounts.dev
export MC_AUTH_GOLDEN_PATH_MANIFEST=/absolute/secure/path/manifest.json
export MC_AUTH_GOLDEN_PATH_USER_A_STORAGE_STATE=/absolute/secure/path/user-a-state.json
export MC_AUTH_GOLDEN_PATH_USER_B_STORAGE_STATE=/absolute/secure/path/user-b-state.json
pnpm run qualify:auth:preflight
pnpm run test:e2e:authenticated-golden-path
```

The preflight output reports only configured booleans and stable non-secret
identity/company/workspace IDs. It never emits the publishable key or browser
session state.

The browser harness obtains each session's native Convex token only in memory
and uses it for direct read/mutation denial probes across every canonical object
boundary. It never prints or persists that token. The browser configuration
disables traces and video. Screenshots are retained
only on failure under the ignored `output/` directory and must be reviewed for
sensitive content before sharing.

`MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT` must be unset on the target Convex
deployment and in the qualification shell. Preflight rejects the local demo
bypass explicitly.

## Required result

- User A sees Company A's complete persisted lineage and Company A actions.
- User B sees Company B's complete persisted lineage and Company B actions.
- Each user sees none of the other company's Mission, WorkOrder, Task, Attempt,
  Candidate/Evidence, Verification, Approval, or Release content.
- Direct authenticated Convex probes deny reads and harmless mutation attempts
  for every foreign-company object type in both directions.
- Deterministic handler tests prove denied reads and mutations cause zero writes
  in both directions.
- Refresh retains the same authorized company and lineage.
- No browser or server failure falls back to demo or legacy mode.

Only after all checks pass may the classification change to:

`PRODUCTION AUTHENTICATION QUALIFICATION: PASS`
