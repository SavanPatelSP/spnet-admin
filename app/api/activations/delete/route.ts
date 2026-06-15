import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function DELETE(req: Request) {
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
      AUDIT_ACTIONS.ACTIVATION_DELETED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Deleted activation for device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Activation delete error:", error);
    return Response.json({ error: "Failed to delete activation" }, { status: 500 });
  }
}
