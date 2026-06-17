import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { PREMIUM_PLANS, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requirePermission("premium.requests.approve");
    const existing = await prisma.premiumRequest.findUnique({
      where: { id },
      include: { license: true },
    });

    if (!existing) return Response.json({ error: "Premium request not found" }, { status: 404 });
    if (existing.status !== "PENDING") {
      return Response.json({ error: `Request already ${existing.status.toLowerCase()}` }, { status: 409 });
    }

    const { durationDays, plan } = await req.json();
    const finalPlan = plan || existing.requestedPlan;
    const finalDurationDays = durationDays || existing.requestedDurationDays;

    if (!PREMIUM_PLANS.includes(finalPlan as never)) {
      return Response.json({ error: `Invalid plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
    }

    const license = existing.license;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(finalDurationDays));

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.premiumSubscription.create({
        data: {
          licenseId: existing.licenseId,
          plan: finalPlan,
          action: "GRANTED",
          subscriptionType: "CUSTOM",
          startDate,
          endDate,
          durationDays: Number(finalDurationDays),
          grantedBy: session.user.name,
          notes: `Approved from request ${id}: ${existing.reason || "Custom premium"}`,
          previousPlan: license.plan,
          previousEndDate: license.expiresAt,
        },
      });

      await tx.license.update({
        where: { id: existing.licenseId },
        data: { plan: finalPlan, expiresAt: endDate },
      });

      await tx.premiumRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.name,
          reviewedAt: new Date(),
          convertedSubscriptionId: subscription.id,
        },
      });

      return subscription;
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_GRANTED_FROM_REQUEST,
      existing.licenseId,
      existing.organization || license.organization,
      session.user.role,
      session.user.name,
      `Premium granted from request ${id}: ${finalPlan} for ${license.organization} (${finalDurationDays} days)`,
      session.user.email
    );

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_REQUEST_APPROVED,
      existing.licenseId,
      existing.organization || license.organization,
      session.user.role,
      session.user.name,
      `Premium request ${id} approved and granted`,
      session.user.email
    );

    return Response.json({ subscription: result, requestId: id });
  } catch (error) {
    console.error("Premium request approve error:", error);
    return Response.json({ error: "Failed to approve premium request" }, { status: 500 });
  }
}
