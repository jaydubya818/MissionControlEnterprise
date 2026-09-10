import { describe, expect, it } from "vitest";
import type { MainView } from "../TopNav";
import {
  ENTERPRISE_ROUTE_DECISIONS,
  ENTERPRISE_ROUTE_VIEWS,
  canonicalEnterpriseView,
  enterpriseRedirectLocation,
  enterpriseRouteAccess,
} from "./enterpriseRouteContract";

describe("MissionControlEnterprise route contract", () => {
  it("matches the Product Owner-approved 104-route disposition", () => {
    const counts = Object.values(ENTERPRISE_ROUTE_DECISIONS).reduce<Record<string, number>>(
      (result, decision) => {
        result[decision.disposition] = (result[decision.disposition] ?? 0) + 1;
        return result;
      },
      {}
    );

    expect(ENTERPRISE_ROUTE_VIEWS).toHaveLength(104);
    expect(new Set(ENTERPRISE_ROUTE_VIEWS).size).toBe(104);
    expect(counts).toEqual({
      consolidated: 34,
      live: 17,
      preview: 14,
      hidden: 5,
      labs: 19,
      removed: 13,
      deprecated: 2,
    });
  });

  it("maps every consolidation to a retained authoritative destination", () => {
    const retained = new Set(["live", "preview", "hidden"]);
    for (const [source, decision] of Object.entries(ENTERPRISE_ROUTE_DECISIONS)) {
      if (decision.disposition !== "consolidated") continue;
      expect(decision.destination).not.toBe(source);
      expect(retained.has(ENTERPRISE_ROUTE_DECISIONS[decision.destination].disposition)).toBe(true);
    }
  });

  it("admits Live and support routes while gating Preview and Labs", () => {
    expect(enterpriseRouteAccess("missions")).toEqual({ status: "admitted", view: "missions" });
    expect(enterpriseRouteAccess("docs")).toEqual({ status: "admitted", view: "docs" });
    expect(enterpriseRouteAccess("telemetry")).toEqual({ status: "unavailable", reason: "preview-disabled" });
    expect(enterpriseRouteAccess("telemetry", { showPreviewRoutes: true })).toEqual({ status: "admitted", view: "telemetry" });
    expect(enterpriseRouteAccess("effectiveness")).toEqual({ status: "unavailable", reason: "labs-disabled" });
    expect(enterpriseRouteAccess("effectiveness", { showLabsRoutes: true })).toEqual({ status: "admitted", view: "effectiveness" });
  });

  it("preserves stale links with explicit redirects or unavailability", () => {
    expect(canonicalEnterpriseView("home")).toBe("command-center");
    expect(canonicalEnterpriseView("qc-runs")).toBe("control-work-orders");
    expect(canonicalEnterpriseView("execution")).toBe("control-work-orders");
    expect(canonicalEnterpriseView("crm")).toBeNull();
    expect(enterpriseRouteAccess("goals")).toEqual({
      status: "redirect",
      view: "missions",
      reason: "consolidated",
    });
    expect(enterpriseRouteAccess("people")).toEqual({ status: "unavailable", reason: "removed" });
  });

  it("preserves scope while recording redirect provenance", () => {
    expect(
      enterpriseRedirectLocation(
        "automations" as MainView,
        "?company=company-1&workspace=workspace-1",
        "calendar",
        "consolidated"
      )
    ).toEqual({
      pathname: "/v2/automations",
      search: "?company=company-1&workspace=workspace-1&tab=schedule&mcRouteNotice=consolidated&mcRouteSource=calendar",
    });
  });
});
