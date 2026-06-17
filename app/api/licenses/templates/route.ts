import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requirePermission("Manage License Templates");
    const templates = await prisma.licenseTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return Response.json(templates);
  } catch (error) {
    console.error("Templates get error:", error);
    return Response.json({ error: "Failed to get templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage License Templates");
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
    if ((error as Record<string, unknown>)?.code === "P2002") {
      return Response.json({ error: "Template with this name already exists" }, { status: 409 });
    }
    console.error("Template create error:", error);
    return Response.json({ error: "Failed to create template" }, { status: 500 });
  }
}
