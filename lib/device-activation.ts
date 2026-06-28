import { prisma } from "@/lib/prisma";
import { resolveGeoFromApi } from "@/lib/geo";
import { captureFingerprint } from "@/lib/security/fingerprint";
import { createSecurityAlert } from "@/lib/security/alerts";

export async function handlePostLoginActivation(
  member: { id: string; name: string | null; email: string; licenseId: string },
  ipAddress: string,
  userAgent: string,
) {
  try {
    const deviceId = `device-${member.id}-${member.licenseId}`;
    const existingActivation = await prisma.activation.findFirst({ where: { deviceId } });

    const os = userAgent.includes("Windows") ? "Windows"
      : userAgent.includes("Mac") ? "macOS"
      : userAgent.includes("Linux") ? "Linux"
      : userAgent.includes("Android") ? "Android"
      : userAgent.includes("iOS") ? "iOS"
      : "Unknown";
    const osVersion = userAgent.match(/(?:Windows NT |Mac OS X |Android )([\d._]+)/)?.[1]?.replace(/_/g, ".") ?? null;
    const browser = userAgent.includes("Chrome") ? "Chrome"
      : userAgent.includes("Firefox") ? "Firefox"
      : userAgent.includes("Safari") && !userAgent.includes("Chrome") ? "Safari"
      : userAgent.includes("Edge") ? "Edge"
      : "Unknown";
    const browserVersion = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/([\d.]+)/)?.[1] ?? null;
    const deviceType = userAgent.includes("Mobile") ? "MOBILE"
      : userAgent.includes("Tablet") || userAgent.includes("iPad") ? "TABLET"
      : "DESKTOP";
    const geo = await resolveGeoFromApi(ipAddress);

    if (existingActivation) {
      await prisma.activation.update({
        where: { id: existingActivation.id },
        data: {
          ipAddress, os, osVersion, browser, browserVersion, deviceType, userAgent,
          country: geo.country, city: geo.city, isp: geo.isp,
          lastSeenAt: new Date(),
          trustScore: Math.min(100, existingActivation.trustScore + 5),
        },
      });
    } else {
      await prisma.activation.create({
        data: {
          deviceId,
          deviceName: `${member.name || member.email}'s ${os} device`,
          licenseId: member.licenseId, ipAddress, os, osVersion, browser, browserVersion,
          deviceType, userAgent,
          country: geo.country, city: geo.city, isp: geo.isp,
          trustScore: 50, status: "ACTIVE",
        },
      });
    }
  } catch {
    // Best-effort activation tracking
  }
}

export async function handleFingerprintCheck(
  ipAddress: string,
  userAgent: string,
  teamMemberId: string,
  sessionRecordId: string,
  email: string,
  memberName: string | null,
) {
  try {
    const fpResult = await captureFingerprint({
      ipAddress,
      userAgent,
      teamMemberId,
      sessionId: sessionRecordId,
    });
    if (fpResult.suspicious) {
      await createSecurityAlert({
        type: "SUSPICIOUS_ACTIVITY",
        title: "Suspicious session detected",
        description: `Suspicious login for ${email}: ${fpResult.riskFactors.join(", ")}`,
        severity: fpResult.riskScore === "CRITICAL" ? "CRITICAL" : fpResult.riskScore === "HIGH" ? "HIGH" : "MEDIUM",
        entityType: "session",
        entityId: sessionRecordId,
        actorEmail: email,
        actorName: memberName ?? undefined,
        metadata: {
          riskScore: fpResult.riskScore,
          riskFactors: fpResult.riskFactors,
          isNewDevice: fpResult.isNewDevice,
          isNewCountry: fpResult.isNewCountry,
          ipChanged: fpResult.ipChanged,
        },
      });
    }
  } catch {
    // Best-effort fingerprint check
  }
}
