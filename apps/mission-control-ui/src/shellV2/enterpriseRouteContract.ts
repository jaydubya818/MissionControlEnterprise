import type { MainView } from "../TopNav";

export type EnterpriseRouteDisposition =
  | "live"
  | "preview"
  | "labs"
  | "hidden"
  | "consolidated"
  | "deprecated"
  | "removed";

export type EnterpriseRouteDecision =
  | { disposition: "live" | "preview" | "labs" | "hidden" | "removed" }
  | { disposition: "consolidated" | "deprecated"; destination: MainView };

/**
 * Approved Phase 3.0 product boundary for MissionControlEnterprise.
 *
 * This is deliberately exhaustive. Adding a MainView requires an explicit
 * enterprise disposition before the application will compile.
 */
export const ENTERPRISE_ROUTE_DECISIONS = {
  home: { disposition: "consolidated", destination: "command-center" },
  atc: { disposition: "live" },
  tasks: { disposition: "live" },
  agents: { disposition: "live" },
  directory: { disposition: "consolidated", destination: "agents" },
  policies: { disposition: "preview" },
  deployments: { disposition: "live" },
  audit: { disposition: "live" },
  telemetry: { disposition: "preview" },
  automations: { disposition: "live" },
  "automation-runs": { disposition: "live" },
  dag: { disposition: "preview" },
  chat: { disposition: "hidden" },
  council: { disposition: "labs" },
  calendar: { disposition: "consolidated", destination: "automations" },
  projects: { disposition: "live" },
  "model-routing": { disposition: "live" },
  memory: { disposition: "preview" },
  captures: { disposition: "labs" },
  docs: { disposition: "hidden" },
  "design-system": { disposition: "hidden" },
  skills: { disposition: "preview" },
  "registry-lifecycle": { disposition: "consolidated", destination: "skills" },
  "registry-evaluate": { disposition: "consolidated", destination: "skills" },
  "registry-inventory": { disposition: "consolidated", destination: "skills" },
  "registry-installations": { disposition: "consolidated", destination: "skills" },
  "registry-runs": { disposition: "consolidated", destination: "skills" },
  people: { disposition: "removed" },
  org: { disposition: "removed" },
  office: { disposition: "removed" },
  "live-office": { disposition: "removed" },
  search: { disposition: "consolidated", destination: "skills" },
  identity: { disposition: "live" },
  telegraph: { disposition: "removed" },
  meetings: { disposition: "removed" },
  voice: { disposition: "removed" },
  "content-pipeline": { disposition: "removed" },
  crm: { disposition: "removed" },
  command: { disposition: "hidden" },
  code: { disposition: "preview" },
  recorder: { disposition: "labs" },
  "test-generation": { disposition: "labs" },
  "api-import": { disposition: "labs" },
  execution: { disposition: "deprecated", destination: "control-work-orders" },
  "flaky-steps": { disposition: "labs" },
  "hybrid-workflows": { disposition: "labs" },
  schedule: { disposition: "consolidated", destination: "automations" },
  codegen: { disposition: "labs" },
  gherkin: { disposition: "labs" },
  metrics: { disposition: "consolidated", destination: "analytics" },
  "qc-dashboard": { disposition: "consolidated", destination: "control-work-orders" },
  "qc-runs": { disposition: "consolidated", destination: "control-work-orders" },
  "qc-environments": { disposition: "consolidated", destination: "projects" },
  "qc-findings": { disposition: "consolidated", destination: "control-work-orders" },
  "qc-metrics": { disposition: "consolidated", destination: "analytics" },
  "qc-rulesets": { disposition: "consolidated", destination: "policies" },
  gateway: { disposition: "preview" },
  "live-chat": { disposition: "deprecated", destination: "chat" },
  schedules: { disposition: "consolidated", destination: "automations" },
  hiring: { disposition: "removed" },
  team: { disposition: "removed" },
  system: { disposition: "hidden" },
  radar: { disposition: "consolidated", destination: "command-center" },
  factory: { disposition: "live" },
  pipeline: { disposition: "consolidated", destination: "code" },
  feedback: { disposition: "removed" },
  "ops-schedule": { disposition: "consolidated", destination: "automations" },
  goals: { disposition: "consolidated", destination: "missions" },
  analytics: { disposition: "preview" },
  "command-center": { disposition: "live" },
  missions: { disposition: "live" },
  "mission-detail": { disposition: "live" },
  "trace-inspector": { disposition: "live" },
  effectiveness: { disposition: "labs" },
  "operator-evals": { disposition: "preview" },
  "factory-health": { disposition: "preview" },
  readiness: { disposition: "labs" },
  friction: { disposition: "labs" },
  "agent-catalog": { disposition: "labs" },
  dossier: { disposition: "consolidated", destination: "control-work-orders" },
  recommendations: { disposition: "labs" },
  "control-portfolio": { disposition: "removed" },
  "control-work-orders": { disposition: "live" },
  "control-fleet": { disposition: "consolidated", destination: "agents" },
  "control-approvals": { disposition: "live" },
  "harness-health": { disposition: "consolidated", destination: "factory-health" },
  "harness-loops": { disposition: "preview" },
  "harness-control-plane": { disposition: "consolidated", destination: "policies" },
  "harness-work-ledger": { disposition: "preview" },
  "harness-verifiers": { disposition: "consolidated", destination: "control-work-orders" },
  "harness-change-review": { disposition: "consolidated", destination: "control-work-orders" },
  "harness-change-risk": { disposition: "consolidated", destination: "control-work-orders" },
  "harness-launch": { disposition: "consolidated", destination: "deployments" },
  "harness-meta-loop": { disposition: "preview" },
  "harness-team-pulse": { disposition: "consolidated", destination: "command-center" },
  "harness-builder": { disposition: "labs" },
  "harness-maintenance": { disposition: "consolidated", destination: "automations" },
  "harness-code-review-wizard": { disposition: "preview" },
  "harness-workshop": { disposition: "labs" },
  "harness-automations": { disposition: "consolidated", destination: "automations" },
  "harness-agent-fleet": { disposition: "consolidated", destination: "agents" },
  "harness-software-factory": { disposition: "labs" },
  "harness-architect": { disposition: "labs" },
  "harness-patterns": { disposition: "labs" },
} satisfies Record<MainView, EnterpriseRouteDecision>;

