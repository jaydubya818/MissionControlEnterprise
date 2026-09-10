import { describe, expect, it } from "vitest";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { kpiSummary } from "../analytics";
import { activate } from "../automations";
import { list as listCaptures } from "../captures";
import { authedMutation } from "../lib/authedFunctions";
import { getDependencyGraph } from "../coordinator";
import { defaultRules } from "../context/changeRisk";
import { gatherEvidence } from "../factory/codeReviewWizard";
import { workLedger } from "../factory/health";
import { get as getGatewayConnection } from "../gatewayConnection";
import { explainTaskPolicy } from "../policy";
import { generateIncidentReport } from "../reports";
import { getStats as getReviewStats, listByTask as listReviewsByTask } from "../reviews";
import {
  createPolicyEnvelope,
  evaluate,
  listPolicyEnvelopes,
} from "../governance/policyEnvelopes";
import { listApprovals } from "../governance/approvalRecords";
import { getChangeRecord, listChangeRecords } from "../governance/changeRecords";
import {
  listDeployments,
  listLatestShadowGates,
  listShadowGateHistory,
  listShadowGates,
} from "../governance/deployments";
import { getOpEventStats, listOpEvents } from "../operations/opEvents";
import { createTemplate, listTemplates, getTemplate } from "../registry/agentTemplates";
import { createVersion, getVersion, listVersions } from "../registry/agentVersions";
import { listEnvironments } from "../registry/environments";
import { listTenants } from "../registry/tenants";
import { listByUser as listWatchSubscriptionsByUser } from "../watchSubscriptions";
import { getExecutionManifest } from "../skillAutomations";
import {
  get as getWorkflowRun,
  listArtifacts as listWorkflowRunArtifacts,
  listEvents as listWorkflowRunEvents,
} from "../workflowRuns";
import { get as getWorkflow, list as listWorkflows } from "../workflows";

const legacyScopedWrite = authedMutation({
  args: { projectId: v.id("projects") },
  handler: async (_ctx, args) => ({ projectId: args.projectId }),
});

const legacyGlobalWrite = authedMutation({
  args: { value: v.string() },
  handler: async (_ctx, args) => args.value,
});

function functionHandler<T extends (...args: any[]) => any>(registered: unknown): T {
  return (registered as { _handler: T })._handler;
}

