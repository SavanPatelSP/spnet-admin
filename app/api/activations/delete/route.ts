import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function DELETE(req: Request) {
  try {
    const session = await requireApiPermission("Revoke Devices");
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

    await prisma.activation.delete({ where: { id: body.id } });

    await logAudit(
      AUDIT_ACTIONS.ACTIVATION_DELETED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Deleted activation for device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
