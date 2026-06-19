import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function DELETE(req: Request) {
  try {
    const session = await requireApiPermission("Manage License Templates");
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: "Template ID is required" }, { status: 400 });
    }

    const template = await prisma.licenseTemplate.findUnique({ where: { id } });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    await prisma.licenseTemplate.delete({ where: { id } });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TEMPLATE_DELETED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Deleted license template "${template.name}"`
    );

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
