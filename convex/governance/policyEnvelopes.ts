import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { appendChangeRecord } from "../lib/armAudit";
import { evaluatePolicyEnvelopes } from "../lib/armPolicy";
import { resolveActiveTenantId } from "../lib/getActiveTenant";
import {
  COMPANY_PERMISSIONS,
  FACTORY_PERMISSIONS,
  requireCompanyAccess,
  requireCompanyPermission,
  requireWorkspacePermission,
} from "../lib/companyAccess";
import { authedMutation } from "../lib/authedFunctions";

type PolicyScope = {
  tenantId?: Id<"tenants">;
  projectId?: Id<"projects">;
  versionId?: Id<"agentVersions">;
};

async function requirePolicyReadScope(ctx: any, args: PolicyScope) {
  if (args.projectId) {
    const access = await requireWorkspacePermission(
      ctx,
      args.projectId,
      FACTORY_PERMISSIONS.VIEW
    );
    const projectTenantId = access.project.tenantId;
    if (!projectTenantId) {
      throw new Error("Policy scope is unavailable or unauthorized.");
    }
    if (args.tenantId && args.tenantId !== projectTenantId) {
      throw new Error("Policy scope is unavailable or unauthorized.");
    }
    if (args.versionId) {
      const version = await ctx.db.get(args.versionId);
      if (
        !version
        || version.tenantId !== projectTenantId
        || (version.projectId && version.projectId !== args.projectId)
      ) {
        throw new Error("Policy scope is unavailable or unauthorized.");
      }
    }
    return projectTenantId;
  }

  if (args.versionId) {
    const version = await ctx.db.get(args.versionId);
    if (!version?.tenantId) {
      throw new Error("Policy scope is unavailable or unauthorized.");
    }
    if (args.tenantId && args.tenantId !== version.tenantId) {
      throw new Error("Policy scope is unavailable or unauthorized.");
    }
    if (version.projectId) {
      await requireWorkspacePermission(ctx, version.projectId, FACTORY_PERMISSIONS.VIEW);
    } else {
      await requireCompanyAccess(ctx, version.tenantId);
    }
    return version.tenantId;
  }

  if (args.tenantId) {
    await requireCompanyAccess(ctx, args.tenantId);
    return args.tenantId;
  }

  throw new Error("An authorized policy scope is required.");
}

export const createPolicyEnvelope = mutation({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    templateId: v.optional(v.id("agentTemplates")),
    versionId: v.optional(v.id("agentVersions")),
    name: v.string(),
    priority: v.optional(v.number()),
    rules: v.any(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let authorizedTenantId: Id<"tenants">;
    if (args.projectId) {
      const access = await requireWorkspacePermission(
        ctx,
        args.projectId,
        FACTORY_PERMISSIONS.MANAGE_AUTOMATION
      );
      const projectTenantId = access.project.tenantId;
      if (!projectTenantId) {
        throw new Error("Policy scope is unavailable or unauthorized.");
      }
      if (args.tenantId && args.tenantId !== projectTenantId) {
        throw new Error("Policy scope is unavailable or unauthorized.");
      }
      authorizedTenantId = projectTenantId;
    } else if (args.tenantId) {
      await requireCompanyPermission(
        ctx,
        args.tenantId,
        COMPANY_PERMISSIONS.MANAGE_COMPANY
      );
      authorizedTenantId = args.tenantId;
    } else {
      throw new Error("An authorized policy scope is required.");
    }

    const [template, version] = await Promise.all([
      args.templateId ? ctx.db.get(args.templateId) : null,
      args.versionId ? ctx.db.get(args.versionId) : null,
    ]);
    if (
      (args.templateId && (!template || template.tenantId !== authorizedTenantId))
      || (template?.projectId && template.projectId !== args.projectId)
      || (args.versionId && (!version || version.tenantId !== authorizedTenantId))
      || (version?.projectId && version.projectId !== args.projectId)
      || (version && args.templateId && version.templateId !== args.templateId)
    ) {
      throw new Error("Policy binding is unavailable or unauthorized.");
    }

    const tenantId = await resolveActiveTenantId(
      { db: ctx.db as any },
      {
        tenantId: args.tenantId,
        projectId: args.projectId,
        templateId: args.templateId,
        versionId: args.versionId,
        createDefaultIfMissing: true,
      }
    );
    if (tenantId !== authorizedTenantId) {
      throw new Error("Policy scope is unavailable or unauthorized.");
    }

    const now = Date.now();
    const id = await ctx.db.insert("policyEnvelopes", {
      tenantId,
      projectId: args.projectId,
      templateId: args.templateId,
      versionId: args.versionId,
      name: args.name,
      active: true,
      priority: args.priority ?? 100,
      rules: args.rules,
      createdAt: now,
      updatedAt: now,
      metadata: args.metadata,
    });

    await appendChangeRecord(ctx.db as any, {
      tenantId,
      projectId: args.projectId,
      templateId: args.templateId,
      versionId: args.versionId,
      type: "POLICY_ATTACHED",
      summary: `Policy envelope attached: ${args.name}`,
      relatedTable: "policyEnvelopes",
      relatedId: id,
    });

    return await ctx.db.get(id);
  },
});

export const attachPolicy = authedMutation({
  args: {
    envelopeId: v.id("policyEnvelopes"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.envelopeId, {
      active: args.active,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.envelopeId);
  },
});

export const listPolicyEnvelopes = query({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    versionId: v.optional(v.id("agentVersions")),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePolicyReadScope(ctx, args);
    let rows = args.versionId
      ? await ctx.db
          .query("policyEnvelopes")
          .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
          .collect()
      : args.projectId
      ? await ctx.db
          .query("policyEnvelopes")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : args.tenantId
      ? await ctx.db
          .query("policyEnvelopes")
          .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
          .collect()
      : await ctx.db.query("policyEnvelopes").collect();

    if (args.activeOnly ?? true) {
      rows = rows.filter((row) => row.active);
    }

    return rows.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  },
});

export const evaluate = query({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    versionId: v.optional(v.id("agentVersions")),
    toolName: v.optional(v.string()),
    riskLevel: v.optional(v.union(v.literal("GREEN"), v.literal("YELLOW"), v.literal("RED"))),
  },
  handler: async (ctx, args) => {
    await requirePolicyReadScope(ctx, args);
    const result = await evaluatePolicyEnvelopes(ctx.db as any, {
      tenantId: args.tenantId,
      projectId: args.projectId,
      versionId: args.versionId,
      toolName: args.toolName,
      riskLevel: args.riskLevel ?? "GREEN",
    });

    if (result) {
      return {
        decision: result.decision,
        envelope: result.envelope,
        source: result.source,
      };
    }

    return { decision: "ALLOW", source: "fallback" };
  },
});
