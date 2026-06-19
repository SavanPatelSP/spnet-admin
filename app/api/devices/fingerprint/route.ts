import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("View Device Fingerprints");
    const body = await req.json();

    if (!body.activationId || !body.fingerprint) {
      return Response.json({ error: "activationId and fingerprint are required" }, { status: 400 });
    }

    const activation = await prisma.activation.findUnique({
      where: { id: body.activationId },
      include: { license: true },
    });

    if (!activation) {
      return Response.json({ error: "Activation not found" }, { status: 404 });
    }

    const confidenceScore = body.confidenceScore !== undefined ? parseInt(body.confidenceScore) : 75;
    const now = new Date();

    const fingerprint = await prisma.deviceFingerprint.upsert({
      where: { activationId: body.activationId },
      update: {
        fingerprint: body.fingerprint,
        confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
        lastSeen: now,
      },
      create: {
        activationId: body.activationId,
        fingerprint: body.fingerprint,
        confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
        firstSeen: now,
        lastSeen: now,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.DEVICE_FINGERPRINT_REGISTERED,
      activation.licenseId,
      activation.license.organization,
      session.user.role,
      session.user.name,
      `Registered fingerprint for device ${activation.deviceName || activation.deviceId}`
    );

    return Response.json({ success: true, data: fingerprint });
  } catch (error) {
    return handleApiError(error);
  }
}
