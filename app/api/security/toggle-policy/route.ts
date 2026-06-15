import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const policy = await prisma.securityPolicy.update({
      where: { id: body.id },
      data: { enabled: body.enabled },
    });

    await logAudit(
      AUDIT_ACTIONS.POLICY_TOGGLED,
      undefined,
      undefined,
      ADMIN_ROLE,
      ADMIN_NAME,
      `${policy.enabled ? "Enabled" : "Disabled"} security policy "${policy.name}"`
    );

    return Response.json(policy);
  } catch (error) {
    console.error("Policy toggle error:", error);
    return Response.json({ error: "Failed to toggle policy" }, { status: 500 });
  }
}
