import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Moderate Content");
    const { id } = await params;
    const { status, actionTaken, reason, targetType, targetId, durationDays } = await req.json();

    const report = await prisma.moderationReport.findUnique({ where: { id } });
    if (!report) {
      return Response.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const resolved = await prisma.moderationReport.update({
      where: { id },
      data: {
        status: status || "RESOLVED",
        actionTaken: actionTaken || null,
        resolvedBy: session.user.name,
        resolvedAt: new Date(),
      },
    });

    if (actionTaken && actionTaken !== "NONE" && targetType && targetId) {
      const expiresAt = durationDays
        ? new Date(Date.now() + durationDays * 86400000)
        : null;

      await prisma.moderationAction.create({
        data: {
          targetType,
          targetId,
          actionType: actionTaken,
          reason: reason || "Moderator action",
          durationDays: durationDays || null,
          expiresAt,
          performedBy: session.user.name,
          reportId: id,
        },
      });

      if (targetType === "LICENSE") {
        const license = await prisma.license.findUnique({ where: { id: targetId } });
        if (license) {
          if (actionTaken === "SUSPENSION") {
            await prisma.license.update({
              where: { id: targetId },
              data: { status: "SUSPENDED", notes: license.notes
                ? `${license.notes}\n[SUSPENDED by ${session.user.name}: ${reason || "Moderator action"}]`
                : `[SUSPENDED by ${session.user.name}: ${reason || "Moderator action"}]` },
            });
          } else if (actionTaken === "REINSTATEMENT") {
            await prisma.license.update({
              where: { id: targetId },
              data: { status: "ACTIVE", notes: license.notes
                ? `${license.notes}\n[REINSTATED by ${session.user.name}: ${reason || "Moderator action"}]`
                : `[REINSTATED by ${session.user.name}: ${reason || "Moderator action"}]` },
            });
          } else if (actionTaken === "BAN") {
            await prisma.license.update({
              where: { id: targetId },
              data: { status: "REVOKED", notes: license.notes
                ? `${license.notes}\n[BANNED by ${session.user.name}: ${reason || "Moderator action"}]`
                : `[BANNED by ${session.user.name}: ${reason || "Moderator action"}]` },
            });
          }
        }
      }
    }

    await logAudit(
      AUDIT_ACTIONS.MODERATION_REPORT_RESOLVED,
      null, null, session.user.role, session.user.name,
      `Report ${id} resolved - ${actionTaken || "No action"}`,
      session.user.email,
    );

    return Response.json({ success: true, data: resolved });
  } catch (e) {
    return handleApiError(e);
  }
}
