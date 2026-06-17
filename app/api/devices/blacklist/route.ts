import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Blacklist Devices");
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

    if (activation.isBlacklisted) {
      return Response.json({ success: true, message: "Device is already blacklisted" });
    }

    await prisma.activation.update({
      where: { id: body.id },
      data: { isBlacklisted: true },
    });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_BLACKLISTED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Blacklisted device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true, data: { id: body.id, isBlacklisted: true } });
  } catch (error) {
    console.error("Blacklist device error:", error);
    return Response.json({ error: "Failed to blacklist device" }, { status: 500 });
  }
}
