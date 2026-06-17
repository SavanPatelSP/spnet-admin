import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function DELETE(req: Request) {
  try {
    const session = await requirePermission("Remove Team Members");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "Member ID is required" }, { status: 400 });
    }
    const member = await prisma.teamMember.findUnique({ where: { id: body.id } });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.teamMember.delete({ where: { id: body.id } });

    await logAudit(
      AUDIT_ACTIONS.TEAM_MEMBER_DELETED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Deleted team member ${member.name} (${member.email})`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Team member delete error:", error);
    return Response.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
