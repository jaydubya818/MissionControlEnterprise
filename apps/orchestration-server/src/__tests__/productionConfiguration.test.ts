import { describe, expect, it } from "vitest";
import {
  orchestrationAllowedOrigins,
  orchestrationProductionConfigurationFindings,
} from "../productionConfiguration.js";

const validProduction = {
  NODE_ENV: "production",
  CONVEX_URL: "https://example.convex.cloud",
  CONVEX_SERVICE_AUTH_TOKEN: "signed-service-token-for-tests",
  ORCHESTRATION_API_TOKEN: "inbound-orchestration-token", // secret-scan: allow-fixture
  ORCHESTRATION_ALLOWED_ORIGINS: "https://mission-control.example.com",
};

describe("orchestration production configuration", () => {
  it("accepts an explicit secure production boundary", () => {
    expect(orchestrationProductionConfigurationFindings(validProduction)).toEqual([]);
    expect(orchestrationAllowedOrigins(validProduction)).toEqual([
      "https://mission-control.example.com",
    ]);
  });

  it("fails closed without service auth, inbound auth, and explicit origins", () => {
    expect(orchestrationProductionConfigurationFindings({
      NODE_ENV: "production",
      CONVEX_URL: "https://example.convex.cloud",
    })).toEqual([
      "CONVEX_SERVICE_AUTH_TOKEN is required in production.",
      "ORCHESTRATION_API_TOKEN or MC_API_TOKEN is required in production.",
      "ORCHESTRATION_ALLOWED_ORIGINS is required in production.",
    ]);
  });

  it("rejects wildcard, insecure, and path-bearing production origins", () => {
    for (const origin of ["*", "http://mission-control.example.com", "https://mission-control.example.com/path"]) {
      expect(orchestrationProductionConfigurationFindings({
        ...validProduction,
        ORCHESTRATION_ALLOWED_ORIGINS: origin,
      })).toContain("ORCHESTRATION_ALLOWED_ORIGINS must contain only explicit https origins.");
    }
  });

  it("permits only named local UI origins by default outside production", () => {
    const origins = orchestrationAllowedOrigins({ NODE_ENV: "development" });
    expect(origins).toContain("http://localhost:5199");
    expect(origins).not.toContain("*");
  });
});
