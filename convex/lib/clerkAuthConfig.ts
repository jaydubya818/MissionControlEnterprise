const CLERK_ISSUER_ENV = "CLERK_JWT_ISSUER_DOMAIN";

export function requireClerkJwtIssuerDomain(value: string | undefined): string {
  const candidate = value?.trim();
  if (!candidate) {
    throw new Error(
      `${CLERK_ISSUER_ENV} must be configured on the Convex deployment before Clerk authentication can be enabled.`,
    );
  }

  let issuer: URL;
  try {
    issuer = new URL(candidate);
  } catch {
    throw new Error(`${CLERK_ISSUER_ENV} must be a valid HTTPS issuer URL.`);
  }

  if (
    issuer.protocol !== "https:"
    || issuer.username
    || issuer.password
    || issuer.search
    || issuer.hash
    || (issuer.pathname !== "/" && issuer.pathname !== "")
  ) {
    throw new Error(`${CLERK_ISSUER_ENV} must be an HTTPS origin without credentials, path, query, or fragment.`);
  }

  return issuer.origin;
}
