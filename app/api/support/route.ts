import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requirePermission("View Tickets");
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: { notes: true, license: { select: { key: true, organization: true } } },
    });
    return Response.json({ success: true, data: tickets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch tickets";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage Tickets");
    const { subject, message, priority, category, licenseId } = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      return Response.json({ success: false, error: "Subject and message are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        message,
        priority: priority || "MEDIUM",
        category: category || "GENERAL",
        licenseId: licenseId || null,
        createdBy: session.user.name,
      },
      include: { license: { select: { key: true, organization: true } } },
    });

    await logAudit(
      AUDIT_ACTIONS.TICKET_CREATED,
      licenseId, null, session.user.role, session.user.name,
      `Ticket "${subject}" created`,
      session.user.email,
    );

    return Response.json({ success: true, data: ticket });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create ticket";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