export const ENTERPRISE_ROUTE_VIEWS = Object.keys(
  ENTERPRISE_ROUTE_DECISIONS
) as MainView[];

export function enterpriseRouteDecision(view: MainView): EnterpriseRouteDecision {
  return ENTERPRISE_ROUTE_DECISIONS[view];
}

export function canonicalEnterpriseView(view: MainView): MainView | null {
  const decision = enterpriseRouteDecision(view);
  if (decision.disposition === "consolidated" || decision.disposition === "deprecated") {
    return decision.destination;
  }
  if (decision.disposition === "removed") return null;
  return view;
}

export interface EnterpriseRouteAccessOptions {
  showPreviewRoutes?: boolean;
  showLabsRoutes?: boolean;
}

export type EnterpriseRouteAccess =
  | { status: "admitted"; view: MainView }
  | { status: "redirect"; view: MainView; reason: "consolidated" | "deprecated" }
  | { status: "unavailable"; reason: "removed" | "preview-disabled" | "labs-disabled" };

export function enterpriseRouteAccess(
  view: MainView,
  options: EnterpriseRouteAccessOptions = {}
): EnterpriseRouteAccess {
  const decision = enterpriseRouteDecision(view);
  if (decision.disposition === "consolidated" || decision.disposition === "deprecated") {
    return { status: "redirect", view: decision.destination, reason: decision.disposition };
  }
  if (decision.disposition === "removed") {
    return { status: "unavailable", reason: "removed" };
  }
  if (decision.disposition === "preview" && options.showPreviewRoutes !== true) {
    return { status: "unavailable", reason: "preview-disabled" };
  }
  if (decision.disposition === "labs" && options.showLabsRoutes !== true) {
    return { status: "unavailable", reason: "labs-disabled" };
  }
  return { status: "admitted", view };
}

export function enterprisePathForView(view: MainView): string {
  if (view === "mission-detail") return "/v2/missions";
  return `/v2/${view}`;
}

export type EnterpriseRouteNoticeReason =
  | "consolidated"
  | "deprecated"
  | "removed"
  | "preview-disabled"
  | "labs-disabled"
  | "unknown";

export const ENTERPRISE_ROUTE_NOTICE_PARAM = "mcRouteNotice";
export const ENTERPRISE_ROUTE_SOURCE_PARAM = "mcRouteSource";

const CONSOLIDATED_TAB: Partial<Record<MainView, string>> = {
  calendar: "schedule",
  "ops-schedule": "schedule",
  schedule: "schedule",
  schedules: "schedule",
  "harness-maintenance": "schedule",
  "harness-automations": "overview",
  "registry-lifecycle": "lifecycle",
  "registry-evaluate": "evaluate",
  "registry-inventory": "inventory",
  "registry-installations": "installations",
  "registry-runs": "evals",
};

export function enterpriseRedirectLocation(
  destination: MainView,
  search: string,
  source: string,
  reason: EnterpriseRouteNoticeReason
): { pathname: string; search: string } {
  const next = new URLSearchParams(search);
  const tab = CONSOLIDATED_TAB[source as MainView];
  if (tab) next.set("tab", tab);
  next.set(ENTERPRISE_ROUTE_NOTICE_PARAM, reason);
  next.set(ENTERPRISE_ROUTE_SOURCE_PARAM, source);
  const serialized = next.toString();
  return {
    pathname: enterprisePathForView(destination),
    search: serialized ? `?${serialized}` : "",
  };
}
