import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Whitelist Devices");
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

    if (!activation.isBlacklisted) {
      return Response.json({ success: true, message: "Device is not blacklisted" });
    }

    await prisma.activation.update({
      where: { id: body.id },
      data: { isBlacklisted: false },
    });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_WHITELISTED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Whitelisted device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true, data: { id: body.id, isBlacklisted: false } });
  } catch (error) {
    return handleApiError(error);
  }
}
