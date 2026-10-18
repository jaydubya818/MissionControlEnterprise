import { expect, test, type Page } from "@playwright/test";

async function expectShellLoaded(page: Page) {
  await page.goto("/v2/home");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
}

test("retained operator routes resolve in Mission Control shell", async ({ page }) => {
  await expectShellLoaded(page);

  await page.goto("/v2/agents");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Agent Fleet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Agent Fleet" })).toBeVisible();

  await page.goto("/v2/model-routing");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Routing Decisions")).toBeVisible();
  await expect(page.getByRole("button", { name: "Routing Decisions" })).toBeVisible();
});
