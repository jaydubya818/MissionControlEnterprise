# Server-side authorization remediation

Date: 2026-09-09

## Outcome

Mission Control's public Convex surface now fails closed for every mutation and action, and every function reachable from a Live route resolves server-side authority before returning data or changing state.

| Measure | Before | After |
| --- | ---: | ---: |
| Public Convex functions | 924 | 917 |
| Authorized functions | 287 | 733 |
| Declared-public functions | 0 | 0 |
| Unauthorized functions | 637 | 184 |
| Unauthorized Live-route functions | not tracked | 0 |
| Unauthorized mutations/actions | not tracked | 0 |

Functions remediated: 453 of the original unauthorized set. Seven identity scan helpers were converted from public functions to internal Convex functions.

## Standard authorization boundaries

Human workspace operations use `convex/lib/companyAccess.ts`. These helpers derive the operator from `ctx.auth`, resolve company membership and role assignments on the server, and reject missing, invalid, unscoped, or cross-workspace resources.

Legacy public mutations use `authedMutation` from `convex/lib/authedFunctions.ts`. It derives scope from the supplied project and referenced Convex objects, rejects mixed workspace/company scopes, requires `factory.improve` in the owning workspace, and reserves truly deployment-global writes for company administrators. Deployment-global queries use `authedQuery`, which establishes an authenticated identity but is not a substitute for workspace authorization.

Public actions use `authedAction`. Workspace actions resolve `factory.improve` through an internal authorization query; actions without a workspace argument require a company administrator.

Machine execution uses the signed service-command boundary in `convex/serviceCommands.ts`. Its envelope binds service identity, capability, project, repository, command ID, issuance and expiry times, and payload digest to a signature. Claims are persisted to reject replay. The orchestration server and workflow engine provide `CONVEX_SERVICE_AUTH_TOKEN`; the agent runtime, OpenClaw SDK, Telegram bot, and legacy factory worker now require or accept the same explicit workload credential for authenticated Convex calls.

The local demo-only anonymous company context remains gated by the explicit `MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT=1` environment setting. Demo seeding rejects calls outside that environment.

## Object-level controls added

The remediation added or tightened object-derived authorization for Tasks, WorkOrders, approvals, comments, alerts, saved views, agents, agent memory, automations, scheduled jobs, operator controls, missions, mission chat, PRD import, QC, workflow runs, monitoring, analytics, activity history, knowledge chat, and the knowledge graph.

Client-supplied actor IDs are no longer trusted in the remediated approval, automation, saved-view, mission-chat, PRD-import, agent-status, and operator-control paths. Audit identity comes from the authenticated server context.

## Inventory and ratchet

Run the scanner and monotonic ratchet with:

```bash
pnpm run security:authorization
```

Run the Live-route dependency report with:

```bash
node scripts/report-live-route-authorization.mjs
```

The ratchet baseline is `scripts/convex-authorization-baseline.json`. CI fails when a new unauthorized public function appears. The baseline may only be updated when the unauthorized set shrinks.

The Live-route report uses explicit route roots corresponding to `apps/mission-control-ui/src/shellV2/routeCapabilities.ts`, walks their local import graphs, and intersects `api.*` references with the authorization scanner. Shared-shell calls are reported as shared dependencies.

## Remaining debt

The 184 remaining functions are read-only queries outside Live route graphs:

- P0 — consequential mutations/actions: 0
- P1 — Live-route sensitive reads: 0
- P2 — Live-route operational/administrative reads: 0
- P3 — Preview/Demo UI queries: 44
- P4 — legacy or currently unreachable queries: 140

No remaining function is intentionally anonymous or declared public. These queries remain in the ratchet so the count cannot increase. They must be authorized or converted to internal functions before their owning surface is promoted to Live.

## Verification coverage

Negative coverage includes unauthenticated denial, wrong workspace denial, invalid workspace IDs, insufficient-role denial, authorized callers, legacy scoped-write derivation, global administrator enforcement, rollout fail-closed behavior, exact action authorization boundaries, and scanner anti-spoofing.

No UI layout or visual behavior changed. A browser visual comparison is not applicable; affected UI operations retain their existing loading and error handling while denied calls flow through their normal error states.

## Qualification result

- Build: PASS (`pnpm run build`).
- Lint: PASS (`pnpm run lint`).
- Typecheck: PASS (`pnpm run ci:typecheck`).
- Unit: PASS (`pnpm run test`), including 787 Convex tests, 306 UI tests, and all package suites; one environment-backed orchestration integration test is intentionally skipped by its suite.
- Integration: the repository-wide `pnpm run test:integration` command is not a valid green gate in the current checkout. It collects three executable `.test.mjs` scripts with no Vitest suite, runs UI tests without the UI jsdom/path-alias configuration, and detects pre-existing Factory README consistency drift. Authorization-specific integration and golden-path suites pass under `pnpm run test`.
- Authorization: PASS; 917 public, 733 authorized, 184 unauthorized read-only non-Live queries; baseline 184.
- Route qualification: PASS; zero unauthorized functions in Live route component graphs.
- Factory qualification: PASS. Step C repaired the four README consistency statements without changing the checker or Factory claims, and the canonical Factory V2 system test remains green.
- Browser smoke: PASS (`pnpm run test:e2e:critical`, 9 tests). Clerk mode also fails closed in the browser when its publishable key is unavailable; production Clerk login and two-company browser isolation remain external qualification blockers.

## Step C regression

The authenticated enterprise golden-path qualification at `docs/testing/evidence/enterprise-golden-path/` preserved this ratchet exactly: 917 public functions, 733 authorized functions, 184 non-Live read-only findings, zero Live-route unauthorized functions, and P0/P1/P2 all zero. It also proves unauthenticated and cross-company reads/writes are denied through `requireWorkspacePermission`. No authorization baseline was changed.
