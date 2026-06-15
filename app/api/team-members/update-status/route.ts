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
    console.error("Status update error:", error);
    return Response.json({ error: "Failed to update status" }, { status: 500 });
  }
}
