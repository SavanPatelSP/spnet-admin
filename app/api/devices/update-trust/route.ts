import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Update Device Trust");
    const body = await req.json();

    if (!body.id || body.trustScore === undefined || body.trustScore === null) {
      return Response.json({ error: "id and trustScore are required" }, { status: 400 });
    }

    const trustScore = parseInt(body.trustScore);
    if (isNaN(trustScore) || trustScore < 0 || trustScore > 100) {
      return Response.json({ error: "trustScore must be a number between 0 and 100" }, { status: 400 });
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
      data: { trustScore },
    });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_TRUST_UPDATED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Updated trust score to ${trustScore} for device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true, data: { id: body.id, trustScore } });
  } catch (error) {
    return handleApiError(error);
  }
}
