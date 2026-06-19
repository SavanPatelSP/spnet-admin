import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Remove Team Members");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "Member ID is required" }, { status: 400 });
    }
    const member = await prisma.teamMember.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    await logAudit(
      body.status === "ACTIVE" ? AUDIT_ACTIONS.TEAM_MEMBER_REACTIVATED : AUDIT_ACTIONS.TEAM_MEMBER_SUSPENDED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `${body.status === "ACTIVE" ? "Reactivated" : "Suspended"} team member ${member.name}`
    );

    return Response.json(member);
  } catch (error) {
    return handleApiError(error);
  }
}
