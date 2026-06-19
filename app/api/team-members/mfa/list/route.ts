import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiPermission("Manage MFA");

    const members = await prisma.teamMember.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mfaEnabled: true,
        status: true,
        role: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return Response.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        mfaEnabled: m.mfaEnabled,
        status: m.status,
        role: m.role.name,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
