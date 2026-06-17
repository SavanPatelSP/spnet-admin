import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { generateKey, parseExpiryDate } from "@/lib/shared";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Bulk Create Licenses");
    const body = await req.json();
    const { count, organization, plan, expiresAt, maxDevices, notes, templateId } = body;

    if (!count || count < 1 || count > 100) {
      return Response.json({ error: "Count must be between 1 and 100" }, { status: 400 });
    }

    if (!organization?.trim()) {
      return Response.json({ error: "Organization is required" }, { status: 400 });
    }

    let templateData: Record<string, unknown> = {};
    if (templateId) {
      const template = await prisma.licenseTemplate.findUnique({ where: { id: templateId } });
      if (!template) {
        return Response.json({ error: "Template not found" }, { status: 404 });
      }
      templateData = {
        plan: template.plan,
        maxDevices: template.maxDevices,
        featureFlags: template.featureFlags,
        notes: template.defaultNotes || "",
      };
    }

    const licensesData = Array.from({ length: count }, () => ({
      key: generateKey(),
      organization,
      plan: plan || (templateData.plan as string) || "ENTERPRISE",
      status: "ACTIVE",
      maxDevices: Number(maxDevices) || (templateData.maxDevices as number) || 5,
      expiresAt: expiresAt ? parseExpiryDate(expiresAt) : new Date(2027, 11, 31, 12, 0, 0),
      notes: notes ?? (templateData.notes as string) ?? "",
      featureFlags: (templateData.featureFlags as string) ?? null,
    }));

    const licenses = await prisma.license.createManyAndReturn({ data: licensesData });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_BULK_CREATED,
      undefined,
      organization,
      session.user.role,
      session.user.name,
      `Bulk created ${count} ${plan || (templateData.plan as string) || "ENTERPRISE"} licenses for ${organization}`
    );

    return Response.json({ success: true, data: licenses, count: licenses.length });
  } catch (error) {
    console.error("Bulk create error:", error);
    return Response.json({ error: "Failed to bulk create licenses" }, { status: 500 });
  }
}
