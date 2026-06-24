import { prisma } from "@/lib/prisma";

type WorkflowType =
  | "PREMIUM_GRANT" | "PREMIUM_EXTEND" | "PREMIUM_REVOKE" | "PREMIUM_PLAN_CHANGE"
  | "PREMIUM_LIFETIME_CONVERT" | "PREMIUM_CUSTOM_CONVERT"
  | "COINS_GRANT" | "COINS_REMOVE" | "COINS_SET"
  | "GEMS_GRANT" | "GEMS_REMOVE" | "GEMS_SET"
  | "LICENSE_CREATE" | "LICENSE_DELETE" | "LICENSE_TRANSFER" | "LICENSE_BULK"
  | "USER_BAN" | "USER_SUSPEND" | "USER_DELETE" | "USER_VERIFICATION"
  | "ROLE_CREATE" | "ROLE_DELETE" | "ROLE_PERMISSION_CHANGE"
  | "TEAM_CREATE" | "TEAM_EDIT" | "TEAM_DELETE" | "TEAM_ROLE_CHANGE" | "OWNERSHIP_TRANSFER"
  | "ORG_CREATE" | "ORG_EDIT" | "ORG_DELETE";

interface ApprovalInput {
  workflowType: WorkflowType;
  title: string;
  description?: string;
  reason: string;
  metadata?: Record<string, unknown>;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expiresAt?: Date;
}

export async function createApprovalRequest(input: ApprovalInput) {
  const request = await prisma.approvalRequest.create({
    data: {
      workflowType: input.workflowType,
      title: input.title,
      description: input.description,
      reason: input.reason,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      priority: input.priority || "MEDIUM",
      expiresAt: input.expiresAt,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: `APPROVAL_REQUEST_CREATED`,
      severity: "MEDIUM",
      entityType: "approval_request",
      entityId: request.id,
      actorEmail: input.requesterEmail || "system",
      actorName: input.requesterName || "System",
      description: `Approval request created: ${input.title} (${input.workflowType})`,
      metadata: JSON.stringify({ workflowType: input.workflowType }),
    },
  });

  return request;
}

export async function approveRequest(
  id: string,
  approverId: string,
  approverName?: string,
  approverEmail?: string,
  note?: string,
) {
  const request = await prisma.approvalRequest.update({
    where: { id, status: "PENDING" },
    data: {
      status: "APPROVED",
      approverId,
      approverName,
      approverEmail,
      approvalNote: note,
      reviewedAt: new Date(),
      executedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: `APPROVAL_REQUEST_APPROVED`,
      severity: "MEDIUM",
      entityType: "approval_request",
      entityId: request.id,
      actorEmail: approverEmail || "system",
      actorName: approverName || "System",
      description: `Approval request approved: ${request.title}`,
      metadata: JSON.stringify({ workflowType: request.workflowType, note }),
    },
  });

  return request;
}

export async function rejectRequest(
  id: string,
  approverId: string,
  approverName?: string,
  approverEmail?: string,
  note?: string,
) {
  const request = await prisma.approvalRequest.update({
    where: { id, status: "PENDING" },
    data: {
      status: "REJECTED",
      approverId,
      approverName,
      approverEmail,
      approvalNote: note,
      reviewedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: `APPROVAL_REQUEST_REJECTED`,
      severity: "MEDIUM",
      entityType: "approval_request",
      entityId: request.id,
      actorEmail: approverEmail || "system",
      actorName: approverName || "System",
      description: `Approval request rejected: ${request.title}`,
      metadata: JSON.stringify({ workflowType: request.workflowType, note }),
    },
  });

  return request;
}

export async function getApprovalRequests(options: {
  status?: string;
  workflowType?: string;
  requesterId?: string;
  approverId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (options.status) where.status = options.status;
  if (options.workflowType) where.workflowType = options.workflowType;
  if (options.requesterId) where.requesterId = options.requesterId;
  if (options.approverId) where.approverId = options.approverId;

  const [requests, total] = await Promise.all([
    prisma.approvalRequest.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.approvalRequest.count({ where: where as any }),
  ]);
  return { requests, total };
}

export async function getApprovalStats() {
  const [pending, approved, rejected, typeCounts] = await Promise.all([
    prisma.approvalRequest.count({ where: { status: "PENDING" } }),
    prisma.approvalRequest.count({ where: { status: "APPROVED" } }),
    prisma.approvalRequest.count({ where: { status: "REJECTED" } }),
    prisma.approvalRequest.groupBy({ by: ["workflowType"], _count: true }),
  ]);
  return { pending, approved, rejected, typeCounts };
}

export async function cancelApprovalRequest(id: string) {
  return prisma.approvalRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}
