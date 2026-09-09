import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireWorkspaceAccess, type CompanyPermission } from "./companyAccess";

type DeliveryCtx = QueryCtx | MutationCtx;

/**
 * Authorize a public delivery operation against its authoritative workspace.
 *
 * This boundary is deliberately fail closed. Feature flags and deployment
 * provisioning state are rollout concerns, not authorization evidence.
 */
export async function requireAuthorizedDeliveryScope(
  ctx: DeliveryCtx,
  projectId: Id<"projects"> | undefined,
  permission?: CompanyPermission
) {
  if (!projectId) throw new Error("An authorized workspace is required.");
  const project = await ctx.db.get(projectId);
  if (!project?.tenantId) throw new Error("Workspace company assignment is incomplete.");
  return await requireWorkspaceAccess(ctx, project.tenantId, project._id, { permission });
}

export function canAccessDeliveryRecord(
  access: Awaited<ReturnType<typeof requireAuthorizedDeliveryScope>>,
  record: { owningTeamId?: Id<"scrumTeams">; ownerMemberId?: Id<"orgMembers"> }
): boolean {
  if (access.membership.mode === "DEMO" || access.membership.canManageCompany) return true;
  if (access.roleNames.some((name) => /workspace lead|product manager|company|owner|admin/i.test(name))) return true;
  if (record.owningTeamId && access.teamMemberships?.some((membership) => membership.teamId === record.owningTeamId)) return true;
  if (record.ownerMemberId && access.memberProfiles?.some((profile) => profile._id === record.ownerMemberId)) return true;
  return false;
}

export function assertAuthorizedDeliveryRecord(
  access: Awaited<ReturnType<typeof requireAuthorizedDeliveryScope>>,
  record: { owningTeamId?: Id<"scrumTeams">; ownerMemberId?: Id<"orgMembers"> }
) {
  if (!canAccessDeliveryRecord(access, record)) throw new Error("Delivery record is unavailable or unauthorized.");
}

export async function requireAuthorizedDeliveryRecord(
  ctx: DeliveryCtx,
  projectId: Id<"projects"> | undefined,
  record: { owningTeamId?: Id<"scrumTeams">; ownerMemberId?: Id<"orgMembers"> },
  permission?: CompanyPermission
) {
  const access = await requireAuthorizedDeliveryScope(ctx, projectId, permission);
  assertAuthorizedDeliveryRecord(access, record);
  return access;
}
