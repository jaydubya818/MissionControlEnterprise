#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanConvexAuthorization } from "./lib/convex-authorization-scan.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(repoRoot, "scripts", "convex-authorization-baseline.json");
const classificationPath = path.join(repoRoot, "scripts", "authorization-debt-classification.json");

const baseline = JSON.parse(readFileSync(baselinePath, "utf8")).unauthorized ?? [];
const document = JSON.parse(readFileSync(classificationPath, "utf8"));
const entries = document.entries ?? [];
const resolvedEntries = document.resolvedEntries ?? [];
const publicFunctionsById = new Map(
  scanConvexAuthorization(repoRoot).functions.map((entry) => [`${entry.module}:${entry.name}`, entry]),
);

const sourceFiles = [];
const sourceText = new Map();
const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  "dist",
  "docs",
  "coverage",
  "test-results",
  "playwright-report",
  "_generated",
]);

function collectSourceFiles(directory) {
  for (const name of readdirSync(directory)) {
    if (ignoredDirectories.has(name)) continue;
    const absolutePath = path.join(directory, name);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) collectSourceFiles(absolutePath);
    else if (/\.(?:ts|tsx|mts|mjs|js|jsx|sh)$/.test(name)) sourceFiles.push(absolutePath);
  }
}

for (const directory of ["apps", "packages", "scripts", "tests", "convex"]) {
  collectSourceFiles(path.join(repoRoot, directory));
}
for (const filePath of sourceFiles) sourceText.set(filePath, readFileSync(filePath, "utf8"));

function exactRepositoryCallers(moduleName, functionName) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const dotModule = moduleName.replaceAll("/", ".");
  const identifier = `${moduleName}:${functionName}`;
  const patterns = [
    new RegExp(`${escape(`api.${dotModule}.${functionName}`)}(?![A-Za-z0-9_$])`),
    new RegExp(`${escape(`api["${moduleName}"].${functionName}`)}(?![A-Za-z0-9_$])`),
    new RegExp(`${escape(`api['${moduleName}'].${functionName}`)}(?![A-Za-z0-9_$])`),
    new RegExp(escape(`"${identifier}"`)),
    new RegExp(escape(`'${identifier}'`)),
  ];
  const ownFile = path.join(repoRoot, "convex", `${moduleName}.ts`);
  return sourceFiles
    .filter((filePath) => filePath !== ownFile)
    .filter((filePath) => patterns.some((pattern) => pattern.test(sourceText.get(filePath))))
    .map((filePath) => path.relative(repoRoot, filePath))
    .sort();
}

const allowedClassifications = new Set([
  "PREVIEW",
  "DEMO",
  "LEGACY",
  "UNREACHABLE",
  "DEVELOPER TOOL",
  "INTERNALIZATION CANDIDATE",
  "FUTURE PRODUCT SURFACE",
]);
const allowedAdmissions = new Set([
  "NOT_ADMITTED",
  "LABS_ONLY",
  "DEVELOPER_TOOL",
  "LEGACY_COMPONENT_ONLY",
  "RUNTIME_SERVICE",
]);
const allowedResolutions = new Set(["AUTHORIZED", "DECLARED_PUBLIC", "INTERNALIZED"]);

const errors = [];
const classified = [];
const resolved = [];
const counts = new Map();
let knownCallerCount = 0;

for (const [index, entry] of entries.entries()) {
  const label = `entries[${index}]`;
  if (typeof entry.module !== "string" || entry.module.length === 0) {
    errors.push(`${label}: module is required`);
    continue;
  }
  if (!Array.isArray(entry.functions) || entry.functions.length === 0) {
    errors.push(`${label} (${entry.module}): functions must be non-empty`);
    continue;
  }
  if (!allowedClassifications.has(entry.classification)) {
    errors.push(`${label} (${entry.module}): unsupported classification '${entry.classification}'`);
  }
  if (!allowedAdmissions.has(entry.admission)) {
    errors.push(`${label} (${entry.module}): unsupported admission '${entry.admission}'`);
  }
  for (const field of ["whyItRemains", "remediation"]) {
    if (typeof entry[field] !== "string" || entry[field].trim().length < 12) {
      errors.push(`${label} (${entry.module}): ${field} must be a meaningful explanation`);
    }
  }
  if (entry.readOnly !== true) {
    errors.push(`${label} (${entry.module}): every baseline item must be explicitly readOnly=true`);
  }
  for (const field of ["pilotBlocker", "unrestrictedReleaseBlocker"]) {
    if (typeof entry[field] !== "boolean") {
      errors.push(`${label} (${entry.module}): ${field} must be boolean`);
    }
  }
  if (!entry.calledFunctions || typeof entry.calledFunctions !== "object" || Array.isArray(entry.calledFunctions)) {
    errors.push(`${label} (${entry.module}): calledFunctions must be an object`);
  }

  const names = new Set(entry.functions);
  for (const [functionName, callers] of Object.entries(entry.calledFunctions ?? {})) {
    if (!names.has(functionName)) {
      errors.push(`${label} (${entry.module}): calledFunctions names unclassified function '${functionName}'`);
    }
    if (!Array.isArray(callers) || callers.length === 0 || callers.some((caller) => typeof caller !== "string" || caller.length === 0)) {
      errors.push(`${label} (${entry.module}:${functionName}): callers must be a non-empty string array`);
    } else {
      knownCallerCount += 1;
    }
  }

  for (const functionName of entry.functions) {
    if (typeof functionName !== "string" || functionName.length === 0) {
      errors.push(`${label} (${entry.module}): invalid function name`);
      continue;
    }
    classified.push(`${entry.module}:${functionName}`);
    counts.set(entry.classification, (counts.get(entry.classification) ?? 0) + 1);
    const recordedCallers = [...(entry.calledFunctions?.[functionName] ?? [])].sort();
    const actualCallers = exactRepositoryCallers(entry.module, functionName);
    if (JSON.stringify(recordedCallers) !== JSON.stringify(actualCallers)) {
      errors.push(
        `${label} (${entry.module}:${functionName}): calledFunctions drift; ` +
          `recorded=[${recordedCallers.join(", ")}] actual=[${actualCallers.join(", ")}]`,
      );
    }
  }
}

