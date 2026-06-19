import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("Moderate Content");
    const { id } = await params;
    const action = await prisma.moderationAction.findUnique({ where: { id } });
    if (!action) {
      return Response.json({ success: false, error: "Action not found" }, { status: 404 });
    }
    await prisma.moderationAction.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
