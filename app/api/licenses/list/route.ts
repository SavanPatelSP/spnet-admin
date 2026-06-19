import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    await requireApiPermission("View Licenses");
    const licenses = await prisma.license.findMany({
      select: { id: true, key: true, organization: true },
      orderBy: { organization: "asc" },
    });
    return Response.json(licenses);
  } catch (error) {
    return handleApiError(error);
  }
}
