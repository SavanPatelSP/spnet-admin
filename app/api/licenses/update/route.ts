import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseExpiryDate } from "@/lib/shared";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE, DEFAULT_EXPIRY_YEAR } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, organization, plan, status, maxDevices, expiresAt, notes } = body;

    if (!id) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    const expiryDate = expiresAt
      ? parseExpiryDate(expiresAt)
      : new Date(DEFAULT_EXPIRY_YEAR, 11, 31, 12, 0, 0);

    const license = await prisma.license.update({
      where: { id },
      data: {
        organization,
        plan,
        status,
        maxDevices: Number(maxDevices),
        expiresAt: expiryDate,
        notes,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_UPDATED,
      license.id,
      license.organization,
      ADMIN_ROLE,
      ADMIN_NAME,
      `Updated license for ${license.organization}`
    );

    return Response.json(license);
  } catch (error) {
    console.error("License update error:", error);
    return Response.json({ error: "Failed to update license" }, { status: 500 });
  }
}
