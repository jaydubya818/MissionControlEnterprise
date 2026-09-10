import { describe, expect, it } from "vitest";
import { ENTERPRISE_NAV_GROUPS } from "./enterpriseNavConfig";
import { ENTERPRISE_ROUTE_DECISIONS } from "./enterpriseRouteContract";

describe("enterprise navigation", () => {
  const groups = new Map(ENTERPRISE_NAV_GROUPS.map((group) => [group.id, group]));
  const views = ENTERPRISE_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.view));

  it("contains 15 primary Live destinations", () => {
    const primary = ENTERPRISE_NAV_GROUPS
      .filter((group) => !["preview", "labs"].includes(group.id))
      .flatMap((group) => group.items.map((item) => item.view));
    expect(primary).toHaveLength(15);
    expect(primary.every((view) => ENTERPRISE_ROUTE_DECISIONS[view].disposition === "live")).toBe(true);
  });

  it("isolates the 14 Preview and 19 Labs destinations", () => {
    expect(groups.get("preview")?.items).toHaveLength(14);
    expect(groups.get("labs")?.items).toHaveLength(19);
    expect(groups.get("preview")?.items.every((entry) => ENTERPRISE_ROUTE_DECISIONS[entry.view].disposition === "preview")).toBe(true);
    expect(groups.get("labs")?.items.every((entry) => ENTERPRISE_ROUTE_DECISIONS[entry.view].disposition === "labs")).toBe(true);
  });

  it("does not duplicate or expose consolidated, hidden, deprecated, or removed routes", () => {
    expect(new Set(views).size).toBe(views.length);
    expect(views.every((view) => ["live", "preview", "labs"].includes(ENTERPRISE_ROUTE_DECISIONS[view].disposition))).toBe(true);
  });
});
