import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

export const AUTHENTICATED_GOLDEN_PATH_ENV = Object.freeze({
  applicationUrl: "MISSION_CONTROL_URL",
  convexUrl: "MC_AUTH_GOLDEN_PATH_CONVEX_URL",
  authMode: "VITE_AUTH_MODE",
  publishableKey: "VITE_CLERK_PUBLISHABLE_KEY",
  issuerDomain: "CLERK_JWT_ISSUER_DOMAIN",
  manifestPath: "MC_AUTH_GOLDEN_PATH_MANIFEST",
  userAStorageState: "MC_AUTH_GOLDEN_PATH_USER_A_STORAGE_STATE",
  userBStorageState: "MC_AUTH_GOLDEN_PATH_USER_B_STORAGE_STATE",
});

const REQUIRED_LINEAGE_FIELDS = Object.freeze([
  "subjectId",
  "companyId",
  "projectSlug",
  "workspaceId",
  "missionId",
  "missionTitle",
  "workOrderId",
  "taskId",
  "attemptId",
  "candidateId",
  "candidateSha",
  "verificationSubjectDigest",
  "verificationPlanId",
  "approvalId",
  "releaseId",
]);

function configured(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function storageStateIssue(path, repositoryRoot) {
  if (!configured(path)) return "missing";
  if (!isAbsolute(path)) return "must-be-absolute";
  if (!existsSync(path)) return "not-found";
  const relation = relative(resolve(repositoryRoot), resolve(path));
  if (relation === "" || (!relation.startsWith("..") && !isAbsolute(relation))) {
    return "must-be-outside-repository";
  }
  return null;
}

export function validateAuthenticatedGoldenPathManifest(manifest) {
  const issues = [];
  if (manifest?.schemaVersion !== "authenticated-golden-path/v1") {
    issues.push("schemaVersion must be authenticated-golden-path/v1");
  }
  for (const label of ["companyA", "companyB"]) {
    const lineage = manifest?.[label];
    for (const field of REQUIRED_LINEAGE_FIELDS) {
      if (!configured(lineage?.[field])) issues.push(`${label}.${field} is required`);
    }
  }
  if (manifest?.companyA?.subjectId === manifest?.companyB?.subjectId) {
    issues.push("test subjects must be distinct");
  }
  if (manifest?.companyA?.companyId === manifest?.companyB?.companyId) {
    issues.push("test companies must be distinct");
  }
  if (manifest?.companyA?.workspaceId === manifest?.companyB?.workspaceId) {
    issues.push("test workspaces must be distinct");
  }
  return issues;
}

export function resolveAuthenticatedGoldenPathConfig(env = process.env, repositoryRoot = process.cwd()) {
  const missing = [];
  for (const [label, name] of Object.entries(AUTHENTICATED_GOLDEN_PATH_ENV)) {
    if (!configured(env[name])) missing.push({ label, name });
  }

  const storageStateIssues = {};
  for (const [label, name] of [
    ["userAStorageState", AUTHENTICATED_GOLDEN_PATH_ENV.userAStorageState],
    ["userBStorageState", AUTHENTICATED_GOLDEN_PATH_ENV.userBStorageState],
  ]) {
    const issue = storageStateIssue(env[name], repositoryRoot);
    if (issue) storageStateIssues[label] = issue;
  }

  let manifest = null;
  let manifestIssues = [];
  const configurationIssues = [];
  if (configured(env.VITE_AUTH_MODE) && env.VITE_AUTH_MODE.trim().toLowerCase() !== "clerk") {
    configurationIssues.push("VITE_AUTH_MODE must be clerk");
  }
  if (env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT === "1") {
    configurationIssues.push("MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT must be unset");
  }
  const manifestPath = env[AUTHENTICATED_GOLDEN_PATH_ENV.manifestPath];
  if (configured(manifestPath) && isAbsolute(manifestPath) && existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifestIssues = validateAuthenticatedGoldenPathManifest(manifest);
    } catch {
      manifestIssues = ["manifest must contain valid JSON"];
    }
  } else if (configured(manifestPath)) {
    manifestIssues = ["manifest path must be an existing absolute path"];
  }

  const ready = missing.length === 0
    && Object.keys(storageStateIssues).length === 0
    && configurationIssues.length === 0
    && manifestIssues.length === 0;
  if (
    ready
    && resolve(env[AUTHENTICATED_GOLDEN_PATH_ENV.userAStorageState])
      === resolve(env[AUTHENTICATED_GOLDEN_PATH_ENV.userBStorageState])
  ) {
    storageStateIssues.userBStorageState = "must-be-distinct-from-user-a";
  }
  const fullyReady = ready && Object.keys(storageStateIssues).length === 0;
  return {
    ready: fullyReady,
    classification: fullyReady
      ? "PRODUCTION AUTHENTICATION QUALIFICATION: READY"
      : "PRODUCTION AUTHENTICATION QUALIFICATION: BLOCKED — EXTERNAL CONFIGURATION",
    missing: missing.map(({ name }) => name),
    storageStateIssues,
    configurationIssues,
    manifestIssues,
    manifest,
    safeEvidence: {
      applicationUrlConfigured: configured(env[AUTHENTICATED_GOLDEN_PATH_ENV.applicationUrl]),
      convexUrlConfigured: configured(env[AUTHENTICATED_GOLDEN_PATH_ENV.convexUrl]),
      authModeIsClerk: env.VITE_AUTH_MODE?.trim().toLowerCase() === "clerk",
      publishableKeyConfigured: configured(env[AUTHENTICATED_GOLDEN_PATH_ENV.publishableKey]),
      issuerDomainConfigured: configured(env[AUTHENTICATED_GOLDEN_PATH_ENV.issuerDomain]),
      manifestConfigured: configured(manifestPath),
      userAStorageStateConfigured: !storageStateIssues.userAStorageState,
      userBStorageStateConfigured: !storageStateIssues.userBStorageState,
      companyA: manifest?.companyA ? {
        subjectId: manifest.companyA.subjectId,
        companyId: manifest.companyA.companyId,
        workspaceId: manifest.companyA.workspaceId,
      } : null,
      companyB: manifest?.companyB ? {
        subjectId: manifest.companyB.subjectId,
        companyId: manifest.companyB.companyId,
        workspaceId: manifest.companyB.workspaceId,
      } : null,
    },
  };
}
