import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Premium History");

    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    const where = licenseId ? { licenseId } : {};

    const records = await prisma.premiumSubscription.findMany({
      where,
      include: {
        license: {
          select: { organization: true, key: true, plan: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(records);
  } catch (error) {
    return handleApiError(error);
  }
}