function createContext({
  identity = { subject: "user-a", tokenIdentifier: "issuer|user-a" },
  permissions = ["factory.read", "factory.automation.manage"],
  assignmentScope = "project",
}: {
  identity?: { subject: string; tokenIdentifier: string } | null;
  permissions?: string[];
  assignmentScope?: "project" | "tenant";
} = {}) {
  const tenantId = "tenant-a" as Id<"tenants">;
  const otherTenantId = "tenant-b" as Id<"tenants">;
  const projectId = "project-a" as Id<"projects">;
  const otherProjectId = "project-b" as Id<"projects">;
  const operatorId = "operator-a" as Id<"operators">;
  const memberId = "member-a" as Id<"orgMembers">;
  const roleId = "role-a" as Id<"roles">;
  const definitionId = "automation-a" as Id<"automationDefinitions">;
  const tables: Record<string, any[]> = {
    tenants: [
      { _id: tenantId, active: true, name: "A", slug: "a" },
      { _id: otherTenantId, active: true, name: "B", slug: "b" },
    ],
    projects: [
      { _id: projectId, tenantId, name: "A", slug: "a" },
      { _id: otherProjectId, tenantId: otherTenantId, name: "B", slug: "b" },
    ],
    operators: [{ _id: operatorId, tenantId, authId: "user-a", active: true }],
    roles: [{ _id: roleId, tenantId, name: "Factory member", permissions }],
    roleAssignments: [{
      _id: "assignment-a",
      operatorId,
      roleId,
      scope: assignmentScope === "tenant"
        ? { type: "tenant", id: tenantId }
        : { type: "project", id: projectId },
    }],
    teamMemberships: [],
    orgMembers: [{
      _id: memberId,
      operatorId,
      tenantId,
      active: true,
      projectAccess: [{ projectId }],
    }],
    runs: [],
    tasks: [
      {
        _id: "task-a",
        _creationTime: 1,
        projectId,
        title: "Task A",
        status: "READY",
        type: "CODE",
        priority: 1,
      },
      {
        _id: "task-b",
        _creationTime: 1,
        projectId: otherProjectId,
        title: "Task B",
        status: "READY",
        type: "CODE",
        priority: 1,
      },
    ],
    agents: [],
    reviews: [
      { _id: "review-a", projectId, taskId: "task-a", type: "PRAISE", status: "PENDING", score: 5 },
      { _id: "review-b", projectId: otherProjectId, taskId: "task-b", type: "REFUTE", status: "PENDING" },
    ],
    watchSubscriptions: [
      { _id: "watch-a", userId: "operator", projectId, entityType: "TASK", entityId: "task-a", createdAt: 2 },
      { _id: "watch-b", userId: "operator", projectId: otherProjectId, entityType: "TASK", entityId: "task-b", createdAt: 1 },
    ],
    taskTransitions: [],
    messages: [],
    approvals: [],
    policies: [],
    toolCalls: [],
    taskDependencies: [],
    opEvents: [],
    policyEnvelopes: [],
    harnessPrChecks: [],
    qcRuns: [],
    qcFindings: [],
    gatewayConnection: [],
    agentTemplates: [
      { _id: "template-a", tenantId, projectId, name: "A", slug: "a", active: true, updatedAt: 1 },
      { _id: "template-b", tenantId: otherTenantId, projectId: otherProjectId, name: "B", slug: "b", active: true, updatedAt: 1 },
    ],
    agentVersions: [
      { _id: "version-a", tenantId, projectId, templateId: "template-a", version: 1 },
      { _id: "version-b", tenantId: otherTenantId, projectId: otherProjectId, templateId: "template-b", version: 1 },
    ],
    automationDefinitions: [{
      _id: definitionId,
      projectId,
      status: "ACTIVE",
      isMutating: false,
      autonomyLevel: "LEVEL_1",
      definitionVersion: 1,
      reviewStatus: "APPROVED",
      validationStatus: "PASSED",
      artifactId: "artifact-definition-a",
      adapterType: "TYPESCRIPT",
      maxDurationSeconds: 30,
    }],
    automationDecisions: [],
    automationArtifacts: [{
      _id: "artifact-definition-a",
      validationStatus: "PASSED",
      repository: "sellerfi/enterprise",
      workingDirectory: ".",
      path: "automations/check.ts",
      content: "export default async function check() { return true; }",
      contentHash: "artifact-hash-a",
      manifest: { mode: "read-only" },
    }],
    automationEvaluations: [{
      _id: "evaluation-a",
      workOrderId: "work-order-a",
      correlationId: "correlation-a",
    }],
    workOrders: [
      {
        _id: "work-order-a",
        tenantId,
        projectId,
        ownerMemberId: memberId,
        currentExecutionRunId: "workflow-run-a",
        metadata: { automationDefinitionId: definitionId },
        acceptanceCriteria: [],
      },
      {
        _id: "work-order-b",
        tenantId: otherTenantId,
        projectId: otherProjectId,
        acceptanceCriteria: [],
      },
    ],
    workflowRuns: [
      {
        _id: "workflow-run-a",
        tenantId,
        projectId,
        workOrderId: "work-order-a",
        runId: "run-a",
        workflowId: "global-flow",
        status: "PENDING",
        currentStepIndex: 0,
        totalSteps: 0,
        steps: [],
        context: {},
        initialInput: "authorized input",
        executionClaimId: "claim-a",
        executionClaimedBy: "service-a",
        executionLeaseExpiresAt: Date.now() + 60_000,
      },
      {
        _id: "workflow-run-b",
        tenantId: otherTenantId,
        projectId: otherProjectId,
        workOrderId: "work-order-b",
        runId: "run-b",
        workflowId: "scoped-b",
        status: "PENDING",
        currentStepIndex: 0,
        totalSteps: 0,
        steps: [],
        context: {},
        initialInput: "other company input",
      },
    ],
    runEvents: [
      { _id: "event-a", workflowRunId: "workflow-run-a", eventType: "RUN_STARTED", sequenceNumber: 1 },
      { _id: "event-b", workflowRunId: "workflow-run-b", eventType: "RUN_STARTED", sequenceNumber: 1 },
    ],
    runArtifacts: [
      { _id: "run-artifact-a", workflowRunId: "workflow-run-a", artifactType: "REPORT", name: "A", createdAt: 1 },
      { _id: "run-artifact-b", workflowRunId: "workflow-run-b", artifactType: "REPORT", name: "B", createdAt: 1 },
    ],
    captures: [
      { _id: "capture-a", projectId, title: "A", type: "SCREENSHOT" },
      { _id: "capture-b", projectId: otherProjectId, title: "B", type: "SCREENSHOT" },
    ],
    workflows: [
      { _id: "workflow-global", workflowId: "global-flow", active: true, name: "Global" },
      { _id: "workflow-a", workflowId: "scoped-a", projectId, active: true, name: "A" },
      { _id: "workflow-b", workflowId: "scoped-b", projectId: otherProjectId, active: true, name: "B" },
    ],
    environments: [
      { _id: "environment-a", tenantId, name: "Production A", type: "prod" },
      { _id: "environment-b", tenantId: otherTenantId, name: "Production B", type: "prod" },
    ],
    deployments: [
      {
        _id: "deployment-a",
        tenantId,
        templateId: "template-a",
        environmentId: "environment-a",
        targetVersionId: "version-a",
        status: "ACTIVE",
        createdAt: 1,
      },
      {
        _id: "deployment-b",
        tenantId: otherTenantId,
        templateId: "template-b",
        environmentId: "environment-b",
        targetVersionId: "version-b",
        status: "ACTIVE",
        createdAt: 1,
      },
    ],
    releaseGateEvaluations: [
      { _id: "gate-a", deploymentId: "deployment-a", status: "PASS", createdAt: 1 },
      { _id: "gate-b", deploymentId: "deployment-b", status: "PASS", createdAt: 1 },
    ],
    approvalRecords: [
      { _id: "approval-a", tenantId, projectId, status: "PENDING", requestedAt: 1 },
      { _id: "approval-b", tenantId: otherTenantId, projectId: otherProjectId, status: "PENDING", requestedAt: 1 },
    ],
    changeRecords: [
      { _id: "change-a", tenantId, projectId, type: "TEST", summary: "A", timestamp: 1 },
      { _id: "change-b", tenantId: otherTenantId, projectId: otherProjectId, type: "TEST", summary: "B", timestamp: 1 },
    ],
  };
  const allRows = () => Object.values(tables).flat();
  const db = {
    get: async (id: string) => allRows().find((row) => row._id === id) ?? null,
    patch: async (id: string, value: Record<string, unknown>) => {
      const row = allRows().find((candidate) => candidate._id === id);
      if (!row) throw new Error("missing row");
      Object.assign(row, value);
    },
    insert: async (table: string, value: Record<string, unknown>) => {
      const id = `${table}-${(tables[table] ?? []).length + 1}`;
      (tables[table] ??= []).push({ _id: id, _creationTime: Date.now(), ...value });
      return id;
    },
    query: (table: string) => {
      let rows = [...(tables[table] ?? [])];
      const builder: any = {
        withIndex: (_name: string, apply?: (q: any) => unknown) => {
          const conditions: Array<[string, unknown]> = [];
          const q: any = {
            eq: (field: string, value: unknown) => {
              conditions.push([field, value]);
              return q;
            },
          };
          apply?.(q);
          rows = rows.filter((row) => conditions.every(([field, value]) => row[field] === value));
          return builder;
        },
        collect: async () => [...rows],
        first: async () => rows[0] ?? null,
        take: async (limit: number) => rows.slice(0, limit),
        order: () => builder,
      };
      return builder;
    },
  };

  return {
    ctx: { auth: { getUserIdentity: async () => identity }, db } as any,
    projectId,
    otherProjectId,
    tenantId,
    otherTenantId,
    definitionId,
  };
}

