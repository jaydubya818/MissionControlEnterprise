import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { resolveAuthenticatedGoldenPathConfig } from "../../scripts/lib/authenticated-golden-path-config.mjs";

const configuration = resolveAuthenticatedGoldenPathConfig();

type ConvexCallKind = "query" | "mutation";

async function convexCall(page: Page, kind: ConvexCallKind, path: string, args: Record<string, unknown>) {
  const token = await page.evaluate(async () => {
    const clerk = (window as Window & {
      Clerk?: { session?: { getToken: (options?: { skipCache?: boolean }) => Promise<string | null> } };
    }).Clerk;
    return await clerk?.session?.getToken({ skipCache: true }) ?? null;
  });
  expect(token, "Clerk did not provide the active session token to the browser").toBeTruthy();
  const response = await fetch(`${process.env.MC_AUTH_GOLDEN_PATH_CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const result = await response.json().catch(() => ({ status: "invalid-response" }));
  return { httpOk: response.ok, result };
}

async function assertServerAuthorization(page: Page, own: any, foreign: any) {
  const ownedReads = [
    ["missions:getScoped", { missionId: own.missionId, projectId: own.workspaceId }, own.missionId],
    ["workOrders:get", { workOrderId: own.workOrderId }, own.workOrderId],
    ["tasks:getWithTimeline", { taskId: own.taskId }, own.taskId],
    ["reviewIntelligence:getAttemptReviewContext", { workOrderId: own.workOrderId, workflowRunId: own.attemptId }, own.attemptId],
    ["workOrders:governanceValidity", { workOrderId: own.workOrderId }, own.verificationPlanId],
    ["workOrders:approvalQueue", { projectId: own.workspaceId, limit: 10 }, own.approvalId],
    ["factory/releases:getDetail", { releaseId: own.releaseId }, own.releaseId],
  ] as const;
  for (const [path, args, marker] of ownedReads) {
    const response = await convexCall(page, "query", path, args);
    expect(response.httpOk, `${path} rejected the owning company`).toBe(true);
    expect(response.result.status, `${path} did not return a Convex success`).toBe("success");
    expect(JSON.stringify(response.result.value), `${path} omitted ${marker}`).toContain(marker);
  }

  const deniedReads = [
    ["missions:getScoped", { missionId: foreign.missionId, projectId: foreign.workspaceId }],
    ["workOrders:get", { workOrderId: foreign.workOrderId }],
    ["tasks:getWithTimeline", { taskId: foreign.taskId }],
    ["reviewIntelligence:getAttemptReviewContext", { workOrderId: foreign.workOrderId, workflowRunId: foreign.attemptId }],
    ["workOrders:governanceValidity", { workOrderId: foreign.workOrderId }],
    ["workOrders:approvalQueue", { projectId: foreign.workspaceId, limit: 10 }],
    ["factory/releases:getDetail", { releaseId: foreign.releaseId }],
  ] as const;
  for (const [path, args] of deniedReads) {
    const response = await convexCall(page, "query", path, args);
    expect(response.result.status, `${path} exposed a foreign-company object`).not.toBe("success");
  }

  const deniedMutations = [
    ["missions:updateDraft", { missionId: foreign.missionId, projectId: foreign.workspaceId, title: "Denied cross-company probe", idempotencyKey: `auth-denial:${own.subjectId}:mission` }],
    ["workOrders:setAuthorizedModelOverride", { workOrderId: foreign.workOrderId, modelId: "denied", reason: "Cross-company denial probe" }],
    ["tasks:update", { taskId: foreign.taskId, title: "Denied cross-company probe" }],
    ["reviewIntelligence:decideCandidate", { decisionCandidateId: foreign.candidateId, status: "REJECTED", reason: "Cross-company denial probe" }],
    ["workOrders:recordVerificationReceipt", { workOrderId: foreign.workOrderId, workflowRunId: foreign.attemptId, acceptanceCriterionId: "cross-company-denial", status: "PASSED" }],
    ["workOrders:decideApprovalDecision", { approvalDecisionId: foreign.approvalId, decision: "APPROVE", reason: "Cross-company denial probe" }],
    ["factory/releases:approveStagingDeployment", { releaseId: foreign.releaseId, expectedMergeCommitSha: foreign.candidateSha, rationale: "Cross-company denial probe" }],
  ] as const;
  for (const [path, args] of deniedMutations) {
    const response = await convexCall(page, "mutation", path, args);
    expect(response.result.status, `${path} mutated a foreign-company object`).not.toBe("success");
  }
}

async function authenticatedContext(browser: Browser, storageState: string): Promise<BrowserContext> {
  return await browser.newContext({ storageState, recordVideo: undefined });
}

async function assertOwnedLineage(page: Page, lineage: any) {
  await page.goto(`/v2/missions/${lineage.missionId}?workspace=${lineage.workspaceId}`);
  await expect.poll(async () => await page.evaluate(() => {
    const clerk = (window as Window & { Clerk?: { user?: { id?: string } } }).Clerk;
    return clerk?.user?.id ?? null;
  })).toBe(lineage.subjectId);
  await expect(page.getByRole("heading", { name: lineage.missionTitle, exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Execution", exact: true }).click();
  await expect(page.getByText(lineage.attemptId, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(lineage.candidateSha, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(lineage.verificationSubjectDigest, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(lineage.verificationPlanId, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Server-derived independence passed", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Execution", exact: true }).click();
  await expect(page.getByText(lineage.attemptId, { exact: true }).first()).toBeVisible();

  await page.goto(`/v2/control-work-orders?project=${lineage.projectSlug}&workspace=${lineage.workspaceId}&workOrder=${lineage.workOrderId}`);
  await expect(page.getByText(lineage.workOrderId, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(lineage.attemptId, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Ready for explicit acceptance.", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept WorkOrder", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Accept WorkOrder", exact: true }).click();
  await expect(page.getByRole("button", { name: "Accept WorkOrder", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "Accept WorkOrder", exact: true })).toBeDisabled();
}

async function assertDeniedLineage(page: Page, lineage: any) {
  await page.goto(`/v2/missions/${lineage.missionId}?workspace=${lineage.workspaceId}`);
  await expect(page.getByRole("heading", { name: lineage.missionTitle, exact: true })).toHaveCount(0);
  await expect(page.getByText(lineage.attemptId, { exact: true })).toHaveCount(0);
  await expect(page.getByText(lineage.candidateSha, { exact: true })).toHaveCount(0);
  await page.goto(`/v2/control-work-orders?project=${lineage.projectSlug}&workspace=${lineage.workspaceId}&workOrder=${lineage.workOrderId}`);
  await expect(page.getByText(lineage.workOrderId, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Accept WorkOrder", exact: true })).toHaveCount(0);
}

test.describe("real Clerk authenticated two-company golden path", () => {
  test.skip(!configuration.ready, configuration.classification);

  test("each operator completes its own persisted lineage and neither can read the other company", async ({ browser }) => {
    const manifest = configuration.manifest!;
    const userA = await authenticatedContext(
      browser,
      process.env.MC_AUTH_GOLDEN_PATH_USER_A_STORAGE_STATE!,
    );
    const userB = await authenticatedContext(
      browser,
      process.env.MC_AUTH_GOLDEN_PATH_USER_B_STORAGE_STATE!,
    );
    try {
      const pageA = await userA.newPage();
      await assertOwnedLineage(pageA, manifest.companyA);
      await assertServerAuthorization(pageA, manifest.companyA, manifest.companyB);
      await assertDeniedLineage(pageA, manifest.companyB);

      const pageB = await userB.newPage();
      await assertOwnedLineage(pageB, manifest.companyB);
      await assertServerAuthorization(pageB, manifest.companyB, manifest.companyA);
      await assertDeniedLineage(pageB, manifest.companyA);
    } finally {
      await Promise.all([userA.close(), userB.close()]);
    }
  });
});
