import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { resolveGeoFromApi } from "@/lib/geo";

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
    const seenIps = new Set<string>();
    for (const activation of activations) {
      if (!activation.ipAddress || seenIps.has(activation.ipAddress)) continue;
      seenIps.add(activation.ipAddress);
      const geo = await resolveGeoFromApi(activation.ipAddress);
      if (geo.country) {
        await prisma.activation.updateMany({
          where: { ipAddress: activation.ipAddress, country: null },
          data: {
            country: geo.country,
            city: geo.city,
            isp: geo.isp,
          },
        });
        enriched += 1;
      }
      await new Promise((r) => setTimeout(r, 200));
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
