import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { approvalGuard } from "@/lib/approval-guard";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Change Member Roles");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "Member ID is required" }, { status: 400 });
    }
    const existing = await prisma.teamMember.findUnique({ where: { id: body.id }, include: { role: { select: { name: true } } } });
    if (!existing) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }

    const guard = await approvalGuard(session, {
      workflowType: "TEAM_CHANGE_ROLE",
      title: `Change Role for ${existing.name}`,
      target: existing.name,
      reason: body.reason || `Change role for ${existing.name}`,
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const member = await prisma.teamMember.update({
      where: { id: body.id },
      data: { roleId: body.roleId },
      include: { role: { select: { name: true } } },
    });

    await prisma.session.updateMany({
      where: {
        teamMemberId: body.id,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    await logAudit(
      AUDIT_ACTIONS.TEAM_MEMBER_ROLE_CHANGED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Changed ${member.name}'s role to ${member.role.name}`
    );

    return Response.json(member);
  } catch (error) {
    return handleApiError(error);
  }
}
