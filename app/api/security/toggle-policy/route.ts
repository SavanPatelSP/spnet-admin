import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requirePermission("Toggle Security Policies");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "Policy ID is required" }, { status: 400 });
    }
    const policy = await prisma.securityPolicy.update({
      where: { id: body.id },
      data: { enabled: body.enabled },
    });

    await logAudit(
      AUDIT_ACTIONS.POLICY_TOGGLED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `${policy.enabled ? "Enabled" : "Disabled"} security policy "${policy.name}"`
    );

    return Response.json(policy);
  } catch (error) {
    console.error("Policy toggle error:", error);
    return Response.json({ error: "Failed to toggle policy" }, { status: 500 });
  }
}
