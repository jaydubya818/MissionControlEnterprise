#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { scanConvexAuthorization } from "./lib/convex-authorization-scan.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiRoot = path.join(repoRoot, "apps", "mission-control-ui", "src");

const liveEntries = {
  "command-center": ["eos/views/CommandCenterView.tsx"],
  atc: ["AtcBoardView.tsx"],
  tasks: [
    "Sidebar.tsx",
    "Kanban.tsx",
    "KanbanFilters.tsx",
    "LiveFeed.tsx",
    "LoopDetectionPanel.tsx",
    "TaskDrawerTabs.tsx",
    "components/TaskboardStats.tsx",
  ],
  agents: ["AgentRegistryView.tsx"],
  deployments: ["DeploymentsView.tsx"],
  audit: ["AuditView.tsx"],
  automations: ["automations/AutomationsView.tsx"],
  "automation-runs/:runId": ["automations/AutomationsView.tsx"],
  projects: ["ProjectsView.tsx"],
  "model-routing": ["ModelRoutingView.tsx"],
  identity: ["IdentityDirectoryView.tsx"],
  factory: ["FactoryView.tsx"],
  missions: ["eos/views/MissionPortfolioView.tsx"],
  "missions/:missionId": ["eos/views/MissionDetailView.tsx"],
  "trace-inspector": ["eos/views/ExecutionInspectorView.tsx"],
  "control-work-orders": ["controlPlane/WorkOrdersView.tsx"],
  "control-approvals": ["controlPlane/WorkOrderApprovalsView.tsx"],
};

const previewEntries = {
  policies: ["PoliciesView.tsx"],
  dag: ["MissionDAGView.tsx"],
  telemetry: ["TelemetryView.tsx"],
  analytics: ["AnalyticsView.tsx"],
  "factory-health": ["eos/views/FactoryOpsView.tsx"],
  "harness-work-ledger": ["harness/views/HarnessWorkLedgerView.tsx"],
  code: ["CodePipelineView.tsx"],
  skills: ["RegistryView.tsx"],
  memory: ["MemoryView.tsx", "eos/views/MemoryPillarsView.tsx"],
  "operator-evals": ["eos/views/OperatorEvalsView.tsx"],
  "harness-loops": ["harness/views/HarnessLoopsView.tsx"],
  gateway: ["GatewaySettingsView.tsx"],
  "harness-code-review-wizard": ["harness/views/HarnessCodeReviewWizardView.tsx"],
  "harness-meta-loop": ["harness/views/HarnessMetaLoopView.tsx"],
};

const sourceExtensions = [".ts", ".tsx", ".js", ".jsx"];

function resolveLocalImport(fromFile, specifier) {
  let base;
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else if (specifier.startsWith("@/")) {
    base = path.resolve(uiRoot, specifier.slice(2));
  } else {
    return null;
  }

  const candidates = [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...sourceExtensions.map((extension) => path.join(base, `index${extension}`)),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

function apiPath(node) {
  if (ts.isIdentifier(node)) return node.text === "api" ? [] : null;
  if (ts.isPropertyAccessExpression(node)) {
    const parent = apiPath(node.expression);
    return parent ? [...parent, node.name.text] : null;
  }
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    const parent = apiPath(node.expression);
    return parent ? [...parent, node.argumentExpression.text] : null;
  }
  return null;
}

function isApiChainParent(node) {
  const parent = node.parent;
  return (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent))
    && parent.expression === node
    && apiPath(parent) !== null;
}

function inspectFile(filePath) {
  const source = ts.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const imports = [];
  const functions = new Set();

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      const resolved = resolveLocalImport(filePath, node.moduleSpecifier.text);
      if (resolved) imports.push(resolved);
    }

    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
      && !isApiChainParent(node)
    ) {
      const parts = apiPath(node);
      if (parts && parts.length >= 2) {
        const functionName = parts.at(-1);
        const moduleName = parts.slice(0, -1).join("/");
        functions.add(`${moduleName}:${functionName}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return { imports, functions };
}

function collectClosure(entryFiles) {
  const pending = entryFiles.map((entry) => path.join(uiRoot, entry));
  const visited = new Set();
  const functions = new Set();

  while (pending.length > 0) {
    const filePath = pending.pop();
    if (!filePath || visited.has(filePath)) continue;
    if (!existsSync(filePath)) throw new Error(`Missing Preview entry: ${filePath}`);
    visited.add(filePath);
    const result = inspectFile(filePath);
    for (const identifier of result.functions) functions.add(identifier);
    for (const imported of result.imports) {
      if (!visited.has(imported)) pending.push(imported);
    }
  }

  return { files: visited, functions };
}

const authorization = scanConvexAuthorization(repoRoot);
const notServerAuthorized = new Set(
  authorization.functions
    .filter((entry) => !entry.authorized)
    .map((entry) => `${entry.module}:${entry.name}`)
);
const findings = [];

for (const [maturity, routes] of [["Live", liveEntries], ["Preview", previewEntries]]) {
  for (const [route, entries] of Object.entries(routes)) {
    const closure = collectClosure(entries);
    const routeUnauthorized = [...closure.functions]
      .filter((identifier) => notServerAuthorized.has(identifier))
      .sort();
    findings.push({
      maturity,
      route,
      fileCount: closure.files.size,
      functionCount: closure.functions.size,
      unauthorized: routeUnauthorized,
    });
  }
}

console.log("Enterprise Live and Preview route authorization closure:");
for (const finding of findings) {
  const status = finding.unauthorized.length === 0 ? "PASS" : "FAIL";
  console.log(
    `  ${status} ${finding.maturity} /v2/${finding.route}: ${finding.functionCount} Convex function(s) across ${finding.fileCount} UI module(s)`
  );
  for (const identifier of finding.unauthorized) console.log(`    - ${identifier}`);
}

const failed = findings.filter((finding) => finding.unauthorized.length > 0);
if (failed.length > 0) {
  const count = new Set(failed.flatMap((finding) => finding.unauthorized)).size;
  console.error(
    `\nEnterprise route authorization: FAIL — ${failed.length} admitted route(s) reach ${count} unauthorized public Convex function(s).`
  );
  process.exit(1);
}

console.log("\nEnterprise route authorization: PASS — all admitted Live and Preview closures require server authorization.");
