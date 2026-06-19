import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    await requireApiPermission("View Organizations");

    const licenses = await prisma.license.findMany({
      include: { activations: true, coinBalance: true, gemBalance: true, premiumSubscriptions: true },
    });

    const orgMap = licenses.reduce<Record<string, {
      licenseCount: number; activeCount: number; deviceCount: number;
      plans: Set<string>; totalCoins: number; totalGems: number;
      premiumCount: number; licenseIds: string[];
    }>>((acc, l) => {
      const org = l.organization;
      if (!acc[org]) acc[org] = { licenseCount: 0, activeCount: 0, deviceCount: 0, plans: new Set(), totalCoins: 0, totalGems: 0, premiumCount: 0, licenseIds: [] };
      acc[org].licenseCount++;
      if (l.status === "ACTIVE") acc[org].activeCount++;
      acc[org].deviceCount += l.activations.length;
      acc[org].plans.add(l.plan);
      acc[org].totalCoins += l.coinBalance?.balance || 0;
      acc[org].totalGems += l.gemBalance?.balance || 0;
      acc[org].premiumCount += l.premiumSubscriptions.length;
      acc[org].licenseIds.push(l.id);
      return acc;
    }, {});

    const orgs = Object.entries(orgMap).map(([name, data]) => ({
      name,
      licenseCount: data.licenseCount,
      activeCount: data.activeCount,
      deviceCount: data.deviceCount,
      plans: [...data.plans].join(", "),
      totalCoins: data.totalCoins,
      totalGems: data.totalGems,
      premiumCount: data.premiumCount,
      licenseIds: data.licenseIds,
    }));

    return Response.json({ success: true, data: orgs });
  } catch (e) {
    return handleApiError(e);
  }
}
