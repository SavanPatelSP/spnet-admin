import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
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
      ADMIN_ROLE,
      ADMIN_NAME,
      `Changed ${member.name}'s role to ${member.role.name}`
    );

    return Response.json(member);
  } catch (error) {
    console.error("Role change error:", error);
    return Response.json({ error: "Failed to change role" }, { status: 500 });
  }
}
