import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("View Tickets");
    const { id } = await params;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        license: { select: { key: true, organization: true } },
      },
    });
    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: ticket });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Manage Tickets");
    const { id } = await params;
    const { subject, message, priority, category, status } = await req.json();

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const resolvedFields = status === "RESOLVED" ? { resolvedBy: session.user.name, resolvedAt: new Date() } : {};
    const closedFields = status === "CLOSED" ? { resolvedBy: session.user.name, resolvedAt: new Date() } : {};

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(message !== undefined && { message }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...resolvedFields,
        ...closedFields,
      },
      include: { license: { select: { key: true, organization: true } } },
    });

    const auditAction = status === "RESOLVED" ? AUDIT_ACTIONS.TICKET_RESOLVED
      : status === "CLOSED" ? AUDIT_ACTIONS.TICKET_CLOSED
      : AUDIT_ACTIONS.TICKET_UPDATED;

    await logAudit(
      auditAction,
      null, null, session.user.role, session.user.name,
      `Ticket "${ticket.subject}" updated`,
      session.user.email,
    );

    return Response.json({ success: true, data: ticket });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Manage Tickets");
    const { id } = await params;

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    await prisma.supportTicket.delete({ where: { id } });

    await logAudit(
      AUDIT_ACTIONS.TICKET_CLOSED,
      null, null, session.user.role, session.user.name,
      `Ticket "${existing.subject}" deleted`,
      session.user.email,
    );

    return Response.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
