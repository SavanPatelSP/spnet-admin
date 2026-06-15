import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generateKey } from "@/lib/shared";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      ADMIN_ROLE,
      ADMIN_NAME,
      `Regenerated license key for ${updated.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Key regeneration error:", error);
    return Response.json({ error: "Failed to regenerate key" }, { status: 500 });
  }
}
