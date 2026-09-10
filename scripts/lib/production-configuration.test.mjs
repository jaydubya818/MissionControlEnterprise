import { describe, expect, it } from "vitest";
import { evaluateProductionConfiguration } from "./production-configuration.mjs";

const valid = {
  NODE_ENV: "production",
  VITE_AUTH_MODE: "clerk",
  VITE_CLERK_PUBLISHABLE_KEY: "pk_live_qualification",
  VITE_CONVEX_URL: "https://ui.convex.cloud",
  CONVEX_URL: "https://service.convex.cloud",
  CLERK_JWT_ISSUER_DOMAIN: "https://clerk.example.com",
  VITE_ORCHESTRATION_URL: "https://orchestration.example.com",
  CONVEX_SERVICE_AUTH_TOKEN: "service-auth-token-for-test",
  ORCHESTRATION_API_TOKEN: "orchestration-token-for-test", // secret-scan: allow-fixture
  MISSION_CONTROL_SERVICE_ID: "orchestration-server",
  MISSION_CONTROL_SERVICE_COMMAND_SECRET: "service-command-secret-for-test",
  ORCHESTRATION_ALLOWED_ORIGINS: "https://mission-control.example.com",
};

describe("production configuration", () => {
  it("accepts a complete fail-closed production boundary", () => {
    expect(evaluateProductionConfiguration(valid)).toMatchObject({ ok: true, findings: [] });
  });

  it("reports missing configuration by field without returning secret values", () => {
    const result = evaluateProductionConfiguration({});
    expect(result.ok).toBe(false);
    expect(result.findings.map((item) => item.field)).toContain("CONVEX_SERVICE_AUTH_TOKEN");
    expect(JSON.stringify(result)).not.toContain(valid.CONVEX_SERVICE_AUTH_TOKEN);
  });

  it("rejects anonymous mode, wildcard CORS, localhost, and client-bundled secrets", () => {
    const result = evaluateProductionConfiguration({
      ...valid,
      MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT: "true",
      ORCHESTRATION_ALLOWED_ORIGINS: "*",
      VITE_CONVEX_URL: "http://localhost:3210",
      VITE_API_SECRET: "should-never-be-in-client-bundle",
    });
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT", state: "UNSAFE" }),
      expect.objectContaining({ field: "ORCHESTRATION_ALLOWED_ORIGINS", state: "UNSAFE" }),
      expect.objectContaining({ field: "VITE_CONVEX_URL", state: "INVALID" }),
      expect.objectContaining({ field: "VITE_API_SECRET", state: "UNSAFE" }),
    ]));
  });

  it("requires explicit worker scope and qualification when the worker is enabled", () => {
    const result = evaluateProductionConfiguration({
      ...valid,
      CODEX_FACTORY_WORKER_ENABLED: "true",
      CODEX_WORKER_MAX_CONCURRENT_RUNS: "0",
    });
    expect(result.findings.map((item) => item.field)).toEqual(expect.arrayContaining([
      "CODEX_WORKER_PROJECT_ID",
      "CODEX_WORKER_REPOSITORY_ID",
      "CODEX_WORKER_MAX_CONCURRENT_RUNS",
      "CODEX_WORKER_NETWORK_POLICY_STATUS",
      "CODEX_WORKER_SECRET_POLICY_STATUS",
    ]));
  });
});
