---
title: "feat: Reconcile production Clerk golden-path qualification"
type: feat
status: complete
date: 2026-09-09
owner: Product Architecture
risk: red
---

# Production Clerk Golden-Path Reconciliation

## Baseline

Reconcile only additive authenticated-browser and Clerk configuration work onto
canonical commit `5f1e232bb5c1130a718c5289ba5ff0b2eccbe748`.

## Work plan

- [x] Preserve the stale branch without committing it.
- [x] Create `codex/clerk-golden-path-reconciliation` from the canonical commit.
- [x] Classify stale, upstream, conflicting, and additive changes.
- [x] Apply fail-closed Clerk issuer environment wiring.
- [x] Apply the secret-safe two-company browser preflight and harness.
- [x] Reconcile additional two-company server tests with canonical handlers.
- [x] Resolve Telegram approval disposition without weakening authorization.
- [x] Run every requested release gate without raising the 184-function ratchet.
- [x] Prepare one clean reconciliation commit.

## Release gate

- Live unauthorized: `0`
- P0/P1/P2: `0/0/0`
- Unauthorized mutations/actions: `0`
- Remaining non-Live read-only authorization findings: `≤184`
- Production Clerk qualification remains externally blocked until real runtime
  configuration and two real authenticated identities are supplied.

## Post-Deploy Monitoring & Validation

- Monitor Convex authentication, issuer/audience rejection, missing membership,
  and cross-company denial logs for 24 hours after enabling Clerk.
- Monitor Telegram approval failures for absent, expired, unmapped, or
  under-privileged operator tokens.
- Roll back the Clerk-mode UI deployment if any session falls back to legacy or
  demo behavior. Disable Telegram approval commands if recorded authority is not
  the mapped operator or if any cross-company decision succeeds.
- Owner: Mission Control product owner and platform operator.
