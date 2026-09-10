import type { MainView } from "../TopNav";
import {
  ENTERPRISE_ROUTE_DECISIONS,
  enterpriseRouteDecision,
} from "./enterpriseRouteContract";

export type RouteScope = "workspace" | "global";
export type RouteMaturity = "live" | "preview" | "labs" | "hidden";

export interface RouteCapability {
  scope: RouteScope;
  maturity: RouteMaturity;
}

const GLOBAL_VIEWS = new Set<MainView>(["skills", "agent-catalog"]);

/**
 * Product capability registry for the curated enterprise shell.
 *
 * Only Live, Preview, and Labs destinations are registered as product routes.
 * Consolidated, hidden, deprecated, and removed views remain in the exhaustive
 * decision contract so stale links receive deterministic handling.
 */
export const ROUTE_CAPABILITIES = Object.fromEntries(
  Object.entries(ENTERPRISE_ROUTE_DECISIONS).flatMap(([view, decision]) => {
    if (decision.disposition !== "live"
      && decision.disposition !== "preview"
      && decision.disposition !== "labs") {
      return [];
    }
    return [[view, {
      scope: GLOBAL_VIEWS.has(view as MainView) ? "global" : "workspace",
      maturity: decision.disposition,
    } satisfies RouteCapability]];
  })
) as Partial<Record<MainView, RouteCapability>>;

const HIDDEN_CAPABILITY: RouteCapability = {
  scope: "workspace",
  maturity: "hidden",
};

export function routeCapability(view: MainView): RouteCapability {
  return ROUTE_CAPABILITIES[view] ?? HIDDEN_CAPABILITY;
}

export function hasDeclaredRouteCapability(view: MainView): boolean {
  return ROUTE_CAPABILITIES[view] != null;
}

export interface RouteVisibilityOptions {
  showPreviewRoutes?: boolean;
  showLabsRoutes?: boolean;
  /** Compatibility name for the existing persisted feature flag. */
  showDemoRoutes?: boolean;
}

export function isRouteVisible(
  view: MainView,
  options: RouteVisibilityOptions = {}
): boolean {
  const capability = routeCapability(view);
  if (capability.maturity === "live") return true;
  if (capability.maturity === "preview") return options.showPreviewRoutes === true;
  if (capability.maturity === "labs") {
    return options.showLabsRoutes === true || options.showDemoRoutes === true;
  }
  return false;
}

export function routeBadge(
  view: MainView
): "Global" | "Preview" | "Labs" | "Support" | undefined {
  const decision = enterpriseRouteDecision(view);
  if (decision.disposition === "preview") return "Preview";
  if (decision.disposition === "labs") return "Labs";
  if (decision.disposition === "hidden") return "Support";
  if (routeCapability(view).scope === "global") return "Global";
  return undefined;
}
