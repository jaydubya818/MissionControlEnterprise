import { expect, test } from "@playwright/test";

const ROUTES: Array<{ path: string; heading?: string; text?: string | RegExp }> = [
  // The 17 approved Live identifiers: 15 primary destinations plus Mission
  // and Automation Run detail routes. Preview and Labs have separate gates.
  { path: "/v2/command-center", heading: "Command Center" },
  { path: "/v2/missions", heading: "Missions" },
  { path: "/v2/missions/mission-e2e", text: "Loading Mission…" },
  { path: "/v2/control-work-orders", heading: "Work Orders" },
  { path: "/v2/tasks", heading: "Tasks" },
  { path: "/v2/control-approvals", heading: "Decision Center" },
  { path: "/v2/projects", heading: "Factory Registry" },
  { path: "/v2/factory", heading: "From intent to verified change" },
  { path: "/v2/agents", heading: "Agent Registry" },
  { path: "/v2/model-routing", heading: "Execution Routing" },
  { path: "/v2/automations", heading: "Automations" },
  { path: "/v2/automation-runs/run-e2e", heading: "Automations" },
  { path: "/v2/atc", heading: "Air Traffic Control" },
  { path: "/v2/identity", heading: "Identity Directory" },
  { path: "/v2/deployments", heading: "Deployments" },
  { path: "/v2/trace-inspector", heading: "Observability & Evals" },
  { path: "/v2/audit", heading: "ARM Audit" },
];

test("v2 routes render in the software-factory shell", async ({ page }) => {
  for (const entry of ROUTES) {
    await test.step(entry.path, async () => {
      const pageErrors: string[] = [];
      const requestFailures: string[] = [];
      const onPageError = (error: Error) => pageErrors.push(error.message);
      const onRequestFailed = (request: { method(): string; url(): string; failure(): { errorText?: string } | null }) => {
        const errorText = request.failure()?.errorText;
        const url = request.url();
        if (errorText === "net::ERR_ABORTED") return;
        if (url.includes("/gateway/status")) return;
        requestFailures.push(`${request.method()} ${url} :: ${errorText}`);
      };

      page.on("pageerror", onPageError);
      page.on("requestfailed", onRequestFailed);

      try {
        await page.goto(entry.path);
        await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
        await expect(page.getByRole("main")).toHaveCount(1);
        if (entry.heading) {
          await expect(page.getByRole("heading", { name: entry.heading, exact: true }).first()).toBeVisible();
        }

        if (entry.text) {
          await expect(page.getByText(entry.text).first()).toBeVisible();
        }

        expect(pageErrors).toEqual([]);
        expect(requestFailures).toEqual([]);
      } finally {
        page.off("pageerror", onPageError);
        page.off("requestfailed", onRequestFailed);
      }
    });
  }
});

test("enterprise navigation exposes only the 15 primary Live destinations", async ({ page }) => {
  await page.goto("/v2/command-center");
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation).toBeVisible();

  for (const group of ["Operate", "Factory", "Control", "Observe"]) {
    const toggle = navigation.getByRole("button", { name: group, exact: true });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }

  await expect(navigation.locator("[data-nav-view]")).toHaveCount(15);
  await expect(navigation.getByRole("button", { name: /Command Center/ })).toBeVisible();
  await expect(navigation.getByRole("button", { name: /Missions/ })).toBeVisible();
  await expect(navigation.getByRole("button", { name: /Releases & Deployments/ })).toBeVisible();
  await expect(navigation.getByRole("button", { name: /Audit Trail/ })).toBeVisible();
  await expect(navigation.getByRole("button", { name: /Incidents & Telemetry/ })).toHaveCount(0);
  await expect(navigation.getByRole("button", { name: /Harnesses & Loops/ })).toHaveCount(0);
  await expect(navigation.getByRole("button", { name: /CRM/ })).toHaveCount(0);
});

test("Live operating surfaces expose no demo entry points", async ({ page }) => {
  for (const route of ["/v2/command-center", "/v2/control-work-orders"]) {
    await page.goto(route);
    await expect(page.getByText(/seed demo|run the demo/i)).toHaveCount(0);
    await expect(page.getByText("Demo data", { exact: true })).toHaveCount(0);
  }
});

test("consolidated, removed, Preview, Labs, and unknown deep links are handled explicitly", async ({ page }) => {
  const cases = [
    { source: "/v2/home?workspace=workspace-1", destination: "/v2/command-center", notice: /overview surface was consolidated/i },
    { source: "/v2/people", destination: "/v2/command-center", notice: /people route is not part/i },
    { source: "/v2/telemetry", destination: "/v2/command-center", notice: /telemetry route is Preview/i },
    { source: "/v2/effectiveness", destination: "/v2/command-center", notice: /effectiveness route is a Labs capability/i },
    { source: "/v2/not-enterprise", destination: "/v2/command-center", notice: /requested route is not available/i },
  ];

  for (const entry of cases) {
    await page.goto(entry.source);
    await expect(page).toHaveURL((url) => url.pathname === entry.destination);
    await expect(page.getByText(entry.notice).first()).toBeVisible();
  }
});
