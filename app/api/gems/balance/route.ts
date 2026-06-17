import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("View Gem Balances");
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
    console.error("Gems balance error:", error);
    return Response.json({ error: "Failed to fetch gem balances" }, { status: 500 });
  }
}
