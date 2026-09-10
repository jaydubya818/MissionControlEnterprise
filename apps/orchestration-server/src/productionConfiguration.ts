const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5180",
  "http://localhost:5199",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5180",
  "http://127.0.0.1:5199",
];

export function orchestrationAllowedOrigins(
  env: NodeJS.ProcessEnv,
  production = env.NODE_ENV === "production",
): string[] {
  const configured = (env.ORCHESTRATION_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.length > 0 ? [...new Set(configured)] : production ? [] : DEVELOPMENT_ORIGINS;
}

export function orchestrationProductionConfigurationFindings(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== "production") return [];
  const findings: string[] = [];
  if (!validSecureUrl(env.CONVEX_URL)) findings.push("CONVEX_URL must be an https URL in production.");
  if (!nonPlaceholder(env.CONVEX_SERVICE_AUTH_TOKEN)) findings.push("CONVEX_SERVICE_AUTH_TOKEN is required in production.");
  if (!nonPlaceholder(env.ORCHESTRATION_API_TOKEN) && !nonPlaceholder(env.MC_API_TOKEN)) {
    findings.push("ORCHESTRATION_API_TOKEN or MC_API_TOKEN is required in production.");
  }
  const origins = orchestrationAllowedOrigins(env, true);
  if (origins.length === 0) findings.push("ORCHESTRATION_ALLOWED_ORIGINS is required in production.");
  for (const origin of origins) {
    if (origin === "*" || !validSecureOrigin(origin)) {
      findings.push("ORCHESTRATION_ALLOWED_ORIGINS must contain only explicit https origins.");
      break;
    }
  }
  return findings;
}

export function assertOrchestrationProductionConfiguration(env: NodeJS.ProcessEnv): void {
  const findings = orchestrationProductionConfigurationFindings(env);
  if (findings.length > 0) {
    throw new Error(`Unsafe production orchestration configuration: ${findings.join(" ")}`);
  }
}

function nonPlaceholder(value: string | undefined): boolean {
  const normalized = value?.trim() ?? "";
  return normalized.length >= 16 && !/(replace|example|changeme|your-|placeholder)/i.test(normalized);
}

function validSecureUrl(value: string | undefined): boolean {
  try {
    return new URL(value ?? "").protocol === "https:";
  } catch {
    return false;
  }
}

function validSecureOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && url.pathname === "/";
  } catch {
    return false;
  }
}
