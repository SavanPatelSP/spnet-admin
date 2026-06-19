import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("Moderate Content");
    const { id } = await params;
    const report = await prisma.moderationReport.findUnique({ where: { id } });
    if (!report) {
      return Response.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: report });
  } catch (e) {
    return handleApiError(e);
  }
}
