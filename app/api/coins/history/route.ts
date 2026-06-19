import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Coin History");
    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    const where = licenseId ? { licenseId } : {};

    const transactions = await prisma.coinTransaction.findMany({
      where,
      include: {
        license: { select: { organization: true, key: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}
