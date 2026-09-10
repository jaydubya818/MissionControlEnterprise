#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifact = path.join(repositoryRoot, "apps/orchestration-server/dist/apps/orchestration-server/src/index.js");
const evidencePath = path.join(repositoryRoot, "docs/testing/evidence/phase-3/production-startup.json");
const serviceToken = "qualification-only-service-token";
const inboundToken = "qualification-only-inbound-token";
const baseEnvironment = {
  ...process.env,
  NODE_ENV: "production",
  CONVEX_URL: "https://qualification.invalid",
  CONVEX_SERVICE_AUTH_TOKEN: serviceToken,
  ORCHESTRATION_API_TOKEN: inboundToken, // secret-scan: allow-fixture
  ORCHESTRATION_ALLOWED_ORIGINS: "https://mission-control.qualification.invalid",
  ORCHESTRATION_DISABLE_STARTUP: "1",
};

const scenarios = [
  runScenario("configured-production-import", baseEnvironment, 0, null),
  runScenario("missing-service-identity", without(baseEnvironment, "CONVEX_SERVICE_AUTH_TOKEN"), 1, "CONVEX_SERVICE_AUTH_TOKEN is required"),
  runScenario("missing-inbound-auth", without(baseEnvironment, "ORCHESTRATION_API_TOKEN"), 1, "ORCHESTRATION_API_TOKEN or MC_API_TOKEN is required"),
  runScenario("wildcard-cors", { ...baseEnvironment, ORCHESTRATION_ALLOWED_ORIGINS: "*" }, 1, "only explicit https origins"),
];

const leaked = scenarios.some((scenario) => scenario.output.includes(serviceToken) || scenario.output.includes(inboundToken));
const passed = scenarios.every((scenario) => scenario.passed) && !leaked;
mkdirSync(path.dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify({
  schemaVersion: "mission-control-production-startup/v1",
  recordedAt: new Date().toISOString(),
  environment: "built Node ESM artifact; startup disabled before network/listen",
  result: passed ? "PASS WITH BOUNDED LIMITATION" : "FAIL",
  scenarios: scenarios.map(({ output, ...scenario }) => scenario),
  credentialValuesLogged: leaked,
  limitation: "This proves production-mode configuration admission and built-artifact import. It does not prove a deployed Convex connection, health probe, or hosting rollout.",
}, null, 2)}\n`);

if (!passed) {
  console.error("FAIL production startup qualification");
  process.exitCode = 1;
} else {
  console.log("PASS production startup configuration and built-artifact admission; deployed startup remains externally blocked.");
}

function runScenario(name, env, expectedExit, expectedMessage) {
  const result = spawnSync(process.execPath, [artifact], {
    cwd: repositoryRoot,
    env,
    encoding: "utf8",
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const exitCode = result.status ?? 1;
  return {
    name,
    expectedExit,
    observedExit: exitCode,
    expectedMessage,
    passed: exitCode === expectedExit && (!expectedMessage || output.includes(expectedMessage)),
    output,
  };
}

function without(environment, name) {
  const copy = { ...environment };
  delete copy[name];
  return copy;
}
