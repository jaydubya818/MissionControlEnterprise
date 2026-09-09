import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveAuthenticatedGoldenPathConfig,
  validateAuthenticatedGoldenPathManifest,
} from "./authenticated-golden-path-config.mjs";

function lineage(suffix) {
  return {
    subjectId: `user-${suffix}`,
    companyId: `company-${suffix}`,
    projectSlug: `project-${suffix}`,
    workspaceId: `workspace-${suffix}`,
    missionId: `mission-${suffix}`,
    missionTitle: `Mission ${suffix}`,
    workOrderId: `work-order-${suffix}`,
    taskId: `task-${suffix}`,
    attemptId: `attempt-${suffix}`,
    candidateId: `candidate-${suffix}`,
    candidateSha: suffix.repeat(40),
    verificationSubjectDigest: `subject-${suffix}`,
    verificationPlanId: `plan-${suffix}`,
    approvalId: `approval-${suffix}`,
    releaseId: `release-${suffix}`,
  };
}

describe("authenticated golden-path configuration", () => {
  it("classifies absent external configuration as blocked without exposing values", () => {
    const result = resolveAuthenticatedGoldenPathConfig({}, "/repo");
    expect(result.ready).toBe(false);
    expect(result.classification).toBe(
      "PRODUCTION AUTHENTICATION QUALIFICATION: BLOCKED — EXTERNAL CONFIGURATION",
    );
    expect(result.missing).toContain("VITE_CLERK_PUBLISHABLE_KEY");
    expect(JSON.stringify(result.safeEvidence)).not.toContain("pk_test");
  });

  it("accepts distinct complete non-secret lineage manifests", () => {
    expect(validateAuthenticatedGoldenPathManifest({
      schemaVersion: "authenticated-golden-path/v1",
      companyA: lineage("a"),
      companyB: lineage("b"),
    })).toEqual([]);
  });

  it("requires distinct users, companies, and workspaces", () => {
    const shared = lineage("same");
    const issues = validateAuthenticatedGoldenPathManifest({
      schemaVersion: "authenticated-golden-path/v1",
      companyA: shared,
      companyB: { ...shared },
    });
    expect(issues).toEqual(expect.arrayContaining([
      "test subjects must be distinct",
      "test companies must be distinct",
      "test workspaces must be distinct",
    ]));
  });

  it("requires secret-bearing browser state to live outside the repository", () => {
    const root = join(tmpdir(), `mc-auth-root-${process.pid}`);
    mkdirSync(root, { recursive: true });
    const storage = join(root, "user-a.json");
    const manifestPath = join(root, "manifest.json");
    writeFileSync(storage, "{}");
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: "authenticated-golden-path/v1",
      companyA: lineage("a"),
      companyB: lineage("b"),
    }));
    const result = resolveAuthenticatedGoldenPathConfig({
      MISSION_CONTROL_URL: "https://mission-control.example",
      MC_AUTH_GOLDEN_PATH_CONVEX_URL: "https://deployment.convex.cloud",
      VITE_AUTH_MODE: "clerk",
      VITE_CLERK_PUBLISHABLE_KEY: "configured-but-never-emitted",
      CLERK_JWT_ISSUER_DOMAIN: "https://issuer.example",
      MC_AUTH_GOLDEN_PATH_MANIFEST: manifestPath,
      MC_AUTH_GOLDEN_PATH_USER_A_STORAGE_STATE: storage,
      MC_AUTH_GOLDEN_PATH_USER_B_STORAGE_STATE: storage,
    }, root);
    expect(result.ready).toBe(false);
    expect(result.storageStateIssues.userAStorageState).toBe("must-be-outside-repository");
  });

  it("becomes ready only with two distinct external browser sessions", () => {
    const secureRoot = join(tmpdir(), `mc-auth-secure-${process.pid}`);
    mkdirSync(secureRoot, { recursive: true });
    const userAState = join(secureRoot, "user-a.json");
    const userBState = join(secureRoot, "user-b.json");
    const manifestPath = join(secureRoot, "manifest.json");
    writeFileSync(userAState, "{}");
    writeFileSync(userBState, "{}");
    writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: "authenticated-golden-path/v1",
      companyA: lineage("a"),
      companyB: lineage("b"),
    }));
    const result = resolveAuthenticatedGoldenPathConfig({
      MISSION_CONTROL_URL: "https://mission-control.example",
      MC_AUTH_GOLDEN_PATH_CONVEX_URL: "https://deployment.convex.cloud",
      VITE_AUTH_MODE: "clerk",
      VITE_CLERK_PUBLISHABLE_KEY: "configured-but-never-emitted",
      CLERK_JWT_ISSUER_DOMAIN: "https://issuer.example",
      MC_AUTH_GOLDEN_PATH_MANIFEST: manifestPath,
      MC_AUTH_GOLDEN_PATH_USER_A_STORAGE_STATE: userAState,
      MC_AUTH_GOLDEN_PATH_USER_B_STORAGE_STATE: userBState,
    }, "/repository-root");
    expect(result.ready).toBe(true);
    expect(result.classification).toBe("PRODUCTION AUTHENTICATION QUALIFICATION: READY");
    expect(JSON.stringify(result.safeEvidence)).not.toContain("configured-but-never-emitted");
  });

  it("rejects legacy or anonymous demo authentication as qualification inputs", () => {
    const result = resolveAuthenticatedGoldenPathConfig({
      VITE_AUTH_MODE: "legacy",
      MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT: "1",
    }, "/repository-root");
    expect(result.ready).toBe(false);
    expect(result.configurationIssues).toEqual([
      "VITE_AUTH_MODE must be clerk",
      "MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT must be unset",
    ]);
  });
});
