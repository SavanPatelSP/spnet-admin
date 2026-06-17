import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { generateKey } from "@/lib/shared";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Regenerate License Keys");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }
    const license = await prisma.license.findUnique({ where: { id: body.id } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const newKey = generateKey();
    const updated = await prisma.license.update({
      where: { id: body.id },
      data: { key: newKey },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_KEY_REGENERATED,
      updated.id,
      updated.organization,
      session.user.role,
      session.user.name,
      `Regenerated license key for ${updated.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Key regeneration error:", error);
    return Response.json({ error: "Failed to regenerate key" }, { status: 500 });
  }
}
