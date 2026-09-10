import { expect, test } from "@playwright/test";

const PREVIEW_ROUTES = [
  "policies",
  "dag",
  "telemetry",
  "analytics",
  "factory-health",
  "harness-work-ledger",
  "code",
  "skills",
  "memory",
  "operator-evals",
  "harness-loops",
  "gateway",
  "harness-code-review-wizard",
  "harness-meta-loop",
] as const;

const LABS_ROUTES = [
  "council",
  "captures",
  "recorder",
  "test-generation",
  "api-import",
  "flaky-steps",
  "hybrid-workflows",
  "codegen",
  "gherkin",
  "effectiveness",
  "readiness",
  "friction",
  "agent-catalog",
  "recommendations",
  "harness-builder",
  "harness-workshop",
  "harness-software-factory",
  "harness-architect",
  "harness-patterns",
] as const;

test("all 14 Preview routes are admitted only with a truthful Preview label", async ({ page }) => {
  for (const route of PREVIEW_ROUTES) {
    await test.step(route, async () => {
      const pageErrors: string[] = [];
      const onPageError = (error: Error) => pageErrors.push(error.message);
      page.on("pageerror", onPageError);

      try {
        await page.goto(`/v2/${route}`);
        await expect(page).toHaveURL((url) => url.pathname === `/v2/${route}`);
        await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
        await expect(page.locator('[data-route-badge="preview"]')).toHaveText("Preview");
        await expect(page.getByRole("main")).toHaveCount(1);
        expect(pageErrors).toEqual([]);
      } finally {
        page.off("pageerror", onPageError);
      }
    });
  }
});

test("all 19 Labs routes are admitted only with a truthful Labs label", async ({ page }) => {
  for (const route of LABS_ROUTES) {
    await test.step(route, async () => {
      const pageErrors: string[] = [];
      const onPageError = (error: Error) => pageErrors.push(error.message);
      page.on("pageerror", onPageError);

      try {
        await page.goto(`/v2/${route}`);
        await expect(page).toHaveURL((url) => url.pathname === `/v2/${route}`);
        await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
        await expect(page.locator('[data-route-badge="labs"]')).toHaveText("Labs");
        await expect(page.getByRole("main")).toHaveCount(1);
        expect(pageErrors).toEqual([]);
      } finally {
        page.off("pageerror", onPageError);
      }
    });
  }
});

test("Preview and Labs remain secondary and collapsed from a Live destination", async ({ page }) => {
  await page.goto("/v2/command-center");
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation.getByRole("button", { name: "Preview", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  await expect(navigation.getByRole("button", { name: "Labs", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  await expect(navigation.locator('[data-nav-view="telemetry"]')).toHaveCount(0);
  await expect(navigation.locator('[data-nav-view="effectiveness"]')).toHaveCount(0);
});
