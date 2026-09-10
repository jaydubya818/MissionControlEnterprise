# Live route browser acceptance matrix

Release candidate: `8c2355b4b67d7a7e2a41ce95708e18ba3adcd1b9`

## Decision

All 17 approved Live route identifiers pass local shell rendering, direct deep
link, page-error, and unexpected-request-failure smoke. Their server closure is
authorized. None is fully enterprise-qualified yet because this environment
does not have deployed production Clerk, authoritative production Convex data,
orchestration credentials, provider state, or two-company browser sessions.

`PASS — LOCAL` is deliberately narrower than the Live acceptance contract.
`BLOCKED — EXTERNAL` means the proof requires the production-equivalent
environment and credentials described in the release boundary.

| Live route | Shell and direct deep link | Authorized server closure | Production auth and real data | Actions, persistence, refresh, and negative permissions | Loading, empty, error, and degraded states | Accessibility and responsive proof | Overall Live contract |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/v2/command-center` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | PARTIAL — axe critical scan only | NOT FULLY QUALIFIED |
| `/v2/missions` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/missions/:missionId` | PASS — LOCAL loading shell | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/control-work-orders` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | PARTIAL — axe critical and mobile shell | NOT FULLY QUALIFIED |
| `/v2/tasks` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | PARTIAL — axe critical and import dialog | NOT FULLY QUALIFIED |
| `/v2/control-approvals` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | PARTIAL — axe critical scan only | NOT FULLY QUALIFIED |
| `/v2/projects` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/factory` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/agents` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/model-routing` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/automations` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/automation-runs/:runId` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/atc` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/identity` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/deployments` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/trace-inspector` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |
| `/v2/audit` | PASS — LOCAL | PASS | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | BLOCKED — EXTERNAL | NOT FULLY QUALIFIED |

## Browser evidence boundary

- `pnpm run test:e2e:critical`: 12/12 Chromium tests pass. The route loop covers
  all 17 Live identifiers, the navigation test proves exactly 15 primary Live
  destinations, and the route-boundary test proves explicit redirect/removal
  behavior. Live Command Center and Work Orders expose no demo entry points.
- Critical-impact axe scans pass for Command Center, Tasks, Work Orders, and
  Decision Center, plus the PRD import dialog. The other 13 route identifiers
  do not yet have route-specific accessibility evidence.
- The responsive shell flow passes at 390 × 844 for Work Orders and navigation
  to Tasks. The remaining Live routes do not yet have route-specific responsive
  evidence.
- Page errors and unexpected request failures are empty in the local harness.
  `/gateway/status` is an intentionally tolerated offline probe. The harness
  does not establish success of production Convex or orchestration calls.
- Back/forward, refresh with persisted production records, real forms/actions,
  invalid-object denial, cross-company browser denial, and route-specific
  loading/empty/error/degraded states remain required before Level 1.
