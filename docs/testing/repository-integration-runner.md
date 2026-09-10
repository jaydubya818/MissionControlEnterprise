# Repository integration runner

## Decision

`pnpm run test:integration` delegates actual test execution to the canonical
workspace-aware `pnpm run test` command. It does not invoke an unscoped root
Vitest process over the entire monorepo.

## Architecture

The runner has three layers:

1. A focused configuration regression test protects this routing contract.
2. `pnpm -r --if-present run test` runs each workspace test script from that
   package's directory, allowing its local `vitest.config.ts` to control aliases,
   include patterns, timeouts, and environment.
3. The root Convex contract tests run explicitly from `convex/__tests__` because
   Convex is repository-owned rather than a workspace package.

This preserves the UI package's `jsdom` environment and `@` alias while keeping
orchestration and library packages in their Node environments. A raw
repository-root `vitest run` is prohibited because it bypasses those boundaries.

## Live external integration

The governed-context bridge scenario requires a running, correctly seeded Convex
deployment and is intentionally separate from deterministic repository tests. Run
it explicitly with:

```bash
CONVEX_URL=<qualified-deployment> \
GOVERNED_CONTEXT_TEST_REPO_SLUG=<isolated-fixture-slug> \
pnpm run test:integration:governed-context-live
```

That command enables the live suite; it fails on missing backend state or fixture
data. The deterministic repository runner does not claim this external proof.

## Regression protection

`scripts/lib/repository-integration-runner.test.mjs` fails if the integration
entry point returns to a raw root Vitest invocation, if recursive workspace or
root Convex coverage is removed, or if the critical UI/server environments drift.
