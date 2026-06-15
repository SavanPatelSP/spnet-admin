import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function POST() {
  try {
    const result = await prisma.license.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "SUSPENDED" },
    });

    await logAudit(
      AUDIT_ACTIONS.EMERGENCY_LOCKDOWN,
      undefined,
      undefined,
      ADMIN_ROLE,
      ADMIN_NAME,
      `Emergency lockdown activated: ${result.count} licenses suspended`
    );

    return Response.json({ success: true, suspendedCount: result.count });
  } catch (error) {
    console.error("Emergency mode error:", error);
    return Response.json({ error: "Emergency lockdown failed" }, { status: 500 });
  }
}
