const REQUIRED_SECRETS = [
  "CONVEX_SERVICE_AUTH_TOKEN",
  "MISSION_CONTROL_SERVICE_COMMAND_SECRET",
];

export function evaluateProductionConfiguration(env) {
  const findings = [];
  requireExact(env, "NODE_ENV", "production", findings);
  requireExact(env, "VITE_AUTH_MODE", "clerk", findings);
  requireValue(env, "VITE_CLERK_PUBLISHABLE_KEY", findings, { minimum: 12 });
  requireSecureUrl(env, "VITE_CONVEX_URL", findings);
  requireSecureUrl(env, "CONVEX_URL", findings);
  requireSecureUrl(env, "CLERK_JWT_ISSUER_DOMAIN", findings);
  requireSecureUrl(env, "VITE_ORCHESTRATION_URL", findings);
  requireValue(env, "CONVEX_SERVICE_AUTH_TOKEN", findings);
  if (!usable(env.ORCHESTRATION_API_TOKEN) && !usable(env.MC_API_TOKEN)) {
    findings.push(finding("ORCHESTRATION_API_TOKEN|MC_API_TOKEN", "MISSING", "A production inbound orchestration credential is required."));
  }
  requireValue(env, "MISSION_CONTROL_SERVICE_ID", findings, { minimum: 3 });
  requireValue(env, "MISSION_CONTROL_SERVICE_COMMAND_SECRET", findings);

  if (truthy(env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT)) {
    findings.push(finding("MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT", "UNSAFE", "Anonymous company context must be disabled in production."));
  }

  const origins = commaList(env.ORCHESTRATION_ALLOWED_ORIGINS);
  if (origins.length === 0) {
    findings.push(finding("ORCHESTRATION_ALLOWED_ORIGINS", "MISSING", "At least one exact production UI origin is required."));
  } else if (origins.some((origin) => origin === "*" || !isSecureOrigin(origin))) {
    findings.push(finding("ORCHESTRATION_ALLOWED_ORIGINS", "UNSAFE", "Only exact HTTPS origins are allowed; wildcard, HTTP, paths, queries, and fragments are rejected."));
  }

  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith("VITE_") || !usable(value)) continue;
    if (/(SECRET|TOKEN|PRIVATE_KEY|DEPLOY_KEY|PASSWORD)/i.test(name)) {
      findings.push(finding(name, "UNSAFE", "Server credentials must not use a VITE_ client-bundle variable."));
    }
  }

  if (env.CODEX_FACTORY_WORKER_ENABLED === "true") {
    for (const name of [
      "CODEX_WORKER_PROJECT_ID",
      "CODEX_WORKER_REPOSITORY_ID",
      "CODEX_WORKER_CHECKOUT_ROOT",
      "CODEX_WORKER_HOST_ID",
      "CODEX_WORKER_APPROVED_MODEL_IDS",
    ]) requireValue(env, name, findings, { minimum: 2 });
    requirePositiveInteger(env, "CODEX_WORKER_MAX_CONCURRENT_RUNS", findings);
    requireExact(env, "CODEX_WORKER_NETWORK_POLICY_STATUS", "PASS", findings);
    requireExact(env, "CODEX_WORKER_SECRET_POLICY_STATUS", "PASS", findings);
  }

  for (const name of REQUIRED_SECRETS) {
    if (usable(env[name]) && looksPlaceholder(env[name])) {
      findings.push(finding(name, "INVALID", "The configured value is a documented placeholder, not a usable credential."));
    }
  }

  return {
    ok: findings.length === 0,
    status: findings.length === 0 ? "PASS" : "BLOCKED",
    findings,
    checkedFields: 14,
  };
}

function requireExact(env, name, expected, findings) {
  if (env[name] !== expected) findings.push(finding(name, usable(env[name]) ? "INVALID" : "MISSING", `Must equal ${expected}.`));
}

function requireValue(env, name, findings, { minimum = 16 } = {}) {
  if (!usable(env[name])) findings.push(finding(name, "MISSING", "A production value is required."));
  else if (String(env[name]).trim().length < minimum || looksPlaceholder(env[name])) {
    findings.push(finding(name, "INVALID", "The value is too short or is a documented placeholder."));
  }
}

function requireSecureUrl(env, name, findings) {
  if (!usable(env[name])) {
    findings.push(finding(name, "MISSING", "An HTTPS production URL is required."));
    return;
  }
  try {
    const url = new URL(String(env[name]));
    if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("unsafe");
  } catch {
    findings.push(finding(name, "INVALID", "Must be a non-local HTTPS URL."));
  }
}

function requirePositiveInteger(env, name, findings) {
  const value = Number(env[name]);
  if (!Number.isInteger(value) || value < 1) findings.push(finding(name, "INVALID", "Must be a positive integer."));
}

function finding(field, state, message) {
  return { field, state, message };
}

function usable(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function looksPlaceholder(value) {
  return /(replace|example|changeme|your-|placeholder)/i.test(String(value));
}

function truthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

function commaList(value) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function isSecureOrigin(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.origin === value
      && url.pathname === "/"
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
}
