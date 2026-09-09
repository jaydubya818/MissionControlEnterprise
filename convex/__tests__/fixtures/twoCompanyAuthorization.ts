import type { Id } from "../../_generated/dataModel";

type Row = { _id: string; [key: string]: any };

function expressionValue(expression: any, row: Row): boolean {
  if (!expression) return true;
  if (expression.kind === "eq") return row[expression.field] === expression.value;
  if (expression.kind === "neq") return row[expression.field] !== expression.value;
  if (expression.kind === "and") return expression.values.every((value: any) => expressionValue(value, row));
  if (expression.kind === "or") return expression.values.some((value: any) => expressionValue(value, row));
  return true;
}

export function twoCompanyAuthorizationFixture(identitySubject: "clerk-user-a" | "clerk-user-b") {
  const tenant = (suffix: "a" | "b") => ({
    _id: `company-${suffix}`,
    _creationTime: suffix === "a" ? 1 : 2,
    name: `Company ${suffix.toUpperCase()}`,
    slug: `company-${suffix}`,
    active: true,
  });
  const project = (suffix: "a" | "b") => ({
    _id: `workspace-${suffix}`,
    _creationTime: suffix === "a" ? 3 : 4,
    tenantId: `company-${suffix}`,
    name: `Workspace ${suffix.toUpperCase()}`,
    slug: `workspace-${suffix}`,
  });
  const operator = (suffix: "a" | "b") => ({
    _id: `operator-${suffix}`,
    _creationTime: suffix === "a" ? 5 : 6,
    tenantId: `company-${suffix}`,
    authId: `clerk-user-${suffix}`,
    name: `Operator ${suffix.toUpperCase()}`,
    email: `operator-${suffix}@example.invalid`,
    active: true,
    createdAt: 1,
  });
  const role = (suffix: "a" | "b") => ({
    _id: `role-${suffix}`,
    _creationTime: suffix === "a" ? 7 : 8,
    tenantId: `company-${suffix}`,
    name: "Owner",
    permissions: ["settings.manage"],
  });
  const assignment = (suffix: "a" | "b") => ({
    _id: `assignment-${suffix}`,
    _creationTime: suffix === "a" ? 9 : 10,
    operatorId: `operator-${suffix}`,
    roleId: `role-${suffix}`,
    scope: { type: "tenant", id: `company-${suffix}` },
    assignedAt: 1,
  });
  const mission = (suffix: "a" | "b") => ({
    _id: `mission-${suffix}`,
    _creationTime: 11,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    title: `Mission ${suffix.toUpperCase()}`,
    objective: "Prove authenticated isolation",
    state: "DRAFT",
    executionPolicy: "SERIAL_MUTATIONS",
    maxReadOnlyConcurrency: 1,
    maxCorrectiveIterations: 1,
    correctiveIterations: 0,
    stopCondition: "Qualified",
    spentUsd: 0,
    createdAt: 1,
    updatedAt: 1,
  });
  const workOrder = (suffix: "a" | "b") => ({
    _id: `work-order-${suffix}`,
    _creationTime: 12,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    missionId: `mission-${suffix}`,
    title: `Work Order ${suffix.toUpperCase()}`,
    desiredOutcome: "Qualified",
    priority: 1,
    riskLevel: "HIGH",
    acceptanceCriteria: [{ id: "criterion-1", description: "Pass", verificationMethod: "TEST", required: true }],
    state: "AWAITING_VERIFICATION",
    verificationStatus: "PENDING",
    approvalStatus: "PENDING",
    currentRevisionNumber: 1,
    createdAt: 1,
    updatedAt: 1,
  });
  const task = (suffix: "a" | "b") => ({
    _id: `task-${suffix}`,
    _creationTime: 13,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    workOrderId: `work-order-${suffix}`,
    identifier: `AUTH-${suffix.toUpperCase()}`,
    title: `Task ${suffix.toUpperCase()}`,
    status: "READY",
    type: "ENGINEERING",
    priority: 1,
    assigneeIds: [],
    actualCost: 0,
  });
  const run = (suffix: "a" | "b") => ({
    _id: `attempt-${suffix}`,
    _creationTime: 14,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    missionId: `mission-${suffix}`,
    workOrderId: `work-order-${suffix}`,
    parentTaskId: `task-${suffix}`,
    workOrderRevisionNumber: 1,
    runId: `attempt-${suffix}`,
    status: "COMPLETED",
    headSha: `${suffix.repeat(40)}`,
    steps: [],
    currentStepIndex: 0,
  });
  const candidate = (suffix: "a" | "b") => ({
    _id: `candidate-${suffix}`,
    _creationTime: 15,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    workOrderId: `work-order-${suffix}`,
    workflowRunId: `attempt-${suffix}`,
    workOrderRevisionNumber: 1,
    candidateRevision: `${suffix.repeat(40)}`,
    category: "SCOPE",
    proposedTarget: "WORK_ORDER_REVISION",
    status: "PROPOSED",
  });
  const verification = (suffix: "a" | "b") => ({
    _id: `verification-${suffix}`,
    _creationTime: 16,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    missionId: `mission-${suffix}`,
    workOrderId: `work-order-${suffix}`,
    workflowRunId: `attempt-${suffix}`,
    acceptanceCriterionId: "criterion-1",
    status: "PASSED",
    recordedAt: 1,
  });
  const approval = (suffix: "a" | "b") => ({
    _id: `approval-${suffix}`,
    _creationTime: 17,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    workOrderId: `work-order-${suffix}`,
    workflowRunId: `attempt-${suffix}`,
    approvalType: "HUMAN_REVIEW",
    requestedAction: "Accept candidate",
    status: "PENDING",
    riskLevel: "HIGH",
    requestedBy: `operator-${suffix}`,
    requestedAt: 1,
  });
  const legacyApproval = (suffix: "a" | "b") => ({
    _id: `legacy-approval-${suffix}`,
    _creationTime: 17,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    taskId: `task-${suffix}`,
    requestorAgentId: `agent-${suffix}`,
    actionType: "TASK_REVIEW",
    actionSummary: "Review candidate",
    riskLevel: "YELLOW",
    justification: "Golden-path approval",
    status: "PENDING",
    expiresAt: Date.now() + 60_000,
    escalationLevel: 0,
  });
  const release = (suffix: "a" | "b") => ({
    _id: `release-${suffix}`,
    _creationTime: 18,
    tenantId: `company-${suffix}`,
    projectId: `workspace-${suffix}`,
    workOrderId: `work-order-${suffix}`,
    workflowRunId: `attempt-${suffix}`,
    environmentId: `environment-${suffix}`,
    prEvaluationId: `pr-evaluation-${suffix}`,
    repositoryId: `repository-${suffix}`,
    mergeCommitSha: `${suffix.repeat(40)}`,
    state: "MERGED",
    verificationAttemptCount: 0,
    updatedAt: 1,
  });

  const tables: Record<string, Row[]> = {
    tenants: [tenant("a"), tenant("b")],
    projects: [project("a"), project("b")],
    operators: [operator("a"), operator("b")],
    roles: [role("a"), role("b")],
    roleAssignments: [assignment("a"), assignment("b")],
    teamMemberships: [],
    orgMembers: [],
    featureFlags: [],
    missions: [mission("a"), mission("b")],
    workOrders: [workOrder("a"), workOrder("b")],
    tasks: [task("a"), task("b")],
    workflowRuns: [run("a"), run("b")],
    decisionCandidates: [candidate("a"), candidate("b")],
    verificationReceipts: [verification("a"), verification("b")],
    approvalDecisions: [approval("a"), approval("b")],
    approvals: [legacyApproval("a"), legacyApproval("b")],
    factoryReleases: [release("a"), release("b")],
  };
  const rows = Object.values(tables).flat();
  const writes: Array<{ operation: string; id?: string }> = [];

  const ctx = {
    auth: {
      getUserIdentity: async () => ({
        subject: identitySubject,
        tokenIdentifier: `https://issuer.example|${identitySubject}`,
      }),
    },
    db: {
      get: async (id: string) => rows.find((row) => row._id === id) ?? null,
      patch: async (id: string) => { writes.push({ operation: "patch", id }); },
      insert: async (table: string) => {
        writes.push({ operation: `insert:${table}` });
        return `inserted-${table}`;
      },
      query: (table: string) => {
        let selected = [...(tables[table] ?? [])];
        const q: any = {
          field: (field: string) => field,
          eq: (field: string, value: unknown) => ({ kind: "eq", field, value }),
          neq: (field: string, value: unknown) => ({ kind: "neq", field, value }),
          and: (...values: any[]) => ({ kind: "and", values }),
          or: (...values: any[]) => ({ kind: "or", values }),
        };
        const builder: any = {
          withIndex: (_name: string, apply: (index: any) => any) => {
            const conditions: Array<[string, unknown]> = [];
            const index: any = {
              eq: (field: string, value: unknown) => {
                conditions.push([field, value]);
                return index;
              },
            };
            apply(index);
            selected = selected.filter((row) => conditions.every(([field, value]) => row[field] === value));
            return builder;
          },
          filter: (apply: (expression: any) => any) => {
            const expression = apply(q);
            selected = selected.filter((row) => expressionValue(expression, row));
            return builder;
          },
          order: () => builder,
          collect: async () => selected,
          first: async () => selected[0] ?? null,
          take: async (limit: number) => selected.slice(0, limit),
        };
        return builder;
      },
    },
    scheduler: { runAfter: async () => undefined },
    runMutation: async () => undefined,
    runQuery: async () => undefined,
  } as any;

  const ids = (suffix: "a" | "b") => ({
    tenantId: `company-${suffix}` as Id<"tenants">,
    projectId: `workspace-${suffix}` as Id<"projects">,
    missionId: `mission-${suffix}` as Id<"missions">,
    workOrderId: `work-order-${suffix}` as Id<"workOrders">,
    taskId: `task-${suffix}` as Id<"tasks">,
    attemptId: `attempt-${suffix}` as Id<"workflowRuns">,
    candidateId: `candidate-${suffix}` as Id<"decisionCandidates">,
    verificationReceiptId: `verification-${suffix}` as Id<"verificationReceipts">,
    approvalDecisionId: `approval-${suffix}` as Id<"approvalDecisions">,
    legacyApprovalId: `legacy-approval-${suffix}` as Id<"approvals">,
    releaseId: `release-${suffix}` as Id<"factoryReleases">,
  });

  return { ctx, writes, companyA: ids("a"), companyB: ids("b") };
}
