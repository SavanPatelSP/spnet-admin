import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Manage Tickets");
    const { id } = await params;
    const { assigneeId } = await req.json();

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo: assigneeId || null,
        status: assigneeId ? "IN_PROGRESS" : ticket.status,
      },
    });

    const assigneeName = assigneeId
      ? (await prisma.teamMember.findUnique({ where: { id: assigneeId }, select: { name: true } }))?.name || assigneeId
      : "unassigned";

    await logAudit(
      AUDIT_ACTIONS.TICKET_ASSIGNED,
      null, null, session.user.role, session.user.name,
      `Ticket "${ticket.subject}" assigned to ${assigneeName}`,
      session.user.email,
    );

    return Response.json({ success: true, data: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
