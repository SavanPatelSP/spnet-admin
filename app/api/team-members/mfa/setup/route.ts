import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage MFA");
    const body = await req.json();
    const { teamMemberId, secret } = body;

    if (!teamMemberId || !secret) {
      return Response.json({ success: false, error: "teamMemberId and secret are required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { mfaSecret: secret, mfaEnabled: true },
    });

    await logAudit(
      AUDIT_ACTIONS.MFA_ENABLED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Enabled MFA for team member ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({ success: true, message: "MFA setup complete" });
  } catch (error) {
    return handleApiError(error);
  }
}
