import { describe, expect, it } from "vitest";
import { requireClerkJwtIssuerDomain } from "../lib/clerkAuthConfig";

describe("Clerk Convex auth configuration", () => {
  it("normalizes a configured Clerk issuer origin", () => {
    expect(
      requireClerkJwtIssuerDomain("  https://example.clerk.accounts.dev/  "),
    ).toBe("https://example.clerk.accounts.dev");
  });

  it.each([undefined, "", "   "])("fails closed when the issuer is missing", (value) => {
    expect(() => requireClerkJwtIssuerDomain(value)).toThrow(
      "CLERK_JWT_ISSUER_DOMAIN must be configured",
    );
  });

  it.each([
    "http://example.clerk.accounts.dev",
    "https://user:password@example.clerk.accounts.dev",
    "https://example.clerk.accounts.dev/path",
    "https://example.clerk.accounts.dev?tenant=other",
    "not-a-url",
  ])("rejects an unsafe or ambiguous issuer: %s", (value) => {
    expect(() => requireClerkJwtIssuerDomain(value)).toThrow(
      "CLERK_JWT_ISSUER_DOMAIN must be",
    );
  });
});
