import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(__dirname, "../lib/deliveryAuthorization.ts"),
  "utf8",
);

describe("delivery authorization fails closed", () => {
  it("does not use feature flags or provisioning state as authorization evidence", () => {
    expect(source).not.toContain("resolveFlag");
    expect(source).not.toContain("resolveDeploymentAuthorizationMode");
    expect(source).not.toContain("authorizationRequiredFor");
  });

  it("requires an authoritative workspace and membership on every call", () => {
    expect(source).toContain('if (!projectId) throw new Error("An authorized workspace is required.")');
    expect(source).toContain("await requireWorkspaceAccess(");
  });

  it("does not grant record access merely because the access result is absent", () => {
    expect(source).not.toContain("if (!access ||");
  });
});
