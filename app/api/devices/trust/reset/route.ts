import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Devices");
    const body = await req.json();

    if (!body.id) {
      return Response.json({ error: "Activation ID is required" }, { status: 400 });
    }

    const activation = await prisma.activation.findUnique({
      where: { id: body.id },
      include: { license: true },
    });

    if (!activation) {
      return Response.json({ error: "Activation not found" }, { status: 404 });
    }

    await prisma.activation.update({
      where: { id: body.id },
      data: { trustScore: 50 },
    });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_TRUST_UPDATED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Reset trust score from ${activation.trustScore} to 50 for device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true, data: { newTrustScore: 50 } });
  } catch (error) {
    return handleApiError(error);
  }
}
