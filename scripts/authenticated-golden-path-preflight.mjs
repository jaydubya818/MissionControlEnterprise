#!/usr/bin/env node

import { resolveAuthenticatedGoldenPathConfig } from "./lib/authenticated-golden-path-config.mjs";

const result = resolveAuthenticatedGoldenPathConfig();
process.stdout.write(`${JSON.stringify({
  schemaVersion: "authenticated-golden-path-preflight/v1",
  classification: result.classification,
  browserHarness: result.ready ? "READY" : "BLOCKED",
  missingConfiguration: result.missing,
  configurationIssues: result.configurationIssues,
  storageStateIssues: result.storageStateIssues,
  manifestIssues: result.manifestIssues,
  evidence: result.safeEvidence,
}, null, 2)}\n`);
