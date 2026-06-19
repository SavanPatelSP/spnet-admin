import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requireApiPermission("Moderate Content");
    const reports = await prisma.moderationReport.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: reports });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Moderate Content");
    const { targetType, targetId, reason, description } = await req.json();

    if (!targetType || !targetId || !reason?.trim()) {
      return Response.json({ success: false, error: "Target type, target ID, and reason are required" }, { status: 400 });
    }

    const report = await prisma.moderationReport.create({
      data: {
        targetType,
        targetId,
        reason,
        description,
        reporterId: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.MODERATION_REPORT_CREATED,
      null, null, session.user.role, session.user.name,
      `Report created on ${targetType} ${targetId}: ${reason}`,
      session.user.email,
    );

    return Response.json({ success: true, data: report });
  } catch (e) {
    return handleApiError(e);
  }
}
