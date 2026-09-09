/**
 * Agent Documents — WORKING.md, daily notes, session memory.
 * Per-agent memory system for OpenClaw agents.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "./lib/companyAccess";

async function requireAgentDocumentAccess(
  ctx: QueryCtx | MutationCtx,
  agentId: Id<"agents">,
  permission: typeof FACTORY_PERMISSIONS.VIEW | typeof FACTORY_PERMISSIONS.IMPROVE,
) {
  const agent = await ctx.db.get(agentId);
  if (!agent?.projectId) throw new Error("Agent is unavailable or unscoped.");
  const access = await requireWorkspacePermission(ctx, agent.projectId, permission);
  return { agent, access };
}

async function requireStoredDocumentAccess(
  ctx: MutationCtx,
  documentId: Id<"agentDocuments">,
) {
  const doc = await ctx.db.get(documentId);
  if (!doc?.projectId) throw new Error("Document is unavailable or unscoped.");
  await requireWorkspacePermission(ctx, doc.projectId, FACTORY_PERMISSIONS.IMPROVE);
  return doc;
}

const documentType = v.union(
  v.literal("WORKING_MD"),
  v.literal("DAILY_NOTE"),
  v.literal("SESSION_MEMORY")
);

export const set = mutation({
  args: {
    agentId: v.id("agents"),
    type: documentType,
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { agent } = await requireAgentDocumentAccess(ctx, args.agentId, FACTORY_PERMISSIONS.IMPROVE);
    const now = Date.now();
    const existing = await ctx.db
      .query("agentDocuments")
      .withIndex("by_agent_type", (q) =>
        q.eq("agentId", args.agentId).eq("type", args.type)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: now,
        metadata: args.metadata,
      });
      return { documentId: existing._id, created: false };
    }
    const id = await ctx.db.insert("agentDocuments", {
      agentId: args.agentId,
      projectId: agent.projectId,
      type: args.type,
      content: args.content,
      updatedAt: now,
      metadata: args.metadata,
    });
    return { documentId: id, created: true };
  },
});

export const get = query({
  args: {
    agentId: v.id("agents"),
    type: documentType,
  },
  handler: async (ctx, args) => {
    await requireAgentDocumentAccess(ctx, args.agentId, FACTORY_PERMISSIONS.VIEW);
    return await ctx.db
      .query("agentDocuments")
      .withIndex("by_agent_type", (q) =>
        q.eq("agentId", args.agentId).eq("type", args.type)
      )
      .first();
  },
});

/** List all agent documents, optionally filtered by project */
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    if (!args.projectId) throw new Error("A workspace is required to list agent documents.");
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    if (args.projectId) {
      return await ctx.db
        .query("agentDocuments")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("agentDocuments").order("desc").collect();
  },
});

export const listByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    await requireAgentDocumentAccess(ctx, args.agentId, FACTORY_PERMISSIONS.VIEW);
    return await ctx.db
      .query("agentDocuments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();
  },
});

/** Get WORKING.md content for an agent (convenience). */
export const getWorkingMd = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    await requireAgentDocumentAccess(ctx, args.agentId, FACTORY_PERMISSIONS.VIEW);
    const doc = await ctx.db
      .query("agentDocuments")
      .withIndex("by_agent_type", (q) =>
        q.eq("agentId", args.agentId).eq("type", "WORKING_MD")
      )
      .first();
    return doc?.content ?? null;
  },
});

/** Get daily note for an agent (convenience). */
export const getDailyNote = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    await requireAgentDocumentAccess(ctx, args.agentId, FACTORY_PERMISSIONS.VIEW);
    const doc = await ctx.db
      .query("agentDocuments")
      .withIndex("by_agent_type", (q) =>
        q.eq("agentId", args.agentId).eq("type", "DAILY_NOTE")
      )
      .first();
    return doc?.content ?? null;
  },
});

// ============================================================================
// CRUD MUTATIONS
// ============================================================================

/** Create a new agent document (upserts if agent+type already exists) */
export const create = mutation({
  args: {
    agentId: v.id("agents"),
    projectId: v.optional(v.id("projects")),
    type: documentType,
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { agent } = await requireAgentDocumentAccess(ctx, args.agentId, FACTORY_PERMISSIONS.IMPROVE);

    const projectId = args.projectId ?? agent.projectId;
    if (args.projectId && args.projectId !== agent.projectId) throw new Error("Document workspace does not match the agent.");

    // Check for existing document for this agent+type to prevent duplicates
    const existing = await ctx.db
      .query("agentDocuments")
      .withIndex("by_agent_type", (q) =>
        q.eq("agentId", args.agentId).eq("type", args.type)
      )
      .first();

    if (existing) {
      // Upsert: update the existing document instead of creating a duplicate
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
        metadata: args.metadata,
        projectId,
      });

      await ctx.db.insert("activities", {
        projectId,
        actorType: "HUMAN",
        action: "MEMORY_UPDATED",
        description: `Updated existing ${args.type} document for agent "${agent.name}"`,
        agentId: args.agentId,
      });

      return { documentId: existing._id, created: false };
    }

    const id = await ctx.db.insert("agentDocuments", {
      agentId: args.agentId,
      projectId,
      type: args.type,
      content: args.content,
      updatedAt: Date.now(),
      metadata: args.metadata,
    });

    await ctx.db.insert("activities", {
      projectId,
      actorType: "HUMAN",
      action: "MEMORY_CREATED",
      description: `Created ${args.type} document for agent "${agent.name}"`,
      agentId: args.agentId,
    });

    return { documentId: id, created: true };
  },
});

/** Update an existing agent document */
export const update = mutation({
  args: {
    documentId: v.id("agentDocuments"),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireStoredDocumentAccess(ctx, args.documentId);

    await ctx.db.patch(args.documentId, {
      content: args.content,
      updatedAt: Date.now(),
      metadata: args.metadata,
    });

    return { success: true };
  },
});

/** Remove an agent document */
export const remove = mutation({
  args: {
    documentId: v.id("agentDocuments"),
  },
  handler: async (ctx, args) => {
    const doc = await requireStoredDocumentAccess(ctx, args.documentId);

    await ctx.db.delete(args.documentId);

    await ctx.db.insert("activities", {
      projectId: doc.projectId,
      actorType: "HUMAN",
      action: "MEMORY_DELETED",
      description: `Deleted ${doc.type} document`,
      agentId: doc.agentId,
    });

    return { success: true };
  },
});
