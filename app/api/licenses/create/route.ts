import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { generateKey, parseExpiryDate } from "@/lib/shared";
import { DEFAULT_PLAN, DEFAULT_MAX_DEVICES, AUDIT_ACTIONS } from "@/lib/constants";
import { DEFAULT_EXPIRY_YEAR } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    if (!body.organization?.trim()) {
      return Response.json({ error: "Organization is required" }, { status: 400 });
    }

    const expiryDate = body.expiresAt
      ? parseExpiryDate(body.expiresAt)
      : new Date(DEFAULT_EXPIRY_YEAR, 11, 31, 12, 0, 0);

    const license = await prisma.license.create({
      data: {
        key: generateKey(),
        organization: body.organization,
        plan: body.plan || DEFAULT_PLAN,
        status: body.status || "ACTIVE",
        maxDevices: Number(body.maxDevices) || DEFAULT_MAX_DEVICES,
        expiresAt: expiryDate,
        notes: body.notes || "",
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_CREATED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Created ${license.plan} license for ${license.organization}`
    );

    return Response.json(license);
  } catch (error) {
    console.error("License create error:", error);
    return Response.json({ error: "Failed to create license" }, { status: 500 });
  }
}
