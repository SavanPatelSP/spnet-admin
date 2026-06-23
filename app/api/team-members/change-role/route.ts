import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Change Member Roles");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "Member ID is required" }, { status: 400 });
    }
    const member = await prisma.teamMember.update({
      where: { id: body.id },
      data: { roleId: body.roleId },
      include: { role: true },
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
