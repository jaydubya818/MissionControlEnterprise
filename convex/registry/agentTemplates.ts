import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { appendChangeRecord } from "../lib/armAudit";
import { resolveActiveTenantId } from "../lib/getActiveTenant";
import {
  FACTORY_PERMISSIONS,
  assertAuthenticated,
  listCompanyMemberships,
  requireCompanyAccess,
  requireWorkspacePermission,
} from "../lib/companyAccess";
import { authedMutation } from "../lib/authedFunctions";

export const createTemplate = mutation({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!args.projectId) {
      throw new Error("An authorized workspace is required to create an agent template.");
    }
    const access = await requireWorkspacePermission(
      ctx,
      args.projectId,
      FACTORY_PERMISSIONS.IMPROVE
    );
    if (args.tenantId && args.tenantId !== access.project.tenantId) {
      throw new Error("Agent template scope is unavailable or unauthorized.");
    }
    const tenantId = await resolveActiveTenantId(
      { db: ctx.db as any },
      {
        tenantId: args.tenantId,
        projectId: args.projectId,
        createDefaultIfMissing: true,
      }
    );
    if (tenantId !== access.project.tenantId) {
      throw new Error("Agent template scope is unavailable or unauthorized.");
    }

    const existing = await ctx.db
      .query("agentTemplates")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error(`Template slug already exists: ${args.slug}`);
    }

    const now = Date.now();
    const templateId = await ctx.db.insert("agentTemplates", {
      tenantId,
      projectId: args.projectId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      active: true,
      createdAt: now,
      updatedAt: now,
      metadata: args.metadata,
    });

    await appendChangeRecord(ctx.db as any, {
      tenantId,
      projectId: args.projectId,
      templateId,
      type: "TEMPLATE_CREATED",
      summary: `Template created: ${args.name}`,
      relatedTable: "agentTemplates",
      relatedId: templateId,
    });

    return await ctx.db.get(templateId);
  },
});

export const getTemplate = query({
  args: { templateId: v.id("agentTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template?.tenantId) throw new Error("Agent template is unavailable or unauthorized.");
    if (template.projectId) {
      await requireWorkspacePermission(ctx, template.projectId, FACTORY_PERMISSIONS.VIEW);
    } else {
      await requireCompanyAccess(ctx, template.tenantId);
    }
    return template;
  },
});

export const listTemplates = query({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertAuthenticated(ctx);
    let allowedTenantIds: Set<string>;
    if (args.projectId) {
      const access = await requireWorkspacePermission(
        ctx,
        args.projectId,
        FACTORY_PERMISSIONS.VIEW
      );
      if (args.tenantId && args.tenantId !== access.project.tenantId) {
        throw new Error("Agent template scope is unavailable or unauthorized.");
      }
      allowedTenantIds = new Set([String(access.project.tenantId)]);
    } else if (args.tenantId) {
      await requireCompanyAccess(ctx, args.tenantId);
      allowedTenantIds = new Set([String(args.tenantId)]);
    } else {
      allowedTenantIds = new Set(
        (await listCompanyMemberships(ctx)).map((membership) => String(membership.tenant._id))
      );
    }

    let rows = args.projectId
      ? await ctx.db
          .query("agentTemplates")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : args.tenantId
      ? await ctx.db
          .query("agentTemplates")
          .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
          .collect()
      : await ctx.db.query("agentTemplates").collect();

    rows = rows.filter((row) => row.tenantId && allowedTenantIds.has(String(row.tenantId)));

    if (args.activeOnly ?? true) {
      rows = rows.filter((row) => row.active);
    }

    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const updateTemplate = authedMutation({
  args: {
    templateId: v.id("agentTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.templateId);
    if (!existing) {
      throw new Error("Template not found");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.active !== undefined) patch.active = args.active;
    if (args.metadata !== undefined) patch.metadata = args.metadata;

    await ctx.db.patch(args.templateId, patch);
    return await ctx.db.get(args.templateId);
  },
});
