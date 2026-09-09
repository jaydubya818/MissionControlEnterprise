#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanConvexAuthorization } from "./lib/convex-authorization-scan.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiRoot = path.join(repoRoot, "apps/mission-control-ui/src");

// Root components are deliberately explicit. Route maturity remains owned by
// routeCapabilities.ts; this map identifies the component boundary rendered
// for each route that file currently marks Live.
const LIVE_ROUTE_ROOTS = {
  "command-center": ["eos/views/CommandCenterView.tsx"],
  "control-work-orders": ["controlPlane/WorkOrdersView.tsx"],
  "control-approvals": ["controlPlane/WorkOrderApprovalsView.tsx"],
  tasks: ["Kanban.tsx", "KanbanFilters.tsx", "LiveFeed.tsx", "Sidebar.tsx", "components/TaskboardStats.tsx", "LoopDetectionPanel.tsx"],
  "trace-inspector": ["eos/views/ExecutionInspectorView.tsx"],
  agents: ["AgentRegistryView.tsx"],
  atc: ["AtcBoardView.tsx"],
  audit: ["AuditView.tsx"],
  telemetry: ["TelemetryView.tsx"],
  automations: ["automations/AutomationsView.tsx"],
  "automation-runs": ["automations/AutomationsView.tsx"],
  skills: ["RegistryView.tsx"],
  memory: ["MemoryView.tsx", "eos/views/MemoryPillarsView.tsx"],
  docs: ["DocsView.tsx"],
  identity: ["IdentityDirectoryView.tsx"],
  deployments: ["DeploymentsView.tsx"],
  projects: ["ProjectsView.tsx"],
  "model-routing": ["ModelRoutingView.tsx"],
  "operator-evals": ["eos/views/OperatorEvalsView.tsx"],
  factory: ["FactoryView.tsx"],
  "harness-loops": ["harness/views/HarnessLoopsView.tsx"],
  missions: ["eos/views/MissionPortfolioView.tsx"],
  "mission-detail": ["eos/views/MissionDetailView.tsx"],
};

const SHARED_LIVE_ROOTS = [
  "ModalLayer.tsx",
  "RuntimeCompatibilityGate.tsx",
  "components/AppTopBar.tsx",
  "shellV2/ChatDock.tsx",
  "shellV2/useNavGroupsWithCounts.ts",
];

function resolveUiImport(fromFile, specifier) {
  let candidate;
  if (specifier.startsWith("@/")) candidate = path.join(uiRoot, specifier.slice(2));
  else if (specifier.startsWith(".")) candidate = path.resolve(path.dirname(fromFile), specifier);
  else return null;
  for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const resolved = `${candidate}${suffix}`;
    if (existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

function directApiReferences(source) {
  const references = new Set();
  for (const match of source.matchAll(/\bapi\.([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)\.([A-Za-z0-9_]+)\b/g)) {
    references.add(`${match[1].replaceAll(".", "/")}:${match[2]}`);
  }
  return references;
}

function componentGraphReferences(relativeRoots) {
  const pending = relativeRoots.map((relative) => path.join(uiRoot, relative));
  const visited = new Set();
  const references = new Set();
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file) || !existsSync(file)) continue;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    for (const reference of directApiReferences(source)) references.add(reference);
    for (const match of source.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)) {
      const resolved = resolveUiImport(file, match[2]);
      if (resolved && !visited.has(resolved)) pending.push(resolved);
    }
  }
  return references;
}

const scan = scanConvexAuthorization(repoRoot);
const unauthorizedById = new Map(scan.unauthorized.map((entry) => [`${entry.module}:${entry.name}`, entry]));
const routesByFunction = new Map();
for (const [route, roots] of Object.entries(LIVE_ROUTE_ROOTS)) {
  for (const id of componentGraphReferences([...SHARED_LIVE_ROOTS, ...roots])) {
    if (!routesByFunction.has(id)) routesByFunction.set(id, new Set());
    routesByFunction.get(id).add(route);
  }
}
// App has a small set of direct shell queries, but following all of its lazy
// imports would incorrectly classify every Preview/Demo component as Live.
for (const id of directApiReferences(readFileSync(path.join(uiRoot, "App.tsx"), "utf8"))) {
  if (!routesByFunction.has(id)) routesByFunction.set(id, new Set());
  routesByFunction.get(id).add("shared-shell");
}

const liveUnauthorized = [...unauthorizedById]
  .filter(([id]) => routesByFunction.has(id))
  .map(([id, entry]) => ({ id, ...entry, routes: [...routesByFunction.get(id)].sort() }))
  .sort((left, right) => left.id.localeCompare(right.id));

const allUiSource = componentGraphReferences(["App.tsx"]);
const p0 = scan.unauthorized.filter((entry) => entry.kind === "mutation" || entry.kind === "action");
const p1 = liveUnauthorized.filter((entry) => entry.kind === "query");
const p0Ids = new Set(p0.map((entry) => `${entry.module}:${entry.name}`));
const p1Ids = new Set(p1.map((entry) => entry.id));
const p3 = scan.unauthorized.filter((entry) => {
  const id = `${entry.module}:${entry.name}`;
  return !p0Ids.has(id) && !p1Ids.has(id) && allUiSource.has(id);
});
const classified = new Set([
  ...p0Ids,
  ...p1Ids,
  ...p3.map((entry) => `${entry.module}:${entry.name}`),
]);
const p4 = scan.unauthorized.filter((entry) => !classified.has(`${entry.module}:${entry.name}`));

const report = {
  totalPublic: scan.total,
  authorized: scan.authorizedCount,
  declaredPublic: scan.declaredPublicCount,
  unauthorized: scan.unauthorized.length,
  liveRouteUnauthorized: liveUnauthorized.length,
  priorities: { P0: p0.length, P1: p1.length, P2: 0, P3: p3.length, P4: p4.length },
  liveUnauthorized,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`${report.totalPublic} public · ${report.authorized} authorized · ${report.unauthorized} unauthorized`);
  console.log(`${report.liveRouteUnauthorized} unauthorized function(s) reachable from Live route component graphs`);
  console.log(`P0 ${p0.length} · P1 ${p1.length} · P2 0 · P3 ${p3.length} · P4 ${p4.length}`);
  for (const entry of liveUnauthorized) {
    console.log(`${entry.id}\t${entry.kind}\t${entry.routes.join(",")}`);
  }
}
