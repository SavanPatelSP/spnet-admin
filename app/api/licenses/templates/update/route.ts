import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Manage License Templates");
    const body = await req.json();
    const { id, name, description, plan, maxDevices, durationDays, featureFlags, defaultNotes, isActive } = body;

    if (!id) {
      return Response.json({ error: "Template ID is required" }, { status: 400 });
    }

    const existing = await prisma.licenseTemplate.findUnique({ where: { id } });

    if (!existing) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    const template = await prisma.licenseTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(plan !== undefined && { plan }),
        ...(maxDevices !== undefined && { maxDevices: Number(maxDevices) }),
        ...(durationDays !== undefined && { durationDays: Number(durationDays) }),
        ...(featureFlags !== undefined && { featureFlags: JSON.stringify(featureFlags) }),
        ...(defaultNotes !== undefined && { defaultNotes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TEMPLATE_UPDATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Updated license template "${template.name}"`
    );

    return Response.json(template);
  } catch (error) {
    return handleApiError(error);
  }
}
