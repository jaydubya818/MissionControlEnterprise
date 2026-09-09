import type { AuthConfig } from "convex/server";
import { requireClerkJwtIssuerDomain } from "./lib/clerkAuthConfig";

// This public issuer must be configured independently on every Convex
// deployment and must match the Clerk instance that supplies the browser's
// VITE_CLERK_PUBLISHABLE_KEY. Missing configuration intentionally prevents the
// auth configuration from being synchronized.
const clerkIssuerDomain = requireClerkJwtIssuerDomain(
  process.env.CLERK_JWT_ISSUER_DOMAIN,
);

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
