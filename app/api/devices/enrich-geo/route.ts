import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { lookupGeo } from "@/lib/geo";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Devices");
    const body = await req.json();

    if (!body.id || !body.ipAddress) {
      return Response.json({ error: "id and ipAddress are required" }, { status: 400 });
    }

    const activation = await prisma.activation.findUnique({
      where: { id: body.id },
      include: { license: true },
    });

    if (!activation) {
      return Response.json({ error: "Activation not found" }, { status: 404 });
    }

    const geo = lookupGeo(body.ipAddress);

    await prisma.activation.update({
      where: { id: body.id },
      data: {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        isp: geo.isp,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_TRUST_UPDATED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Enriched geo data for device ${activation.deviceName || activation.deviceId}: ${geo.country || "Unknown"}`
    );

    return Response.json({ success: true, data: { country: geo.country, region: geo.region, city: geo.city, isp: geo.isp } });
  } catch (error) {
    return handleApiError(error);
  }
}
