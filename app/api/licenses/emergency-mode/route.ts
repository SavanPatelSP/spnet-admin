import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST() {
  try {
    const session = await requireApiPermission("Emergency License Lockdown");
    const result = await prisma.license.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "SUSPENDED" },
    });

    await logAudit(
      AUDIT_ACTIONS.EMERGENCY_LOCKDOWN,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Emergency lockdown activated: ${result.count} licenses suspended`
    );

    return Response.json({ success: true, suspendedCount: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
