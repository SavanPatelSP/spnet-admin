import { createApprovalRequest, type WorkflowType } from "@/lib/approval";
import type { AuthSession } from "@/lib/auth-helpers";

const OWNER_OR_SUPERADMIN = ["OWNER", "SUPER_ADMIN"];

export function isOwnerOrSuperAdmin(session: AuthSession): boolean {
  return OWNER_OR_SUPERADMIN.includes(session.user.role);
}

interface GuardOptions {
  workflowType: WorkflowType;
  title: string;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  target: string;
  reason?: string;
  payload: Record<string, unknown>;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export async function approvalGuard(session: AuthSession, opts: GuardOptions) {
  if (isOwnerOrSuperAdmin(session)) {
    return { allowed: true as const };
  }

  const request = await createApprovalRequest({
    workflowType: opts.workflowType,
    title: opts.title,
    reason: opts.reason || "No reason provided",
    metadata: {
      _actionType: opts.workflowType,
      _target: opts.target,
      ...opts.payload,
    },
    requesterId: opts.requesterId,
    requesterName: opts.requesterName,
    requesterEmail: opts.requesterEmail,
    priority: opts.priority || "MEDIUM",
  });

  return {
    allowed: false as const,
    requestId: request.id,
    message: "Approval request submitted",
  };
}
