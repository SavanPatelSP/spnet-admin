import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const license = await prisma.license.findUnique({ where: { id: body.id } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const newStatus = license.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const updated = await prisma.license.update({
      where: { id: body.id },
      data: { status: newStatus },
    });

    await logAudit(
      newStatus === "ACTIVE" ? AUDIT_ACTIONS.LICENSE_REACTIVATED : AUDIT_ACTIONS.LICENSE_SUSPENDED,
      updated.id,
      updated.organization,
      ADMIN_ROLE,
      ADMIN_NAME,
      `${newStatus === "ACTIVE" ? "Reactivated" : "Suspended"} license for ${updated.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Status toggle error:", error);
    return Response.json({ error: "Failed to toggle license status" }, { status: 500 });
  }
}
