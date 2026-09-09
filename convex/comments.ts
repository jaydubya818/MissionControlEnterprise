/**
 * Comments — Task comments with @mentions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { resolveAgentRef } from "./lib/agentResolver";
import { COMPANY_PERMISSIONS } from "./lib/companyAccess";
import { requireAuthorizedDeliveryScope } from "./lib/deliveryAuthorization";

async function requireTaskScope(
  ctx: Parameters<typeof requireAuthorizedDeliveryScope>[0],
  taskId: Id<"tasks">,
  permission?: typeof COMPANY_PERMISSIONS.UPDATE_DELIVERY,
) {
  const task = await ctx.db.get(taskId);
  if (!task?.projectId) throw new Error("Task is unavailable or unauthorized.");
  await requireAuthorizedDeliveryScope(ctx, task.projectId, permission);
  return task;
}

async function requireCommentScope(
  ctx: Parameters<typeof requireAuthorizedDeliveryScope>[0],
  commentId: Id<"messages">,
) {
  const comment = await ctx.db.get(commentId);
  if (!comment?.projectId || comment.type !== "COMMENT") {
    throw new Error("Comment is unavailable or unauthorized.");
  }
  await requireAuthorizedDeliveryScope(ctx, comment.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
  return comment;
}

// ============================================================================
// QUERIES
// ============================================================================

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await requireTaskScope(ctx, args.taskId);
    const comments = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("type"), "COMMENT"))
      .order("desc")
      .collect();

    // Get authors
    const agentIds = [...new Set(comments.map((c) => c.authorAgentId).filter(Boolean))];
    const agents = await Promise.all(
      agentIds.map((id) => id && ctx.db.get(id as Id<"agents">))
    );
    const agentMap = new Map(agents.filter((a): a is NonNullable<typeof a> => a !== null).map((a) => [a._id, a]));

    return comments.map((comment) => ({
      ...comment,
      author: comment.authorAgentId ? agentMap.get(comment.authorAgentId) : null,
    }));
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const post = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    authorType: v.union(v.literal("AGENT"), v.literal("HUMAN"), v.literal("SYSTEM")),
    authorAgentId: v.optional(v.id("agents")),
    authorUserId: v.optional(v.string()),
    mentions: v.optional(v.array(v.id("agents"))),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await requireTaskScope(ctx, args.taskId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    // Check idempotency
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("messages")
        .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
        .first();

      if (existing) {
        return { commentId: existing._id, created: false };
      }
    }

    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentionedNames = [...args.content.matchAll(mentionRegex)].map((m) => m[1]);
    
    // Get mentioned agents
    const mentionedAgents = [];
    for (const name of mentionedNames) {
      const agent = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("name"), name))
        .first();
      if (agent) {
        mentionedAgents.push(agent._id);
      }
    }

    // Create comment
    const authorRef = args.authorAgentId
      ? await resolveAgentRef(
          { db: ctx.db as any },
          { agentId: args.authorAgentId, createIfMissing: true }
        )
      : null;
    const commentId = await ctx.db.insert("messages", {
      tenantId: task.tenantId,
      projectId: task.projectId,
      idempotencyKey: args.idempotencyKey || `comment-${args.taskId}-${Date.now()}`,
      taskId: args.taskId,
      type: "COMMENT",
      authorType: args.authorType,
      authorAgentId: args.authorAgentId,
      authorInstanceId: authorRef?.instanceId,
      authorUserId: args.authorUserId,
      content: args.content,
    });

    // Create notifications for mentioned agents
    for (const agentId of mentionedAgents) {
      await ctx.db.insert("notifications", {
        projectId: task.projectId,
        agentId,
        type: "MENTION",
        title: "You were mentioned",
        body: `${args.authorAgentId ? "Agent" : "User"} mentioned you in task: ${task.title}`,
        taskId: args.taskId,
        messageId: commentId,
      });
    }

    // Create activity
    await ctx.db.insert("activities", {
      projectId: task.projectId,
      actorType: args.authorType,
      actorId: args.authorUserId || args.authorAgentId,
      action: "COMMENT_POSTED",
      description: `Posted comment on task: ${task.title}`,
      taskId: args.taskId,
      agentId: args.authorAgentId,
      metadata: {
        commentId,
        mentions: mentionedAgents.length,
      },
    });

    return { commentId, created: true };
  },
});

export const edit = mutation({
  args: {
    commentId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCommentScope(ctx, args.commentId);

    await ctx.db.patch(args.commentId, {
      content: args.content,
    });

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    commentId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await requireCommentScope(ctx, args.commentId);

    await ctx.db.delete(args.commentId);

    return { success: true };
  },
});
