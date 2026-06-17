import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("View Coin Balances");
    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    if (licenseId) {
      const balance = await prisma.coinBalance.findUnique({
        where: { licenseId },
        include: { license: { select: { organization: true, key: true } } },
      });
      return Response.json(balance || { licenseId, balance: 0 });
    }

    const allBalances = await prisma.coinBalance.findMany({
      include: { license: { select: { organization: true, key: true, plan: true } } },
      orderBy: { balance: "desc" },
    });
    return Response.json(allBalances);
  } catch (error) {
    console.error("Coins balance error:", error);
    return Response.json({ error: "Failed to fetch balances" }, { status: 500 });
  }
}
