import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Sessions");
    const body = await req.json();
    const { sessionId, teamMemberId, revokeDevices } = body;

    if (!sessionId && !teamMemberId) {
      return Response.json({ success: false, error: "Session ID or Team Member ID is required" }, { status: 400 });
    }

    let targetEmail = "unknown";
    let deletedCount = 0;

    if (sessionId) {
      const existing = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teamMember: { select: { email: true, id: true } } },
      });
      if (!existing) {
        return Response.json({ success: false, error: "Session not found" }, { status: 404 });
      }
      targetEmail = existing.teamMember?.email || targetEmail;
      await prisma.session.delete({ where: { id: sessionId } });
      deletedCount = 1;

      if (revokeDevices && existing.teamMember?.id) {
        await prisma.activation.updateMany({
          where: { license: { teamMember: { id: existing.teamMember.id } }, status: "ACTIVE" },
          data: { status: "INACTIVE" },
        });
      }
    } else if (teamMemberId) {
      const member = await prisma.teamMember.findUnique({
        where: { id: teamMemberId },
        select: { email: true },
      });
      if (!member) {
        return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
      }
      targetEmail = member.email;
      const result = await prisma.session.deleteMany({ where: { teamMemberId } });
      deletedCount = result.count;

      if (revokeDevices) {
        await prisma.activation.updateMany({
          where: { license: { teamMember: { id: teamMemberId } }, status: "ACTIVE" },
          data: { status: "INACTIVE" },
        });
      }
    }

    await logAudit(
      AUDIT_ACTIONS.FORCE_LOGOUT,
      null,
      null,
      session.user.role,
      session.user.name,
      `Force logout for ${targetEmail} (${deletedCount} session${deletedCount === 1 ? "" : "s"} revoked${revokeDevices ? " + devices deactivated" : ""})`,
      session.user.email,
    );

    return Response.json({ success: true, deletedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
