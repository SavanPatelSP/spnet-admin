import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireApiPermission("premium.requests.convert");
    const existing = await prisma.premiumRequest.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Premium request not found" }, { status: 404 });

    if (existing.status !== "PENDING") {
      return Response.json({ error: `Request already ${existing.status.toLowerCase()}` }, { status: 409 });
    }

    return Response.json({
      message: "Ready to convert",
      request: existing,
      hint: "POST to /api/premium/requests/:id/approve to complete the conversion",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
