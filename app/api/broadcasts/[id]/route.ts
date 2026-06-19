import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Create Broadcasts");
    const { id } = await params;
    const { subject, message, type, audience, scheduledAt, status } = await req.json();

    const existing = await prisma.broadcast.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ success: false, error: "Broadcast not found" }, { status: 404 });
    }
    if (existing.status === "SENT") {
      return Response.json({ success: false, error: "Cannot modify a sent broadcast" }, { status: 400 });
    }

    const broadcast = await prisma.broadcast.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(message !== undefined && { message }),
        ...(type !== undefined && { type }),
        ...(audience !== undefined && { audience }),
        ...(status !== undefined && { status }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      },
    });

    await logAudit(
      AUDIT_ACTIONS.BROADCAST_UPDATED,
      null, null, session.user.role, session.user.name,
      `Broadcast "${broadcast.subject}" updated`,
      session.user.email,
    );

    return Response.json({ success: true, data: broadcast });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Delete Broadcasts");
    const { id } = await params;

    const existing = await prisma.broadcast.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ success: false, error: "Broadcast not found" }, { status: 404 });
    }

    await prisma.broadcast.delete({ where: { id } });

    await logAudit(
      AUDIT_ACTIONS.BROADCAST_DELETED,
      null, null, session.user.role, session.user.name,
      `Broadcast "${existing.subject}" deleted`,
      session.user.email,
    );

    return Response.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
