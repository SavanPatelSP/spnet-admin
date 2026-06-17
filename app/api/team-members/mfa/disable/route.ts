import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage MFA");
    const body = await req.json();
    const { teamMemberId } = body;

    if (!teamMemberId) {
      return Response.json({ success: false, error: "teamMemberId is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { mfaSecret: null, mfaEnabled: false },
    });

    await logAudit(
      AUDIT_ACTIONS.MFA_DISABLED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Disabled MFA for team member ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({ success: true, message: "MFA disabled" });
  } catch (error) {
    console.error("MFA disable error:", error);
    return Response.json({ success: false, error: "Failed to disable MFA" }, { status: 500 });
  }
}
