import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { lookupGeo } from "@/lib/geo";

export async function POST() {
  try {
    const session = await requireApiPermission("Manage Devices");

    const activations = await prisma.activation.findMany({
      where: {
        ipAddress: { not: null },
        country: null,
      },
      include: { license: true },
    });

    let enriched = 0;
    for (const activation of activations) {
      if (!activation.ipAddress) continue;
      const geo = lookupGeo(activation.ipAddress);
      if (geo.country) {
        await prisma.activation.update({
          where: { id: activation.id },
          data: {
            country: geo.country,
            city: geo.city,
            isp: geo.isp,
          },
        });
        enriched++;
      }
    }

    await logAudit(
      AUDIT_ACTIONS.DEVICE_TRUST_UPDATED,
      null,
      null,
      session.user.role,
      session.user.name,
      `Batch enriched geo data for ${enriched} devices`
    );

    return Response.json({ success: true, data: { enriched } });
  } catch (error) {
    return handleApiError(error);
  }
}
