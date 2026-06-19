import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { parseExpiryDate } from "@/lib/shared";
import { AUDIT_ACTIONS, DEFAULT_EXPIRY_YEAR } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Edit Licenses");
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
      session.user.role,
      session.user.name,
      `Updated license for ${license.organization}`
    );

    return Response.json(license);
  } catch (error) {
    return handleApiError(error);
  }
}
