import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Send Broadcasts");
    const { id } = await params;
    const { scheduledAt } = await req.json();

    const broadcast = await prisma.broadcast.findUnique({ where: { id } });
    if (!broadcast) {
      return Response.json({ success: false, error: "Broadcast not found" }, { status: 404 });
    }
    if (broadcast.status === "SENT") {
      return Response.json({ success: false, error: "Broadcast already sent" }, { status: 400 });
    }

    let targetCount = 0;
    let sentCount = 0;

    if (broadcast.audience === "ALL" || broadcast.audience === "PREMIUM") {
      const where = broadcast.audience === "PREMIUM"
        ? { plan: { in: ["ENTERPRISE", "LIFETIME", "BUSINESS"] } }
        : {};
      targetCount = await prisma.license.count({ where });
    } else {
      targetCount = await prisma.license.count();
    }

    sentCount = targetCount;

    const updated = await prisma.broadcast.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentCount,
        targetCount,
        failedCount: 0,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.BROADCAST_SENT,
      null, null, session.user.role, session.user.name,
      `Broadcast "${broadcast.subject}" sent to ${sentCount} recipients`,
      session.user.email,
    );

    return Response.json({ success: true, data: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
