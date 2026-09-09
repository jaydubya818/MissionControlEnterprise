/**
 * Activities — Convex Functions
 * 
 * Audit log queries.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "./lib/companyAccess";
import { authedMutation } from "./lib/authedFunctions";

async function requireActivityProject(ctx: QueryCtx, projectId?: Id<"projects">) {
  if (!projectId) throw new Error("A workspace is required to access activity history.");
  return await requireWorkspacePermission(ctx, projectId, FACTORY_PERMISSIONS.VIEW);
}

async function requireTaskActivity(ctx: QueryCtx, taskId: Id<"tasks">) {
  const task = await ctx.db.get(taskId);
  if (!task?.projectId) throw new Error("Task is unavailable or unscoped.");
  await requireWorkspacePermission(ctx, task.projectId, FACTORY_PERMISSIONS.VIEW);
}

async function requireAgentActivity(ctx: QueryCtx, agentId: Id<"agents">) {
  const agent = await ctx.db.get(agentId);
  if (!agent?.projectId) throw new Error("Agent is unavailable or unscoped.");
  await requireWorkspacePermission(ctx, agent.projectId, FACTORY_PERMISSIONS.VIEW);
}

export const create = authedMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    actorType: v.union(v.literal("HUMAN"), v.literal("AGENT"), v.literal("SYSTEM")),
    actorId: v.optional(v.string()),
    action: v.string(),
    description: v.string(),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    agentId: v.optional(v.id("agents")),
    beforeState: v.optional(v.any()),
    afterState: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => await ctx.db.insert("activities", args),
});

export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireActivityProject(ctx, args.projectId);
    if (args.projectId) {
      return await ctx.db
        .query("activities")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listRecent = query({
  args: { 
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireActivityProject(ctx, args.projectId);
    if (args.projectId) {
      return await ctx.db
        .query("activities")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listByTask = query({
  args: { 
    taskId: v.id("tasks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireTaskActivity(ctx, args.taskId);
    return await ctx.db
      .query("activities")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listByAgent = query({
  args: { 
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAgentActivity(ctx, args.agentId);
    return await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listByAction = query({
  args: { 
    projectId: v.id("projects"),
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireActivityProject(ctx, args.projectId);
    return await ctx.db
      .query("activities")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
