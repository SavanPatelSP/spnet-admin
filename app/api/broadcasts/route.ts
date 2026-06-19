import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requireApiPermission("View Broadcasts");
    const broadcasts = await prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: broadcasts });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Create Broadcasts");
    const { subject, message, type, audience, scheduledAt } = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      return Response.json({ success: false, error: "Subject and message are required" }, { status: 400 });
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        subject,
        message,
        type: type || "INFO",
        audience: audience || "ALL",
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: session.user.email,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.BROADCAST_CREATED,
      null, null, session.user.role, session.user.name,
      `Broadcast "${subject}" created`,
      session.user.email,
    );

    return Response.json({ success: true, data: broadcast });
  } catch (e) {
    return handleApiError(e);
  }
}
