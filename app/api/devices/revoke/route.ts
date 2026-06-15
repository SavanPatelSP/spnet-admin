import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const activation = await prisma.activation.findUnique({
      where: { id: body.id },
      include: { license: true },
    });

    if (!activation) {
      return Response.json({ error: "Activation not found" }, { status: 404 });
    }

    await prisma.activation.delete({ where: { id: body.id } });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_REVOKED,
      activation.license.id,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Revoked device ${activation.deviceName || activation.deviceId} from license ${activation.license.key}`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Device revoke error:", error);
    return Response.json({ error: "Failed to revoke device" }, { status: 500 });
  }
}
