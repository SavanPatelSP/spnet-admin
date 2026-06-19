import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiPermission("View Broadcasts");

    const totalUsers = await prisma.license.count();
    const premiumUsers = await prisma.license.count({
      where: { plan: { in: ["PLUS", "PRO", "BUSINESS", "ENTERPRISE"] } },
    });
    const organizations = await prisma.license.groupBy({
      by: ["organization"],
      _count: { id: true },
    });
    const organizationCount = organizations.length;
    const teamMembers = await prisma.teamMember.count({ where: { status: "ACTIVE" } });
    const activations = await prisma.activation.groupBy({
      by: ["licenseId"],
      _count: { id: true },
    });
    const licenseHolders = activations.length;

    return Response.json({
      success: true,
      data: {
        ALL: { label: "All Users", count: totalUsers, description: "Every registered user in the system" },
        PREMIUM: { label: "Premium Users", count: premiumUsers, description: "Users with active premium subscriptions" },
        ORGANIZATIONS: { label: "Organizations", count: organizationCount, description: "All organization members" },
        TEAM: { label: "Team Members", count: teamMembers, description: "Internal team members only" },
        LICENSE_HOLDERS: { label: "License Holders", count: licenseHolders, description: "Users with active license activations" },
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