describe("authorization remediation", () => {
  it("denies an unauthenticated analytics caller", async () => {
    const { ctx, projectId } = createContext({ identity: null });
    await expect(functionHandler(kpiSummary)(ctx, { projectId, periodDays: 7 }))
      .rejects.toThrow("unavailable or unauthorized");
  });

  it("denies a caller assigned to a different workspace", async () => {
    const { ctx, otherProjectId } = createContext();
    await expect(functionHandler(kpiSummary)(ctx, { projectId: otherProjectId, periodDays: 7 }))
      .rejects.toThrow(/Company account|Workspace is unavailable or unauthorized/);
  });

  it("fails safely for an invalid workspace resource", async () => {
    const { ctx } = createContext();
    await expect(functionHandler(kpiSummary)(ctx, {
      projectId: "missing-project" as Id<"projects">,
      periodDays: 7,
    })).rejects.toThrow("Workspace is unavailable or unauthorized");
  });

  it("allows an authorized workspace viewer", async () => {
    const { ctx, projectId, definitionId } = createContext({ permissions: ["factory.read"] });
    await expect(functionHandler(kpiSummary)(ctx, { projectId, periodDays: 7 }))
      .resolves.toMatchObject({
        runs: { value: 0 },
        tasksCompleted: { value: 0 },
        costUsd: { value: 0 },
        policyDenials: { value: 0 },
      });
  });

  it("denies an insufficient role before an automation lifecycle write", async () => {
    const { ctx, projectId, definitionId } = createContext({ permissions: ["factory.read"] });
    await expect(functionHandler(activate)(ctx, {
      projectId,
      automationDefinitionId: definitionId,
      actorId: "spoofed-client",
      reason: "test",
    })).rejects.toThrow("does not permit");
  });

  it("denies unauthenticated legacy writes before their handler", async () => {
    const { ctx, projectId } = createContext({ identity: null });
    await expect(functionHandler(legacyScopedWrite)(ctx, { projectId }))
      .rejects.toThrow("unavailable or unauthorized");
  });

  it("derives workspace authority for legacy writes", async () => {
    const { ctx, projectId, otherProjectId } = createContext({ permissions: ["factory.improve"] });
    await expect(functionHandler(legacyScopedWrite)(ctx, { projectId })).resolves.toEqual({ projectId });
    await expect(functionHandler(legacyScopedWrite)(ctx, { projectId: otherProjectId }))
      .rejects.toThrow(/Company account|Workspace is unavailable or unauthorized/);
  });

  it("reserves unscoped global writes for company administrators", async () => {
    const member = createContext({ permissions: ["factory.improve"] });
    await expect(functionHandler(legacyGlobalWrite)(member.ctx, { value: "x" }))
      .rejects.toThrow("company administrator");

    const administrator = createContext({
      permissions: ["settings.manage"],
      assignmentScope: "tenant",
    });
    await expect(functionHandler(legacyGlobalWrite)(administrator.ctx, { value: "x" }))
      .resolves.toBe("x");
  });

  it("denies unauthenticated callers across every remediated Preview read", async () => {
    const { ctx, projectId } = createContext({ identity: null });
    const calls = [
      () => functionHandler(listTenants)(ctx, { activeOnly: false }),
      () => functionHandler(getTemplate)(ctx, { templateId: "template-a" }),
      () => functionHandler(listTemplates)(ctx, { projectId }),
      () => functionHandler(getVersion)(ctx, { versionId: "version-a" }),
      () => functionHandler(listVersions)(ctx, { templateId: "template-a" }),
      () => functionHandler(listPolicyEnvelopes)(ctx, { projectId }),
      () => functionHandler(evaluate)(ctx, { projectId, riskLevel: "GREEN" }),
      () => functionHandler(getDependencyGraph)(ctx, { projectId }),
      () => functionHandler(listOpEvents)(ctx, { projectId }),
      () => functionHandler(getOpEventStats)(ctx, { projectId }),
      () => functionHandler(workLedger)(ctx, { projectId }),
      () => functionHandler(getGatewayConnection)(ctx, {}),
      () => functionHandler(defaultRules)(ctx, {}),
      () => functionHandler(gatherEvidence)(ctx, { projectId }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Authentication|required|unavailable|unauthorized/);
    }
  });

  it("denies cross-company Preview reads without exposing the target", async () => {
    const { ctx, otherProjectId } = createContext({ permissions: ["factory.read"] });
    const calls = [
      () => functionHandler(listTemplates)(ctx, { projectId: otherProjectId }),
      () => functionHandler(listVersions)(ctx, { templateId: "template-b" }),
      () => functionHandler(listPolicyEnvelopes)(ctx, { projectId: otherProjectId }),
      () => functionHandler(evaluate)(ctx, { projectId: otherProjectId, riskLevel: "GREEN" }),
      () => functionHandler(getDependencyGraph)(ctx, { projectId: otherProjectId }),
      () => functionHandler(listOpEvents)(ctx, { projectId: otherProjectId }),
      () => functionHandler(getOpEventStats)(ctx, { projectId: otherProjectId }),
      () => functionHandler(workLedger)(ctx, { projectId: otherProjectId }),
      () => functionHandler(gatherEvidence)(ctx, { projectId: otherProjectId }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/unavailable|unauthorized/);
    }
  });

  it("serves each remediated Preview read inside an authorized workspace", async () => {
    const { ctx, projectId, tenantId } = createContext({ permissions: ["factory.read"] });

    await expect(functionHandler(listTenants)(ctx, { activeOnly: false }))
      .resolves.toEqual([expect.objectContaining({ _id: tenantId })]);
    await expect(functionHandler(getTemplate)(ctx, { templateId: "template-a" }))
      .resolves.toMatchObject({ projectId });
    await expect(functionHandler(listTemplates)(ctx, { projectId }))
      .resolves.toHaveLength(1);
    await expect(functionHandler(getVersion)(ctx, { versionId: "version-a" }))
      .resolves.toMatchObject({ projectId });
    await expect(functionHandler(listVersions)(ctx, { templateId: "template-a" }))
      .resolves.toHaveLength(1);
    await expect(functionHandler(listPolicyEnvelopes)(ctx, { projectId }))
      .resolves.toEqual([]);
    await expect(functionHandler(evaluate)(ctx, { projectId, riskLevel: "GREEN" }))
      .resolves.toEqual({ decision: "ALLOW", source: "fallback" });
    await expect(functionHandler(getDependencyGraph)(ctx, { projectId }))
      .resolves.toMatchObject({ nodes: [expect.objectContaining({ id: "task-a" })], edges: [] });
    await expect(functionHandler(listOpEvents)(ctx, { projectId }))
      .resolves.toEqual([]);
    await expect(functionHandler(getOpEventStats)(ctx, { projectId }))
      .resolves.toMatchObject({ total: 0, inWindow: 0 });
    await expect(functionHandler(workLedger)(ctx, { projectId }))
      .resolves.toMatchObject({
        todo: [expect.objectContaining({ id: "task-a" })],
        inProgress: [],
        finished: [],
      });
    await expect(functionHandler(getGatewayConnection)(ctx, {})).resolves.toBeNull();
    await expect(functionHandler(defaultRules)(ctx, {})).resolves.toHaveLength(4);
    await expect(functionHandler(gatherEvidence)(ctx, { projectId }))
      .resolves.toMatchObject({ prCount: 0 });
  });

  it("rejects contradictory or invalid Preview object scopes", async () => {
    const { ctx, projectId, otherTenantId } = createContext({ permissions: ["factory.read"] });
    await expect(functionHandler(listPolicyEnvelopes)(ctx, {
      projectId,
      tenantId: otherTenantId,
    })).rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(listOpEvents)(ctx, {
      projectId,
      tenantId: otherTenantId,
    })).rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(getDependencyGraph)(ctx, {
      parentTaskId: "missing-task",
    })).rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(gatherEvidence)(ctx, {
      projectId: "missing-project",
    })).rejects.toThrow("unavailable or unauthorized");
  });

  it("denies cross-company policy, template, and version bindings before writes", async () => {
    const { ctx, projectId, otherTenantId } = createContext({
      permissions: ["factory.improve", "factory.automation.manage"],
    });
    await expect(functionHandler(createPolicyEnvelope)(ctx, {
      tenantId: otherTenantId,
      projectId,
      name: "Cross-company policy",
      rules: {},
    })).rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(createTemplate)(ctx, {
      tenantId: otherTenantId,
      projectId,
      name: "Cross-company template",
      slug: "cross-company-template",
    })).rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(createVersion)(ctx, {
      tenantId: otherTenantId,
      projectId,
      templateId: "template-b",
      genome: {
        modelConfig: { provider: "test", modelId: "test" },
        promptBundleHash: "prompt",
        toolManifestHash: "tools",
        provenance: { createdBy: "test", source: "test", createdAt: 1 },
      },
    })).rejects.toThrow("unavailable or unauthorized");
  });

  it("denies unauthenticated callers across the remediated Live deployment and audit reads", async () => {
    const { ctx, projectId, tenantId } = createContext({ identity: null });
    const calls = [
      () => functionHandler(listEnvironments)(ctx, { tenantId }),
      () => functionHandler(listDeployments)(ctx, { tenantId }),
      () => functionHandler(listShadowGates)(ctx, { deploymentId: "deployment-a" }),
      () => functionHandler(listLatestShadowGates)(ctx, { deploymentIds: ["deployment-a"] }),
      () => functionHandler(listShadowGateHistory)(ctx, { deploymentIds: ["deployment-a"] }),
      () => functionHandler(listApprovals)(ctx, { projectId }),
      () => functionHandler(listChangeRecords)(ctx, { projectId }),
      () => functionHandler(getChangeRecord)(ctx, { changeRecordId: "change-a" }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Authentication|required|unavailable|unauthorized/);
    }
  });

  it("denies cross-company deployment and audit reads", async () => {
    const { ctx, otherProjectId, otherTenantId } = createContext({ permissions: ["factory.read"] });
    const calls = [
      () => functionHandler(listEnvironments)(ctx, { tenantId: otherTenantId }),
      () => functionHandler(listDeployments)(ctx, { tenantId: otherTenantId }),
      () => functionHandler(listShadowGates)(ctx, { deploymentId: "deployment-b" }),
      () => functionHandler(listLatestShadowGates)(ctx, { deploymentIds: ["deployment-b"] }),
      () => functionHandler(listShadowGateHistory)(ctx, { deploymentIds: ["deployment-b"] }),
      () => functionHandler(listApprovals)(ctx, { projectId: otherProjectId }),
      () => functionHandler(listChangeRecords)(ctx, { projectId: otherProjectId }),
      () => functionHandler(getChangeRecord)(ctx, { changeRecordId: "change-b" }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Company account|unavailable|unauthorized/);
    }
  });

  it("serves Live deployment and audit reads only inside the authorized scope", async () => {
    const { ctx, projectId, tenantId } = createContext({ permissions: ["factory.read"] });

    await expect(functionHandler(listEnvironments)(ctx, { tenantId })).resolves.toHaveLength(1);
    await expect(functionHandler(listDeployments)(ctx, { tenantId })).resolves.toHaveLength(1);
    await expect(functionHandler(listShadowGates)(ctx, { deploymentId: "deployment-a" })).resolves.toHaveLength(1);
    await expect(functionHandler(listLatestShadowGates)(ctx, { deploymentIds: ["deployment-a"] })).resolves.toHaveLength(1);
    await expect(functionHandler(listShadowGateHistory)(ctx, { deploymentIds: ["deployment-a"] })).resolves.toHaveLength(1);
    await expect(functionHandler(listApprovals)(ctx, { projectId })).resolves.toHaveLength(1);
    await expect(functionHandler(listChangeRecords)(ctx, { projectId })).resolves.toHaveLength(1);
    await expect(functionHandler(getChangeRecord)(ctx, { changeRecordId: "change-a" }))
      .resolves.toMatchObject({ projectId });
  });

  it("rejects unscoped or contradictory Live deployment and audit reads", async () => {
    const { ctx, projectId, tenantId, otherTenantId } = createContext({ permissions: ["factory.read"] });

    await expect(functionHandler(listDeployments)(ctx, {}))
      .rejects.toThrow("authorized deployment scope");
    await expect(functionHandler(listApprovals)(ctx, {}))
      .rejects.toThrow("authorized approval scope");
    await expect(functionHandler(listChangeRecords)(ctx, {}))
      .rejects.toThrow("authorized audit scope");
    await expect(functionHandler(listDeployments)(ctx, {
      tenantId: otherTenantId,
      templateId: "template-a",
    })).rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(listApprovals)(ctx, { projectId, tenantId: otherTenantId }))
      .rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(listChangeRecords)(ctx, { projectId, tenantId: otherTenantId }))
      .rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(listDeployments)(ctx, { tenantId })).resolves.toHaveLength(1);
  });

  it("denies unauthenticated task-drawer reads", async () => {
    const { ctx, projectId } = createContext({ identity: null });
    const calls = [
      () => functionHandler(explainTaskPolicy)(ctx, { taskId: "task-a" }),
      () => functionHandler(generateIncidentReport)(ctx, { taskId: "task-a" }),
      () => functionHandler(listReviewsByTask)(ctx, { taskId: "task-a" }),
      () => functionHandler(getReviewStats)(ctx, { projectId }),
      () => functionHandler(listWatchSubscriptionsByUser)(ctx, { userId: "operator", projectId }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Authentication|required|unavailable|unauthorized/);
    }
  });

  it("denies cross-company and unscoped task-drawer reads", async () => {
    const { ctx, otherProjectId } = createContext({ permissions: ["factory.read"] });
    const calls = [
      () => functionHandler(explainTaskPolicy)(ctx, { taskId: "task-b" }),
      () => functionHandler(generateIncidentReport)(ctx, { taskId: "task-b" }),
      () => functionHandler(listReviewsByTask)(ctx, { taskId: "task-b" }),
      () => functionHandler(getReviewStats)(ctx, { projectId: otherProjectId }),
      () => functionHandler(listWatchSubscriptionsByUser)(ctx, { userId: "operator", projectId: otherProjectId }),
      () => functionHandler(getReviewStats)(ctx, {}),
      () => functionHandler(listWatchSubscriptionsByUser)(ctx, { userId: "operator" }),
      () => functionHandler(generateIncidentReport)(ctx, { taskId: "missing-task" }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Authentication|required|unavailable|unauthorized|authorized .* scope/);
    }
  });

  it("serves task-drawer reads inside the authorized workspace", async () => {
    const { ctx, projectId } = createContext({ permissions: ["factory.read"] });

    await expect(functionHandler(explainTaskPolicy)(ctx, { taskId: "task-a" }))
      .resolves.toMatchObject({ taskId: "task-a", decision: "NEEDS_APPROVAL" });
    await expect(functionHandler(generateIncidentReport)(ctx, { taskId: "task-a" }))
      .resolves.toMatchObject({ task: { _id: "task-a", projectId }, totalCost: 0 });
    await expect(functionHandler(listReviewsByTask)(ctx, { taskId: "task-a" }))
      .resolves.toHaveLength(1);
    await expect(functionHandler(getReviewStats)(ctx, { projectId }))
      .resolves.toMatchObject({ total: 1, byType: { PRAISE: 1 } });
    await expect(functionHandler(listWatchSubscriptionsByUser)(ctx, { userId: "operator", projectId }))
      .resolves.toEqual([expect.objectContaining({ entityId: "task-a" })]);
  });

  it("denies unauthenticated runtime and Labs reads", async () => {
    const { ctx, projectId } = createContext({ identity: null });
    const calls = [
      () => functionHandler(listCaptures)(ctx, { projectId }),
      () => functionHandler(getWorkflowRun)(ctx, { runId: "run-a" }),
      () => functionHandler(listWorkflowRunEvents)(ctx, { workflowRunId: "workflow-run-a" }),
      () => functionHandler(listWorkflowRunArtifacts)(ctx, { workflowRunId: "workflow-run-a" }),
      () => functionHandler(getExecutionManifest)(ctx, {
        workOrderId: "work-order-a",
        claimId: "claim-a",
        ownerId: "service-a",
      }),
      () => functionHandler(getWorkflow)(ctx, { workflowId: "global-flow" }),
      () => functionHandler(listWorkflows)(ctx, { activeOnly: true }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Authentication|required|unavailable|unauthorized/);
    }
  });

  it("denies cross-company runtime and Labs objects", async () => {
    const { ctx, otherProjectId } = createContext({ permissions: ["factory.read"] });
    const calls = [
      () => functionHandler(listCaptures)(ctx, { projectId: otherProjectId }),
      () => functionHandler(getWorkflowRun)(ctx, { runId: "run-b" }),
      () => functionHandler(listWorkflowRunEvents)(ctx, { workflowRunId: "workflow-run-b" }),
      () => functionHandler(listWorkflowRunArtifacts)(ctx, { workflowRunId: "workflow-run-b" }),
      () => functionHandler(getExecutionManifest)(ctx, { workOrderId: "work-order-b" }),
      () => functionHandler(getWorkflow)(ctx, { workflowId: "scoped-b" }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toThrow(/Company account|unavailable|unauthorized/);
    }
  });

  it("serves runtime and Labs data only inside the authorized workspace", async () => {
    const { ctx, projectId, definitionId } = createContext({ permissions: ["factory.read"] });

    await expect(functionHandler(listCaptures)(ctx, { projectId }))
      .resolves.toEqual([expect.objectContaining({ _id: "capture-a" })]);
    await expect(functionHandler(getWorkflowRun)(ctx, { runId: "run-a" }))
      .resolves.toMatchObject({ _id: "workflow-run-a", projectId });
    await expect(functionHandler(listWorkflowRunEvents)(ctx, { workflowRunId: "workflow-run-a" }))
      .resolves.toEqual([expect.objectContaining({ _id: "event-a" })]);
    await expect(functionHandler(listWorkflowRunArtifacts)(ctx, { workflowRunId: "workflow-run-a" }))
      .resolves.toEqual([expect.objectContaining({ _id: "run-artifact-a" })]);
    await expect(functionHandler(getExecutionManifest)(ctx, {
      workOrderId: "work-order-a",
      claimId: "claim-a",
      ownerId: "service-a",
    })).resolves.toMatchObject({
      workflowRunId: "workflow-run-a",
      definitionId,
      artifactContentHash: "artifact-hash-a",
    });
    await expect(functionHandler(getWorkflow)(ctx, { workflowId: "scoped-a" }))
      .resolves.toMatchObject({ projectId });
    await expect(functionHandler(listWorkflows)(ctx, { activeOnly: true }))
      .resolves.toEqual([
        expect.objectContaining({ workflowId: "global-flow" }),
        expect.objectContaining({ workflowId: "scoped-a" }),
      ]);
  });

  it("fails closed for an invalid runtime object", async () => {
    const { ctx } = createContext({ permissions: ["factory.read"] });
    await expect(functionHandler(getWorkflowRun)(ctx, { runId: "missing-run" }))
      .rejects.toThrow("unavailable or unauthorized");
    await expect(functionHandler(listWorkflowRunEvents)(ctx, { workflowRunId: "missing-run" }))
      .rejects.toThrow("unavailable or unauthorized");
  });
});
