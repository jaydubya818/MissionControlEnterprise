import { action, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  COMPANY_PERMISSIONS,
  FACTORY_PERMISSIONS,
  assertAuthenticated,
  listCompanyMemberships,
  requireCompanyPermission,
  requireWorkspacePermission,
} from "./companyAccess";

type FunctionDefinition = {
  handler: (ctx: any, args: any) => unknown;
  [key: string]: unknown;
};

function authenticateDefinition(builder: (definition: any) => any, definition: FunctionDefinition) {
  return builder({
    ...definition,
    handler: async (ctx: any, args: any) => {
      await assertAuthenticated(ctx);
      return await definition.handler(ctx, args);
    },
  });
}

type ResolvedScope = {
  projectIds: Set<Id<"projects">>;
  tenantIds: Set<Id<"tenants">>;
};

async function collectDocumentScope(
  ctx: MutationCtx,
  value: unknown,
  scope: ResolvedScope,
  visited: Set<string>,
  depth = 0,
) {
  if (depth > 2 || typeof value !== "string" || visited.has(value)) return;
  visited.add(value);
  let document: any;
  try {
    document = await ctx.db.get(value as any);
  } catch {
    return;
  }
  if (!document) return;
  if (document.projectId) scope.projectIds.add(document.projectId);
  if (document.tenantId) scope.tenantIds.add(document.tenantId);
  for (const key of ["taskId", "agentId", "workOrderId", "workflowRunId", "repositoryId", "definitionId", "deploymentId"]) {
    if (document[key]) await collectDocumentScope(ctx, document[key], scope, visited, depth + 1);
  }
}

async function requireAdministrator(ctx: MutationCtx) {
  const memberships = await listCompanyMemberships(ctx);
  const administrator = memberships.find((membership) => membership.canManageCompany);
  if (!administrator) throw new Error("A company administrator is required for this global operation.");
  await requireCompanyPermission(ctx, administrator.tenant._id, COMPANY_PERMISSIONS.MANAGE_COMPANY);
}

/**
 * Conservative authorization for legacy public mutations.
 *
 * Prefer an explicit project argument. Otherwise resolve every Convex object
 * ID supplied by the caller and authorize its owning workspace. Multiple
 * resources must resolve to one project/tenant boundary. Truly global writes
 * are restricted to a company administrator.
 */
async function authorizeMutationArguments(ctx: MutationCtx, args: Record<string, unknown>) {
  const scope: ResolvedScope = { projectIds: new Set(), tenantIds: new Set() };
  if (typeof args.projectId === "string") scope.projectIds.add(args.projectId as Id<"projects">);
  if (typeof args.tenantId === "string") scope.tenantIds.add(args.tenantId as Id<"tenants">);

  const visited = new Set<string>();
  for (const [key, value] of Object.entries(args)) {
    if (key.endsWith("Id")) await collectDocumentScope(ctx, value, scope, visited);
    if (key.endsWith("Ids") && Array.isArray(value)) {
      for (const item of value) await collectDocumentScope(ctx, item, scope, visited);
    }
  }

  if (scope.projectIds.size > 1 || scope.tenantIds.size > 1) {
    throw new Error("Cross-workspace mutation arguments are not allowed.");
  }
  if (scope.projectIds.size === 1) {
    const projectId = [...scope.projectIds][0];
    const access = await requireWorkspacePermission(ctx, projectId, FACTORY_PERMISSIONS.IMPROVE);
    if (scope.tenantIds.size === 1 && [...scope.tenantIds][0] !== access.project.tenantId) {
      throw new Error("Mutation company and workspace scopes do not match.");
    }
    return access;
  }
  if (scope.tenantIds.size === 1) {
    return await requireCompanyPermission(
      ctx,
      [...scope.tenantIds][0],
      COMPANY_PERMISSIONS.MANAGE_COMPANY,
    );
  }
  return await requireAdministrator(ctx);
}

/** Public query for deployment-global data that still requires a human identity. */
export const authedQuery = ((definition: FunctionDefinition) =>
  authenticateDefinition(query, definition)) as typeof query;

/** Public mutation for deployment-global state that still requires a human identity. */
export const authedMutation = ((definition: FunctionDefinition) =>
  mutation({
    ...definition,
    handler: async (ctx: MutationCtx, args: Record<string, unknown>) => {
      await authorizeMutationArguments(ctx, args);
      return await definition.handler(ctx, args);
    },
  })) as typeof mutation;

/** Public action for deployment-global effects that still requires a human identity. */
export const authedAction = ((definition: FunctionDefinition) =>
  action({
    ...definition,
    handler: async (ctx: any, args: Record<string, unknown>) => {
      if (typeof args.projectId === "string") {
        await ctx.runQuery(internal.companyContext.authorizeFactoryAction, {
          projectId: args.projectId,
          permission: FACTORY_PERMISSIONS.IMPROVE,
        });
      } else {
        await ctx.runQuery(internal.companyContext.assertAdministrator, {});
      }
      return await definition.handler(ctx, args);
    },
  })) as typeof action;
