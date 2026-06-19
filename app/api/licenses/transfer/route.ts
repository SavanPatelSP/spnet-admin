import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Transfer Licenses");
    const body = await req.json();
    const { licenseId, newOrganization } = body;

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    if (!newOrganization?.trim()) {
      return Response.json({ error: "New organization is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: {
        organization: newOrganization,
        parentLicenseId: licenseId,
      },
    });

    await prisma.licenseEvent.create({
      data: {
        licenseId,
        type: "TRANSFERRED",
        description: `Transferred from ${license.organization} to ${newOrganization}`,
        performedBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TRANSFERRED,
      licenseId,
      newOrganization,
      session.user.role,
      session.user.name,
      `Transferred license from ${license.organization} to ${newOrganization}`
    );

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
