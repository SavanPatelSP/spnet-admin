import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requirePermission("Manage Device Policies");

    const url = new URL(req.url);
    const licenseId = url.searchParams.get("licenseId");
    if (!licenseId) {
      return Response.json({ error: "licenseId is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      select: { id: true, maxDevices: true, key: true, organization: true },
    });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const activeCount = await prisma.activation.count({
      where: { licenseId, isBlacklisted: false },
    });

    return Response.json({
      success: true,
      data: {
        licenseId: license.id,
        licenseKey: license.key,
        organization: license.organization,
        activeDevices: activeCount,
        maxDevices: license.maxDevices,
        available: Math.max(0, license.maxDevices - activeCount),
        percentageUsed: license.maxDevices > 0 ? Math.round((activeCount / license.maxDevices) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Session enforcement error:", error);
    return Response.json({ error: "Failed to check session enforcement" }, { status: 500 });
  }
}
