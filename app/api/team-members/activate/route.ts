import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Edit Users");
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    await prisma.teamMember.update({
      where: { id },
      data: { status: "ACTIVE", failedLoginAttempts: 0, lockedUntil: null },
    });

    await logAudit(
      AUDIT_ACTIONS.ACCOUNT_ACTIVATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Activated account for ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({ success: true, message: "Account activated" });
  } catch (error) {
    return handleApiError(error);
  }
}
