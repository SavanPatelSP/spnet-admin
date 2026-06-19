import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Manage Tickets");
    const { id } = await params;
    const { note, isInternal } = await req.json();

    if (!note?.trim()) {
      return Response.json({ success: false, error: "Note content is required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    const supportNote = await prisma.supportNote.create({
      data: {
        ticketId: id,
        note,
        isInternal: isInternal !== false,
        createdBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.TICKET_NOTE_ADDED,
      null, null, session.user.role, session.user.name,
      `Note added to ticket "${ticket.subject}"`,
      session.user.email,
    );

    return Response.json({ success: true, data: supportNote });
  } catch (e) {
    return handleApiError(e);
  }
}
