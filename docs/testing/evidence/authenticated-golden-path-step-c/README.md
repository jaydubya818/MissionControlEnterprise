# Step C authenticated golden-path evidence

Date: 2026-09-09

## Qualification summary

- `TECHNICAL GOLDEN PATH: PASS`
- `SERVER-SIDE TWO-COMPANY AUTHORIZATION: PASS`
- `AUTHENTICATED BROWSER HARNESS: READY`
- `PRODUCTION AUTHENTICATION QUALIFICATION: BLOCKED — EXTERNAL CONFIGURATION`

There is no aggregate production-authentication PASS while the Clerk runtime
configuration and identities are absent.

## Evidence completed without credentials

- The Clerk issuer is no longer hardcoded. Convex requires
  `CLERK_JWT_ISSUER_DOMAIN`; the UI requires `VITE_CLERK_PUBLISHABLE_KEY` in
  Clerk mode.
- Exact identity resolution uses Clerk `identity.subject` to select active
  `operators.authId` records and their active company memberships.
- Deterministic Company A and Company B fixtures exercise production query and
  mutation handlers in both directions across Mission, WorkOrder, Task,
  Attempt, Evidence/Candidate, Verification, Approval, and Release objects.
- Every foreign-company mutation fails before a write; the fixture asserts zero
  writes for each denied batch.
- The browser preflight validates two distinct external storage-state files, a
  complete non-secret lineage manifest, matching deployment inputs, and emits
  no key, token, credential, or storage-state path.
- The browser harness is defined to verify the exact Clerk subject in the page
  session, each user's own persisted lineage, refresh durability, explicit
  WorkOrder acceptance, and absence of the other company's lineage and action.
  It also uses the active token in memory for direct per-object Convex read and
  mutation denial probes without logging or persisting the token.

## Commands and results

| Command | Result |
| --- | --- |
| `pnpm run qualify:auth:technical` | PASS — 66 Vitest tests and 2 Node tests |
| `pnpm run qualify:enterprise-golden-path` | PASS — canonical persisted Step C lineage and authorization/lifecycle contracts |
| `pnpm run qualify:factory:v2` | PASS — full repository tests, lint/typecheck, runtime contracts, production build, and orchestration startup smoke |
| `pnpm run security:audit` | PASS — 0 critical/high findings; patched transitive dependencies; bounded development-only Vitest acceptance |
| `pnpm run security:authorization` | PASS — 917 functions, 733 authorized, baseline 184; Live and P0/P1/P2 each 0 |
| `pnpm run security:secrets` | PASS — 2,623 tracked files checked |
| `pnpm run qualify:auth:preflight` | Correctly BLOCKED — eight external configuration variables absent |
| `pnpm run test:e2e:authenticated-golden-path` | Correctly skipped — external configuration absent |

## Telegram approval disposition

Telegram remains a supported single-operator approval channel behind the
dedicated `TELEGRAM_CONVEX_OPERATOR_AUTH_TOKEN` boundary. The token subject
must resolve to an active operator and company membership with
`delivery.approve`; approval mutations derive the actor on the server, and the
bot sends no caller-supplied operator or agent identity. Multi-operator Telegram
approval is not admitted until a durable Telegram-user-to-operator mapping is
implemented.

## Remaining external qualification

Supply the values and runtime files listed in
`docs/security/authenticated-golden-path-qualification.md`, then run preflight
and the authenticated browser suite. The live evidence must not capture or
persist passwords, tokens, keys, private storage-state contents, or secret
paths.
