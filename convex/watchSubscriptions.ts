import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { authedMutation } from "./lib/authedFunctions";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "./lib/companyAccess";

const entityTypeValidator = v.union(
  v.literal("TASK"),
  v.literal("APPROVAL"),
  v.literal("AGENT"),
  v.literal("PROJECT")
);

export const listByUser = query({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    entityType: v.optional(entityTypeValidator),
  },
  handler: async (ctx, args) => {
    if (!args.projectId) throw new Error("An authorized watch-subscription scope is required.");
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    let subs = await ctx.db
      .query("watchSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.projectId) {
      subs = subs.filter((sub) => sub.projectId === args.projectId);
    }

    if (args.entityType) {
      subs = subs.filter((sub) => sub.entityType === args.entityType);
    }

    return subs.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listWatchers = internalQuery({
  args: {
    entityType: entityTypeValidator,
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchSubscriptions")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .collect();
  },
});

export const toggle = authedMutation({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    entityType: entityTypeValidator,
    entityId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchSubscriptions")
      .withIndex("by_user_entity", (q) =>
        q.eq("userId", args.userId).eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { watching: false, subscriptionId: existing._id };
    }

    const id = await ctx.db.insert("watchSubscriptions", {
      userId: args.userId,
      projectId: args.projectId,
      entityType: args.entityType,
      entityId: args.entityId,
      createdAt: Date.now(),
      metadata: args.metadata,
    });

    return { watching: true, subscriptionId: id };
  },
});
