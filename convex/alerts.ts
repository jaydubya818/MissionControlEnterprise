/**
 * Alerts — Convex Functions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { COMPANY_PERMISSIONS } from "./lib/companyAccess";
import { requireAuthorizedDeliveryScope } from "./lib/deliveryAuthorization";

async function requireAlertScope(
  ctx: Parameters<typeof requireAuthorizedDeliveryScope>[0],
  alertId: Id<"alerts">,
  permission?: typeof COMPANY_PERMISSIONS.UPDATE_DELIVERY,
) {
  const alert = await ctx.db.get(alertId);
  if (!alert?.projectId) throw new Error("Alert is unavailable or unauthorized.");
  await requireAuthorizedDeliveryScope(ctx, alert.projectId, permission);
  return alert;
}

async function requireAgentScope(
  ctx: Parameters<typeof requireAuthorizedDeliveryScope>[0],
  agentId: Id<"agents">,
) {
  const agent = await ctx.db.get(agentId);
  if (!agent?.projectId) throw new Error("Agent is unavailable or unauthorized.");
  await requireAuthorizedDeliveryScope(ctx, agent.projectId);
  return agent;
}

// ============================================================================
// QUERIES
// ============================================================================

export const listOpen = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.projectId) throw new Error("An authorized workspace is required.");
    await requireAuthorizedDeliveryScope(ctx, args.projectId);
    if (args.projectId) {
      const rows = await ctx.db
        .query("alerts")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
      return rows
        .filter((row) => row.status === "OPEN")
        .sort((left, right) => right._creationTime - left._creationTime)
        .slice(0, args.limit ?? 50);
    }
    return await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("status", "OPEN"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listBySeverity = query({
  args: { 
    projectId: v.id("projects"),
    severity: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuthorizedDeliveryScope(ctx, args.projectId);
    const rows = await ctx.db
      .query("alerts")
      .withIndex("by_severity", (q) => q.eq("severity", args.severity as any))
      .order("desc")
      .take(args.limit ?? 50);
    return rows.filter((row) => row.projectId === args.projectId);
  },
});

export const listByAgent = query({
  args: { 
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgentScope(ctx, args.agentId);
    const rows = await ctx.db
      .query("alerts")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit ?? 50);
    return rows.filter((row) => row.projectId === agent.projectId);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const create = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    severity: v.string(),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    runId: v.optional(v.id("runs")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    let projectId = args.projectId;
    if (args.taskId) projectId = (await ctx.db.get(args.taskId))?.projectId;
    if (!projectId && args.agentId) projectId = (await ctx.db.get(args.agentId))?.projectId;
    if (!projectId && args.runId) projectId = (await ctx.db.get(args.runId))?.projectId;
    if (!projectId) throw new Error("Alert workspace is unavailable or unauthorized.");
    if (args.projectId && args.projectId !== projectId) throw new Error("Alert workspace is unavailable or unauthorized.");
    await requireAuthorizedDeliveryScope(ctx, projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    if (args.taskId) {
      const existing = (await ctx.db
        .query("alerts")
        .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
        .collect())
        .find(
          (alert) =>
            alert.type === args.type &&
            (alert.status === "OPEN" || alert.status === "ACKNOWLEDGED")
        );

      if (existing) {
        return { alert: existing, created: false };
      }
    }

    const alertId = await ctx.db.insert("alerts", {
      projectId,
      severity: args.severity as any,
      type: args.type,
      title: args.title,
      description: args.description,
      agentId: args.agentId,
      taskId: args.taskId,
      runId: args.runId,
      status: "OPEN",
      metadata: args.metadata,
    });
    
    return { alert: await ctx.db.get(alertId), created: true };
  },
});

export const acknowledge = mutation({
  args: {
    alertId: v.id("alerts"),
    acknowledgedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAlertScope(ctx, args.alertId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await ctx.db.patch(args.alertId, {
      status: "ACKNOWLEDGED",
      acknowledgedBy: args.acknowledgedBy,
      acknowledgedAt: Date.now(),
    });
    
    return { alert: await ctx.db.get(args.alertId) };
  },
});

export const resolve = mutation({
  args: {
    alertId: v.id("alerts"),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAlertScope(ctx, args.alertId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await ctx.db.patch(args.alertId, {
      status: "RESOLVED",
      resolvedAt: Date.now(),
      resolutionNote: args.resolutionNote,
    });
    
    return { alert: await ctx.db.get(args.alertId) };
  },
});

export const ignore = mutation({
  args: {
    alertId: v.id("alerts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAlertScope(ctx, args.alertId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await ctx.db.patch(args.alertId, {
      status: "IGNORED",
      resolutionNote: args.reason,
    });
    
    return { alert: await ctx.db.get(args.alertId) };
  },
});
