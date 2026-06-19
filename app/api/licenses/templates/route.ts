import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requireApiPermission("Manage License Templates");
    const templates = await prisma.licenseTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return Response.json(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage License Templates");
    const body = await req.json();
    const { name, description, plan, maxDevices, durationDays, featureFlags, defaultNotes } = body;

    if (!name?.trim()) {
      return Response.json({ error: "Template name is required" }, { status: 400 });
    }

    if (!plan?.trim()) {
      return Response.json({ error: "Plan is required" }, { status: 400 });
    }

    const template = await prisma.licenseTemplate.create({
      data: {
        name: name.trim(),
        description,
        plan,
        maxDevices: Number(maxDevices) || 5,
        durationDays: Number(durationDays) || 365,
        featureFlags: featureFlags ? JSON.stringify(featureFlags) : null,
        defaultNotes,
        createdBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TEMPLATE_CREATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Created license template "${name}"`
    );

    return Response.json(template, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as Record<string, unknown>).code === "P2002") {
      return Response.json({ error: "Template with this name already exists" }, { status: 409 });
    }
    return handleApiError(error);
  }
}
