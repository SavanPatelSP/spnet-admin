import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { daysUntil } from "@/lib/shared";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View License Usage");
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const org = url.searchParams.get("org");

    if (!id && !org) {
      return Response.json({ error: "License ID or organization is required" }, { status: 400 });
    }

    const where = id ? { id } : { organization: org! };

    const license = await prisma.license.findFirst({
      where,
      include: {
        activations: { select: { id: true, deviceId: true, deviceName: true } },
        coinBalance: { select: { balance: true, isInfinite: true } },
        gemBalance: { select: { balance: true, isInfinite: true } },
      },
    });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const totalActivations = license.activations.length;
    const devicesUsed = new Set(license.activations.map((a) => a.deviceId)).size;

    const usage = {
      totalActivations,
      devicesUsed,
      maxDevices: license.maxDevices,
      daysUntilExpiry: daysUntil(license.expiresAt),
      plan: license.plan,
      isPremium: ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(license.plan),
      coins: {
        balance: license.coinBalance?.balance ?? 0,
        isInfinite: license.coinBalance?.isInfinite ?? false,
      },
      gems: {
        balance: license.gemBalance?.balance ?? 0,
        isInfinite: license.gemBalance?.isInfinite ?? false,
      },
    };

    return Response.json(usage);
  } catch (error) {
    return handleApiError(error);
  }
}
