import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const license = await prisma.license.findUnique({ where: { id: body.id } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    await prisma.license.delete({ where: { id: body.id } });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_DELETED,
      body.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Deleted ${license.plan} license for ${license.organization}`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("License delete error:", error);
    return Response.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
