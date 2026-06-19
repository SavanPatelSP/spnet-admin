import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.licenseKey || !body.deviceId) {
      return Response.json(
        { valid: false, reason: "licenseKey and deviceId are required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { key: body.licenseKey },
    });

    if (!license) {
      await logAudit(AUDIT_ACTIONS.INVALID_LICENSE_KEY, null, null, null, null, `Invalid license key: ${body.licenseKey}`);
      return Response.json({ valid: false, reason: "License key not found" });
    }

    if (license.status !== "ACTIVE") {
      await logAudit(
        AUDIT_ACTIONS.INVALID_LICENSE_KEY,
        license.id,
        license.organization,
        null,
        null,
        `License ${license.key} is ${license.status.toLowerCase()}`
      );
      return Response.json({ valid: false, reason: `License is ${license.status.toLowerCase()}` });
    }

    if (license.expiresAt < new Date()) {
      await logAudit(
        AUDIT_ACTIONS.INVALID_LICENSE_KEY,
        license.id,
        license.organization,
        null,
        null,
        `License ${license.key} has expired`
      );
      return Response.json({ valid: false, reason: "License has expired" });
    }

    const activeCount = await prisma.activation.count({
      where: { licenseId: license.id, status: { in: ["ACTIVE"] } },
    });

    if (activeCount >= license.maxDevices) {
      const isExisting = await prisma.activation.findFirst({
        where: { licenseId: license.id, deviceId: body.deviceId },
      });
      if (!isExisting) {
        await logAudit(
          AUDIT_ACTIONS.INVALID_LICENSE_KEY,
          license.id,
          license.organization,
          null,
          null,
          `Max devices (${license.maxDevices}) exceeded for license ${license.key}`
        );
        return Response.json({ valid: false, reason: "Maximum number of devices reached" });
      }
    }

    const existing = await prisma.activation.findFirst({
      where: { licenseId: license.id, deviceId: body.deviceId },
    });

    if (existing && existing.status === "BLACKLISTED") {
      return Response.json({ valid: false, reason: "Device is blacklisted" });
    }

    if (existing && existing.status === "SUSPENDED") {
      return Response.json({ valid: false, reason: "Device is suspended" });
    }

    const now = new Date();
    const activation = existing
      ? await prisma.activation.update({
          where: { id: existing.id },
          data: {
            deviceName: body.deviceName ?? existing.deviceName,
            ipAddress: body.ipAddress ?? existing.ipAddress,
            os: body.os ?? existing.os,
            browser: body.browser ?? existing.browser,
            browserVersion: body.browserVersion ?? existing.browserVersion,
            deviceType: body.deviceType ?? existing.deviceType,
            lastSeenAt: now,
            status: existing.status === "INACTIVE" ? "ACTIVE" : existing.status,
          },
        })
      : await prisma.activation.create({
          data: {
            licenseId: license.id,
            deviceId: body.deviceId,
            deviceName: body.deviceName,
            ipAddress: body.ipAddress,
            os: body.os,
            browser: body.browser,
            browserVersion: body.browserVersion,
            deviceType: body.deviceType,
            lastSeenAt: now,
            status: "ACTIVE",
          },
        });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_VALIDATED,
      license.id,
      license.organization,
      null,
      null,
      `Device ${body.deviceName || body.deviceId} validated for license ${license.key}`
    );

    return Response.json({ valid: true, data: { activationId: activation.id } });
  } catch (error) {
    console.error("Device validation error:", error);
    return Response.json({ valid: false, reason: "Validation failed" }, { status: 500 });
  }
}
