import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Toggle License Status");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }
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
      session.user.role,
      session.user.name,
      `${newStatus === "ACTIVE" ? "Reactivated" : "Suspended"} license for ${updated.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Status toggle error:", error);
    return Response.json({ error: "Failed to toggle license status" }, { status: 500 });
  }
}
