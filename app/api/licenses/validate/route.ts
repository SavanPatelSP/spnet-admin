import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, deviceId, deviceName, ipAddress } = body;

    if (!key?.trim()) {
      return Response.json({ valid: false, reason: "License key is required" });
    }

    const license = await prisma.license.findUnique({ where: { key } });

    if (!license) {
      await logAudit(AUDIT_ACTIONS.INVALID_LICENSE_KEY, undefined, undefined, undefined, undefined, `Invalid license key attempted: ${key}`);
      return Response.json({ valid: false, reason: "License key not found" });
    }

    if (license.status !== "ACTIVE") {
      await logAudit(
        license.status === "EXPIRED" ? AUDIT_ACTIONS.LICENSE_EXPIRED_DENIAL : AUDIT_ACTIONS.LICENSE_SUSPENDED_DENIAL,
        license.id,
        license.organization,
        undefined,
        undefined,
        `License ${license.key} is ${license.status.toLowerCase()}`
      );
      return Response.json({ valid: false, reason: `License is ${license.status.toLowerCase()}` });
    }

    if (license.expiresAt < new Date()) {
      await logAudit(
        AUDIT_ACTIONS.LICENSE_EXPIRED_DENIAL,
        license.id,
        license.organization,
        undefined,
        undefined,
        `License ${license.key} has expired`
      );
      return Response.json({ valid: false, reason: "License has expired" });
    }

    let featureFlags: Record<string, unknown> | null = null;
    if (license.featureFlags) {
      try {
        featureFlags = JSON.parse(license.featureFlags);
      } catch {
        featureFlags = null;
      }
    }

    await prisma.licenseEvent.create({
      data: {
        licenseId: license.id,
        type: "VALIDATED",
        description: `License validated${deviceName ? ` for device ${deviceName}` : ""}`,
        metadata: JSON.stringify({ deviceId, deviceName, ipAddress }),
        performedBy: "system",
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_VALIDATED,
      license.id,
      license.organization,
      undefined,
      undefined,
      `License ${license.key} validated successfully`
    );

    return Response.json({
      valid: true,
      license: {
        plan: license.plan,
        organization: license.organization,
        expiresAt: license.expiresAt.toISOString(),
        maxDevices: license.maxDevices,
        featureFlags,
      },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return Response.json({ valid: false, reason: "Validation failed" }, { status: 500 });
  }
}
