import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Gem Balances");
    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    if (licenseId) {
      const balance = await prisma.gemBalance.findUnique({
        where: { licenseId },
        include: { license: { select: { organization: true, key: true } } },
      });
      return Response.json(balance || { licenseId, balance: 0 });
    }

    const allBalances = await prisma.gemBalance.findMany({
      include: { license: { select: { organization: true, key: true, plan: true } } },
      orderBy: { balance: "desc" },
    });
    return Response.json(allBalances);
  } catch (error) {
    return handleApiError(error);
  }
}
