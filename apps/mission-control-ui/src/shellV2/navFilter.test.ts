import { describe, expect, it } from "vitest";
import { ENTERPRISE_NAV_GROUPS } from "./enterpriseNavConfig";
import { NAV_GROUPS } from "./navConfig";
import { filterNavGroups } from "./navFilter";
import { hasDeclaredRouteCapability } from "./routeCapabilities";

describe("filterNavGroups", () => {
  it("hides control stub views by default", () => {
    const filtered = filterNavGroups(NAV_GROUPS);
    const views = filtered.flatMap((g) => g.items.map((i) => i.view));
    expect(views).not.toContain("control-portfolio");
    expect(views).not.toContain("control-fleet");
    expect(views).toContain("control-work-orders");
    expect(views).toContain("control-approvals");
  });

  it("shows control stub views when showControlStubs is true", () => {
    const filtered = filterNavGroups(NAV_GROUPS, { showControlStubs: true });
    const views = filtered.flatMap((g) => g.items.map((i) => i.view));
    expect(views).toContain("control-portfolio");
    expect(views).toContain("control-fleet");
  });

  it("shows only the 15 approved primary Live destinations by default", () => {
    const filtered = filterNavGroups(ENTERPRISE_NAV_GROUPS, {
      enforceRouteCapabilities: true,
    });
    const items = filtered.flatMap((group) => group.items);
    const views = items.map((item) => item.view);

    expect(views).toContain("agents");
    expect(views).toContain("model-routing");
    expect(views).not.toContain("agent-catalog");
    expect(views).not.toContain("harness-loops");
    expect(views).not.toContain("effectiveness");
    expect(views).toEqual([
      "command-center",
      "missions",
      "control-work-orders",
      "tasks",
      "control-approvals",
      "projects",
      "factory",
      "agents",
      "model-routing",
      "automations",
      "atc",
      "identity",
      "deployments",
      "trace-inspector",
      "audit",
    ]);
  });

  it("exposes Preview and Labs only through their explicit flags and labels", () => {
    const previewViews = filterNavGroups(ENTERPRISE_NAV_GROUPS, {
      enforceRouteCapabilities: true,
      showPreviewRoutes: true,
    }).flatMap((group) => group.items);
    const labsViews = filterNavGroups(ENTERPRISE_NAV_GROUPS, {
      enforceRouteCapabilities: true,
      showDemoRoutes: true,
    }).flatMap((group) => group.items);

    expect(previewViews.find((item) => item.view === "effectiveness")).toBeUndefined();
    expect(previewViews.find((item) => item.view === "dag")?.badge).toBe("Preview");
    expect(previewViews.find((item) => item.view === "harness-loops")?.badge).toBe("Preview");
    expect(labsViews.find((item) => item.view === "effectiveness")?.badge).toBe("Labs");
    expect(labsViews.find((item) => item.view === "dossier")).toBeUndefined();
  });

  it("requires an explicit capability declaration for every enterprise navigation item", () => {
    const undeclared = ENTERPRISE_NAV_GROUPS.flatMap((group) => group.items)
      .map((item) => item.view)
      .filter((view) => !hasDeclaredRouteCapability(view));

    expect(undeclared).toEqual([]);
  });
});
