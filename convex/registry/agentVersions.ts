import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { computeGenomeHash } from "../lib/genomeHash";
import { appendChangeRecord } from "../lib/armAudit";
import { resolveActiveTenantId } from "../lib/getActiveTenant";
import {
  FACTORY_PERMISSIONS,
  requireCompanyAccess,
  requireWorkspacePermission,
} from "../lib/companyAccess";
import { authedMutation } from "../lib/authedFunctions";

const versionStatus = v.union(
  v.literal("DRAFT"),
  v.literal("TESTING"),
  v.literal("CANDIDATE"),
  v.literal("APPROVED"),
  v.literal("DEPRECATED"),
  v.literal("RETIRED")
);

export const createVersion = mutation({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    templateId: v.id("agentTemplates"),
    genome: v.object({
      modelConfig: v.object({
        provider: v.string(),
        modelId: v.string(),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
      }),
      promptBundleHash: v.string(),
      toolManifestHash: v.string(),
      provenance: v.object({
        createdBy: v.string(),
        source: v.string(),
        createdAt: v.number(),
      }),
    }),
    status: v.optional(versionStatus),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!args.projectId) {
      throw new Error("An authorized workspace is required to create an agent version.");
    }
    const access = await requireWorkspacePermission(
      ctx,
      args.projectId,
      args.status === "APPROVED" ? FACTORY_PERMISSIONS.APPROVE : FACTORY_PERMISSIONS.IMPROVE,
    );
    const template = await ctx.db.get(args.templateId);
    if (
      !template
      || template.tenantId !== access.project.tenantId
      || (template.projectId && template.projectId !== args.projectId)
      || (args.tenantId && args.tenantId !== access.project.tenantId)
    ) {
      throw new Error("Agent template is unavailable or unauthorized.");
    }
    const tenantId = await resolveActiveTenantId(
      { db: ctx.db as any },
      {
        tenantId: args.tenantId,
        projectId: args.projectId,
        templateId: args.templateId,
        createDefaultIfMissing: true,
      }
    );
    if (tenantId !== access.project.tenantId) {
      throw new Error("Agent version scope is unavailable or unauthorized.");
    }

    const existing = await ctx.db
      .query("agentVersions")
      .withIndex("by_template", (q) => q.eq("templateId", args.templateId))
      .collect();

    const maxVersion = existing.reduce((max, row) => Math.max(max, row.version), 0);
    const now = Date.now();
    const genomeHash = computeGenomeHash(args.genome);

    const versionId = await ctx.db.insert("agentVersions", {
      tenantId,
      projectId: args.projectId,
      templateId: args.templateId,
      version: maxVersion + 1,
      genomeHash,
      genome: args.genome,
      status: args.status ?? "DRAFT",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      metadata: args.metadata,
    });

    await appendChangeRecord(ctx.db as any, {
      tenantId,
      projectId: args.projectId,
      templateId: args.templateId,
      versionId,
      type: "VERSION_CREATED",
      summary: `Version ${maxVersion + 1} created`,
      payload: { genomeHash },
      relatedTable: "agentVersions",
      relatedId: versionId,
    });

    return await ctx.db.get(versionId);
  },
});

export const getVersion = query({
  args: { versionId: v.id("agentVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version?.tenantId) throw new Error("Agent version is unavailable or unauthorized.");
    if (version.projectId) {
      await requireWorkspacePermission(ctx, version.projectId, FACTORY_PERMISSIONS.VIEW);
    } else {
      await requireCompanyAccess(ctx, version.tenantId);
    }
    return version;
  },
});

export const listVersions = query({
  args: {
    templateId: v.id("agentTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template?.tenantId) throw new Error("Agent template is unavailable or unauthorized.");
    if (template.projectId) {
      await requireWorkspacePermission(ctx, template.projectId, FACTORY_PERMISSIONS.VIEW);
    } else {
      await requireCompanyAccess(ctx, template.tenantId);
    }
    const rows = await ctx.db
      .query("agentVersions")
      .withIndex("by_template", (q) => q.eq("templateId", args.templateId))
      .collect();

    return rows.sort((a, b) => b.version - a.version);
  },
});

export const transitionVersion = authedMutation({
  args: {
    versionId: v.id("agentVersions"),
    status: versionStatus,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.versionId);
    if (!existing) {
      throw new Error("Version not found");
    }

    await ctx.db.patch(args.versionId, {
      status: args.status,
      notes: args.notes ?? existing.notes,
      updatedAt: Date.now(),
    });

    await appendChangeRecord(ctx.db as any, {
      tenantId: existing.tenantId,
      projectId: existing.projectId,
      templateId: existing.templateId,
      versionId: args.versionId,
      type: "VERSION_TRANSITIONED",
      summary: `Version transitioned ${existing.status} -> ${args.status}`,
      relatedTable: "agentVersions",
      relatedId: args.versionId,
    });

    return await ctx.db.get(args.versionId);
  },
});
