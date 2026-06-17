import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requirePermission("premium.requests.reject");
    const existing = await prisma.premiumRequest.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Premium request not found" }, { status: 404 });

    if (existing.status !== "PENDING") {
      return Response.json({ error: `Request already ${existing.status.toLowerCase()}` }, { status: 409 });
    }

    const { reviewNotes } = await req.json();

    const updated = await prisma.premiumRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.name,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_REQUEST_REJECTED,
      existing.licenseId,
      existing.organization || undefined,
      session.user.role,
      session.user.name,
      `Premium request ${id} rejected: ${reviewNotes || "No reason given"}`,
      session.user.email
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Premium request reject error:", error);
    return Response.json({ error: "Failed to reject premium request" }, { status: 500 });
  }
}
