# Phase 3 enterprise release boundary

## Decision state

Mission Control Enterprise is **not yet Level 1 — Enterprise Pilot Ready**.
The product-surface boundary is implemented and the deterministic technical
Factory qualification passes, but production authentication, external-provider
qualification, recovery, load, soak, and operational-response evidence remain
open. Level 2 is not claimed.

This inventory applies only to `jaydubya818/MissionControlEnterprise`, imported
from `jaydubya818/MissionControl` at
`ffd58077989a23004819a85f529ca74c955b1422`.

Status meanings: **PASS** is proven in the enterprise branch, **CONTROLLED** is
bounded but has remaining release work, **OPEN** requires independent work, and
**BLOCKED — EXTERNAL** requires deployment credentials or provider state not
available in the repository.

## Inventory

| Area | Current state | Risk | Pilot required | Unrestricted required | Qualification method | Owner / external dependency | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication — Clerk production configuration | Technical Clerk/Convex contract exists; production values not present in the qualification environment | A test identity can mask deployment misconfiguration | Yes | Yes | Production preflight with `VITE_AUTH_MODE=clerk`, publishable key, Convex URL, issuer domain, and anonymous context disabled | Enterprise operator / Clerk / Convex | BLOCKED — EXTERNAL |
| Authentication — authenticated browser execution | Deterministic auth contracts pass; production browser session not run | UI may fail to acquire or refresh a real token | Yes | Yes | Existing authenticated Playwright harness against deployed UI and Convex | Enterprise operator / Clerk | BLOCKED — EXTERNAL |
| Authentication — two-company browser isolation | Server-side two-company denial passes; real two-session browser proof absent | Cross-company data exposure through browser/session integration | Yes | Yes | User A/Company A and User B/Company B direct URL, query, mutation, zero-write proof | Enterprise operator / Clerk | BLOCKED — EXTERNAL |
| Authorization — admitted Live surfaces | Existing Live closure is authorized; writes/actions have zero unauthenticated findings | Regression could expose an admitted surface | Yes | Yes | Authorization ratchet, route closure gate, object and cross-company negative tests | Application security | PASS |
| Authorization — admitted Preview surfaces | All 14 Preview closures now reach only authorized Convex functions | Preview promotion could outpace object-scope proof | Yes for admitted Preview | Yes | `security:enterprise-routes`; focused unauthenticated, invalid-object, contradictory-scope, and cross-company tests | Application security | PASS |
| Authorization — inherited public reads | All 157 inherited unauthenticated reads are resolved: 149 internalized, 6 workspace-authorized, 2 bounded declared-public health probes | Regression could re-expose an internal capability or weaken object scope | Yes | Yes | Machine-checked zero baseline, active/resolved ledger, route closure, and focused anonymous/cross-company tests | Application security / product | PASS |
| Dependencies — production advisories | Current frozen audit reports 0 critical/high, 2 moderate findings covered by time-bounded reviewed acceptances, and 0 low | Accepted React Router risks must be upgraded or re-reviewed before expiry | Yes | Yes | Frozen `pnpm audit` gate with advisory IDs, versions, controls, and expiry | Platform engineering / package maintainers | PASS — ACCEPTED RISK |
| Dependencies — development/transitive advisories | Current all-dependency audit reports 0 critical/high, 7 moderate and 2 low path findings covered by reviewed acceptances | Tooling exposure and acceptance expiry can change the release decision | No | Yes | Full dependency audit and direct/transitive classification | Platform engineering | PASS — ACCEPTED RISK |
| Test infrastructure — root integration runner | Workspace-aware runner implemented; configuration regression passes | Root execution could bypass jsdom, aliases, or Node package roots | Yes | Yes | `pnpm run test:integration` plus architecture regression | Developer productivity | PASS |
| Test infrastructure — live governed-context bridge | Explicit environment-backed command exists; not executed in this environment | Deployed Convex/bridge drift can remain undetected | No if capability stays outside pilot; otherwise yes | Yes | `test:integration:governed-context-live` against isolated seeded deployment | Platform engineering / Convex | BLOCKED — EXTERNAL |
| Reliability — restart recovery | Deterministic lease/recovery contracts pass; deployed process/database restart proof not current | In-flight work may stall or duplicate after restart | Yes | Yes | Kill/restart injection across worker and Convex, then verify exact lineage and no duplicate publication | Runtime engineering / Convex | OPEN |
| Reliability — leases and worker loss | Unit/system scenarios cover stale lease and durable recovery | Host loss timing may differ under real process failure | Yes | Yes | Concurrent worker and SIGKILL scenarios with persisted lease evidence | Runtime engineering | CONTROLLED |
| Reliability — retries and idempotency | Golden-path and negative contracts cover current core lifecycle | Retry storms or duplicate side effects under provider ambiguity | Yes | Yes | Duplicate delivery, timeout-after-commit, and replay failure injection | Runtime engineering / providers | OPEN |
| Reliability — queue recovery and failover | Deterministic task/attempt scheduling exists | Backlog can strand during worker/provider outage | Yes | Yes | Queue-depth, worker-loss, recovery-time, and secondary-route exercises | Runtime engineering | OPEN |
| Reliability — degraded dependencies | Fail-closed contracts exist for several boundaries; composed degraded-mode proof incomplete | UI/runtime may show misleading health or unsafe retries | Yes | Yes | Inject Convex, GitHub, model, sandbox, and verification failures | Runtime engineering / external providers | OPEN |
| Scale — operators, companies, repositories | No Phase 3 measured concurrency envelope yet | Pilot scope could exceed proven isolation/capacity | Yes | Yes | Authenticated multi-tenant load scenario with measured percentiles | Performance / enterprise operator | OPEN |
| Scale — Missions, WorkOrders, Attempts | Functional throughput exists only in deterministic fixtures | Queue latency and database/query pressure unknown | Yes | Yes | Controlled load at increasing concurrency with saturation stop | Performance / Convex | OPEN |
| Scale — workers and sandboxes | Single-scenario local and remote paths are qualified; broad concurrency is not | Resource saturation, lease contention, provider limits | Yes | Yes | Concurrent worker/sandbox cohorts with utilization and provisioning percentiles | Runtime engineering / sandbox provider | OPEN |
| Scale — model routes and verification | Routing and verification contracts pass; live concurrency/rate limits not measured | Provider throttling can delay or misroute consequential work | Yes | Yes | Bounded real-provider cohort with rate-limit and fallback injection | Runtime engineering / model providers | OPEN |
| Providers — model route authority | Exact tuple and route-admission contracts pass | Configured provider may differ from recorded provider | Yes | Yes | Live provider receipts matched to route decision and Attempt | Runtime engineering / model providers | CONTROLLED |
| Providers — failure, timeout, fallback | Deterministic failures exist; production provider cohorts incomplete | Unsafe fallback or opaque partial completion | Yes | Yes | Rate limit, timeout, malformed output, outage, and allowed-fallback scenarios | Runtime engineering / model providers | OPEN |
| Operations — Factory Health | Real backend surface retained as Preview | Incomplete signals can imply health when dependencies are degraded | Pilot support only | Yes | Compare UI state to injected runtime/database/provider incidents | SRE / runtime engineering | OPEN |
| Operations — Work Ledger and Audit | Audit is Live; Work Ledger is Preview; scoped reads are authorized | Missing lineage can prevent incident reconstruction | Yes | Yes | Canonical action-to-audit/evidence linkage and negative omission tests | SRE / application security | CONTROLLED |
| Operations — incident aggregation, alerts, observability | Trace/Audit Live; broader telemetry remains Preview | Operators may not detect or triage failures within pilot objectives | Yes | Yes | Incident injection, alert delivery, acknowledgement, and false-health checks | SRE / notification provider | OPEN |
| Operations — runbooks | Existing Factory runbooks exist; enterprise-specific incident/recovery set incomplete | Recovery depends on author knowledge | Yes | Yes | Tabletop execution by a non-author with evidence | SRE / enterprise operator | OPEN |
| Data — persistence and artifact durability | Deterministic persisted lineage and reload proof pass | External backup/restore and artifact retention remain unproven | Yes | Yes | Restart plus backup/restore exercise against pilot deployment | Data platform / Convex / artifact stores | OPEN |
| Data — recovery assumptions | Local/system fixtures cover repair without mutation loss | Deployment RPO/RTO is unknown | Yes | Yes | Document provider guarantees; run restore and measure loss/time | Data platform / external providers | OPEN |
| Release — exact artifact and approval | Exact candidate, evidence, approval, and release contracts pass | Deployment can still select a different artifact externally | Yes | Yes | Deployed digest reconciliation against approved release record | Release engineering | CONTROLLED |
| Release — rollback and recovery | Contract support exists; production rollback exercise absent | Failed deployment may extend outage or corrupt authority chain | Yes | Yes | Staged deploy, rollback, state reconciliation, and audit proof | Release engineering / hosting provider | OPEN |
| Release — external deployment boundary | Repository does not claim a production deployment | Local qualification could be mistaken for production certification | Yes | Yes | Environment manifest, deployment identity, provider and secret preflight | Enterprise operator / hosting providers | BLOCKED — EXTERNAL |

## Current deterministic evidence

- Product surface: 104 routes classified; 15 primary Live navigation destinations.
- Live authorization: 17/17 admitted Live closures pass, including the global
  Task drawer used by the Live Tasks surface.
- Preview authorization: 14/14 admitted Preview closures pass.
- Convex authorization ratchet: 762 public functions, 760 authorized, 2
  bounded declared-public health probes, and 0 unauthorized reads, mutations,
  or actions. All 157 inherited findings remain in resolved history.
- Repository tests: 2,024 pass, one explicitly external live-deployment scenario
  not admitted as deterministic proof.
- Root integration runner: 4 architecture regressions plus the canonical
  repository suite pass under workspace-owned configurations.
- Factory V2 qualification, build, lint, runtime contract v36, secret scan, and
  dependency thresholds pass.

## Immediate release order

1. Execute production Clerk and two-company browser proof when external state is
   available; retain the external blocker until then.
2. Complete failure injection and deployed restart/recovery proof.
3. Establish a measured pilot capacity envelope and internal service objectives.
4. Qualify live providers, health/incident response, release, and rollback.
5. Reassess Level 1 only after every pilot-required row is PASS or explicitly
   bounded by an approved pilot control.
