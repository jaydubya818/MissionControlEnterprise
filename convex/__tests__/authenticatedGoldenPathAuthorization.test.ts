import { afterEach, describe, expect, it } from "vitest";
import { getScoped, updateDraft } from "../missions";
import {
  approvalQueue,
  decideApprovalDecision,
  get as getWorkOrder,
  governanceValidity,
  recordVerificationReceipt,
  setAuthorizedModelOverride,
} from "../workOrders";
import { getWithTimeline, update as updateTask } from "../tasks";
import { decideCandidate, getAttemptReviewContext } from "../reviewIntelligence";
import { approveStagingDeployment, getDetail as getRelease } from "../factory/releases";
import { approve as approveLegacy, get as getLegacyApproval } from "../approvals";
import { listCompanyMemberships } from "../lib/companyAccess";
import { requireAuthorizedDeliveryScope } from "../lib/deliveryAuthorization";
import { twoCompanyAuthorizationFixture } from "./fixtures/twoCompanyAuthorization";

function handlerOf<T>(registered: unknown): T {
  return (registered as { _handler: T })._handler;
}

const originalDemoFlag = process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;

afterEach(() => {
  if (originalDemoFlag === undefined) delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
  else process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT = originalDemoFlag;
});

describe("authenticated two-company canonical golden path", () => {
  it.each([
    ["clerk-user-a", "company-a", "company-b"],
    ["clerk-user-b", "company-b", "company-a"],
  ] as const)("resolves exact subject %s only to %s", async (subject, allowed, denied) => {
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    const fixture = twoCompanyAuthorizationFixture(subject);
    const memberships = await listCompanyMemberships(fixture.ctx);
    expect(memberships.map((membership) => String(membership.tenant._id))).toEqual([allowed]);
    await expect(requireAuthorizedDeliveryScope(fixture.ctx, `workspace-${allowed.at(-1)}` as any)).resolves.toBeTruthy();
    await expect(requireAuthorizedDeliveryScope(fixture.ctx, `workspace-${denied.at(-1)}` as any)).rejects.toThrow(
      "unavailable or unauthorized",
    );
  });

  it.each([
    ["clerk-user-a", "a"],
    ["clerk-user-b", "b"],
  ] as const)("allows %s to read every canonical object in Company %s", async (subject, target) => {
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    const fixture = twoCompanyAuthorizationFixture(subject);
    const ids = target === "a" ? fixture.companyA : fixture.companyB;
    const probes = [
      handlerOf<any>(getScoped)(fixture.ctx, { missionId: ids.missionId, projectId: ids.projectId }),
      handlerOf<any>(getWorkOrder)(fixture.ctx, { workOrderId: ids.workOrderId }),
      handlerOf<any>(getWithTimeline)(fixture.ctx, { taskId: ids.taskId }),
      handlerOf<any>(getAttemptReviewContext)(fixture.ctx, { workOrderId: ids.workOrderId, workflowRunId: ids.attemptId }),
      handlerOf<any>(governanceValidity)(fixture.ctx, { workOrderId: ids.workOrderId }),
      handlerOf<any>(approvalQueue)(fixture.ctx, { projectId: ids.projectId, limit: 10 }),
      handlerOf<any>(getLegacyApproval)(fixture.ctx, { approvalId: ids.legacyApprovalId }),
      handlerOf<any>(getRelease)(fixture.ctx, { releaseId: ids.releaseId }),
    ];
    for (const probe of probes) await expect(probe).resolves.toBeDefined();
    expect(fixture.writes).toEqual([]);
  });

  it.each([
    ["clerk-user-a", "b"],
    ["clerk-user-b", "a"],
  ] as const)("denies %s every canonical read in Company %s", async (subject, target) => {
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    const fixture = twoCompanyAuthorizationFixture(subject);
    const ids = target === "a" ? fixture.companyA : fixture.companyB;
    const probes = [
      handlerOf<any>(getScoped)(fixture.ctx, { missionId: ids.missionId, projectId: ids.projectId }),
      handlerOf<any>(getWorkOrder)(fixture.ctx, { workOrderId: ids.workOrderId }),
      handlerOf<any>(getWithTimeline)(fixture.ctx, { taskId: ids.taskId }),
      handlerOf<any>(getAttemptReviewContext)(fixture.ctx, { workOrderId: ids.workOrderId, workflowRunId: ids.attemptId }),
      handlerOf<any>(governanceValidity)(fixture.ctx, { workOrderId: ids.workOrderId }),
      handlerOf<any>(approvalQueue)(fixture.ctx, { projectId: ids.projectId, limit: 10 }),
      handlerOf<any>(getLegacyApproval)(fixture.ctx, { approvalId: ids.legacyApprovalId }),
      handlerOf<any>(getRelease)(fixture.ctx, { releaseId: ids.releaseId }),
    ];
    for (const probe of probes) {
      await expect(probe).rejects.toThrow(/unavailable|unauthorized/);
    }
    expect(fixture.writes).toEqual([]);
  });

  it.each([
    ["clerk-user-a", "b"],
    ["clerk-user-b", "a"],
  ] as const)("denies %s every canonical mutation in Company %s", async (subject, target) => {
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    const fixture = twoCompanyAuthorizationFixture(subject);
    const ids = target === "a" ? fixture.companyA : fixture.companyB;
    const probes = [
      handlerOf<any>(updateDraft)(fixture.ctx, {
        missionId: ids.missionId, projectId: ids.projectId, idempotencyKey: "cross-company-mission",
        title: "Denied", objective: "Denied", stopCondition: "Denied",
      }),
      handlerOf<any>(setAuthorizedModelOverride)(fixture.ctx, {
        workOrderId: ids.workOrderId, modelId: "denied", reason: "Cross-company denial probe",
      }),
      handlerOf<any>(updateTask)(fixture.ctx, { taskId: ids.taskId, title: "Denied" }),
      handlerOf<any>(decideCandidate)(fixture.ctx, {
        decisionCandidateId: ids.candidateId, status: "REJECTED", reason: "Denied",
      }),
      handlerOf<any>(recordVerificationReceipt)(fixture.ctx, {
        workOrderId: ids.workOrderId, workflowRunId: ids.attemptId,
        acceptanceCriterionId: "criterion-1", status: "PASSED",
      }),
      handlerOf<any>(decideApprovalDecision)(fixture.ctx, {
        approvalDecisionId: ids.approvalDecisionId, decision: "APPROVE", reason: "Denied",
      }),
      handlerOf<any>(approveLegacy)(fixture.ctx, {
        approvalId: ids.legacyApprovalId, decidedByUserId: subject, reason: "Denied",
      }),
      handlerOf<any>(approveStagingDeployment)(fixture.ctx, {
        releaseId: ids.releaseId, expectedMergeCommitSha: target.repeat(40), rationale: "Denied cross-company approval",
      }),
    ];
    for (const probe of probes) {
      await expect(probe).rejects.toThrow(/unavailable|unauthorized/);
    }
    expect(fixture.writes).toEqual([]);
  });
});
