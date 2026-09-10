import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

describe("repository integration runner architecture", () => {
  const rootPackage = JSON.parse(read("package.json"));

  it("delegates the integration command to the canonical workspace-aware runner", () => {
    const integrationScript = rootPackage.scripts["test:integration"];

    expect(integrationScript).toContain("pnpm run test");
    expect(integrationScript).not.toBe("npx vitest run");
    expect(integrationScript).not.toBe("pnpm exec vitest run");
  });

  it("runs package suites from their package roots and keeps root Convex tests explicit", () => {
    const canonicalScript = rootPackage.scripts.test;

    expect(canonicalScript).toContain("pnpm -r --if-present run test");
    expect(canonicalScript).toContain("pnpm exec vitest run convex/__tests__");
  });

  it("preserves the distinct browser and server Vitest environments", () => {
    const uiConfig = read("apps/mission-control-ui/vitest.config.ts");
    const orchestrationConfig = read("apps/orchestration-server/vitest.config.ts");

    expect(uiConfig).toContain('environment: "jsdom"');
    expect(uiConfig).toContain('"@": path.resolve(__dirname, "./src")');
    expect(orchestrationConfig).toContain('environment: "node"');
    expect(orchestrationConfig).toContain("root: configDir");
  });

  it("keeps the live governed-context bridge as an explicit environment-backed command", () => {
    expect(rootPackage.scripts["test:integration:governed-context-live"]).toContain(
      "RUN_GOVERNED_CONTEXT_BRIDGE_INTEGRATION=1",
    );
    expect(rootPackage.scripts["test:integration:governed-context-live"]).toContain(
      "@mission-control/orchestration-server",
    );
  });
});
