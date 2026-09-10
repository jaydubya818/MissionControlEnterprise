import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  FACTORY_PERMISSIONS,
  requireCompanyAccess,
  requireWorkspacePermission,
} from "../lib/companyAccess";

export const listChangeRecords = query({
  args: {
    tenantId: v.optional(v.id("tenants")),
    projectId: v.optional(v.id("projects")),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.projectId) {
      const access = await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
      if (args.tenantId && args.tenantId !== access.project.tenantId) {
        throw new Error("Audit scope is unavailable or unauthorized.");
      }
    } else if (args.tenantId) {
      await requireCompanyAccess(ctx, args.tenantId);
    } else {
      throw new Error("An authorized audit scope is required.");
    }
    let rows = args.projectId
      ? await ctx.db
          .query("changeRecords")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : args.tenantId
      ? await ctx.db
          .query("changeRecords")
          .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
          .collect()
      : [];

    if (args.type) {
      rows = rows.filter((row) => row.type === args.type);
    }

    rows.sort((a, b) => b.timestamp - a.timestamp);
    return rows.slice(0, args.limit ?? 200);
  },
});

export const getChangeRecord = query({
  args: { changeRecordId: v.id("changeRecords") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.changeRecordId);
    if (!record) throw new Error("Audit record is unavailable or unauthorized.");
    if (record.projectId) {
      await requireWorkspacePermission(ctx, record.projectId, FACTORY_PERMISSIONS.VIEW);
    } else if (record.tenantId) {
      await requireCompanyAccess(ctx, record.tenantId);
    } else {
      throw new Error("Audit record is unavailable or unauthorized.");
    }
    return record;
  },
});
