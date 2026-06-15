import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const member = await prisma.teamMember.update({
      where: { id: body.id },
      data: { roleId: body.roleId },
      include: { role: true },
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
    console.error("Role change error:", error);
    return Response.json({ error: "Failed to change role" }, { status: 500 });
  }
}
