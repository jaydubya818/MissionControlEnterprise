import { describe, expect, it } from "vitest";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { kpiSummary } from "../analytics";
import { activate } from "../automations";
import { authedMutation } from "../lib/authedFunctions";

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
  const projectId = "project-a" as Id<"projects">;
  const otherProjectId = "project-b" as Id<"projects">;
  const operatorId = "operator-a" as Id<"operators">;
  const roleId = "role-a" as Id<"roles">;
  const definitionId = "automation-a" as Id<"automationDefinitions">;
  const tables: Record<string, any[]> = {
    tenants: [{ _id: tenantId, active: true, name: "A", slug: "a" }],
    projects: [
      { _id: projectId, tenantId, name: "A", slug: "a" },
      { _id: otherProjectId, tenantId, name: "B", slug: "b" },
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
    orgMembers: [],
    runs: [],
    tasks: [],
    toolCalls: [],
    automationDefinitions: [{
      _id: definitionId,
      projectId,
      status: "DISABLED",
      isMutating: false,
      autonomyLevel: "LEVEL_1",
      definitionVersion: 1,
    }],
    automationDecisions: [],
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
        withIndex: (_name: string, apply: (q: any) => unknown) => {
          const conditions: Array<[string, unknown]> = [];
          const q: any = {
            eq: (field: string, value: unknown) => {
              conditions.push([field, value]);
              return q;
            },
          };
          apply(q);
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
      .rejects.toThrow("Workspace is unavailable or unauthorized");
  });

  it("fails safely for an invalid workspace resource", async () => {
    const { ctx } = createContext();
    await expect(functionHandler(kpiSummary)(ctx, {
      projectId: "missing-project" as Id<"projects">,
      periodDays: 7,
    })).rejects.toThrow("Workspace is unavailable or unauthorized");
  });

  it("allows an authorized workspace viewer", async () => {
    const { ctx, projectId } = createContext({ permissions: ["factory.read"] });
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
      .rejects.toThrow("Workspace is unavailable or unauthorized");
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
});