for (const [index, entry] of resolvedEntries.entries()) {
  const label = `resolvedEntries[${index}]`;
  if (typeof entry.module !== "string" || entry.module.length === 0) {
    errors.push(`${label}: module is required`);
    continue;
  }
  if (!Array.isArray(entry.functions) || entry.functions.length === 0) {
    errors.push(`${label} (${entry.module}): functions must be non-empty`);
    continue;
  }
  if (!allowedClassifications.has(entry.classification)) {
    errors.push(`${label} (${entry.module}): unsupported classification '${entry.classification}'`);
  }
  if (!allowedAdmissions.has(entry.admission)) {
    errors.push(`${label} (${entry.module}): unsupported admission '${entry.admission}'`);
  }
  if (!allowedResolutions.has(entry.resolution)) {
    errors.push(`${label} (${entry.module}): unsupported resolution '${entry.resolution}'`);
  }
  if (entry.readOnly !== true || entry.pilotBlocker !== false || entry.unrestrictedReleaseBlocker !== false) {
    errors.push(`${label} (${entry.module}): resolved reads must be read-only and non-blocking`);
  }
  for (const field of ["whyItRemains", "remediation", "resolutionEvidence"]) {
    if (typeof entry[field] !== "string" || entry[field].trim().length < 12) {
      errors.push(`${label} (${entry.module}): ${field} must be a meaningful explanation`);
    }
  }
  for (const functionName of entry.functions) {
    const identifier = `${entry.module}:${functionName}`;
    resolved.push(identifier);
    const publicFunction = publicFunctionsById.get(identifier);
    if (entry.resolution === "INTERNALIZED" && publicFunction) {
      errors.push(`${label} (${identifier}): INTERNALIZED resolution is still in the public Convex contract`);
    }
    if (entry.resolution === "AUTHORIZED" && !publicFunction?.authorized) {
      errors.push(`${label} (${identifier}): AUTHORIZED resolution is not an authorized public function`);
    }
    if (
      entry.resolution === "DECLARED_PUBLIC" &&
      (!publicFunction?.declaredPublic || typeof publicFunction.publicReason !== "string" || publicFunction.publicReason.trim().length < 20)
    ) {
      errors.push(`${label} (${identifier}): DECLARED_PUBLIC resolution lacks a valid publicQuery declaration`);
    }
  }
}

const duplicateIds = classified.filter((id, index) => classified.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  errors.push(`duplicate classifications: ${[...new Set(duplicateIds)].sort().join(", ")}`);
}
const allLedgerIds = [...classified, ...resolved];
const allDuplicateIds = allLedgerIds.filter((id, index) => allLedgerIds.indexOf(id) !== index);
if (allDuplicateIds.length > 0) {
  errors.push(`active/resolved overlap: ${[...new Set(allDuplicateIds)].sort().join(", ")}`);
}

const baselineSet = new Set(baseline);
const classifiedSet = new Set(classified);
const missing = baseline.filter((id) => !classifiedSet.has(id));
const stale = classified.filter((id) => !baselineSet.has(id));
if (missing.length > 0) errors.push(`missing baseline functions: ${missing.join(", ")}`);
if (stale.length > 0) errors.push(`stale/non-baseline functions: ${stale.join(", ")}`);
const resolvedStillPublic = resolved.filter((id) => baselineSet.has(id));
if (resolvedStillPublic.length > 0) {
  errors.push(`resolved functions still present in unauthorized baseline: ${resolvedStillPublic.join(", ")}`);
}
if (typeof document.originalClassifiedCount !== "number" || allLedgerIds.length !== document.originalClassifiedCount) {
  errors.push(
    `classification history must contain exactly originalClassifiedCount=${document.originalClassifiedCount}; ` +
      `found ${allLedgerIds.length}`,
  );
}

if (errors.length > 0) {
  console.error("Authorization debt classification: FAIL");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Authorization debt classification: PASS — ${classified.length}/${baseline.length} ` +
    `unauthorized public reads have explicit dispositions across ${entries.length} active records; ` +
    `${resolved.length} reads are retained in the resolved history.`,
);
for (const resolution of [...allowedResolutions].sort()) {
  const count = resolvedEntries
    .filter((entry) => entry.resolution === resolution)
    .reduce((sum, entry) => sum + entry.functions.length, 0);
  console.log(`  Resolved ${resolution}: ${count}`);
}
for (const [classification, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${classification}: ${count}`);
}
console.log(`  With known repository callers: ${knownCallerCount}`);
console.log(`  Network reachable: ${classified.length} (public Convex contract)`);
console.log(`  Pilot blockers: ${entries.filter((entry) => entry.pilotBlocker).reduce((sum, entry) => sum + entry.functions.length, 0)}`);
console.log(`  Unrestricted-release blockers: ${entries.filter((entry) => entry.unrestrictedReleaseBlocker).reduce((sum, entry) => sum + entry.functions.length, 0)}`);
