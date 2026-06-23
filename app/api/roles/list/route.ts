import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    await requireApiPermission("View Roles");

    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true, riskLevel: true, protected: true, createdAt: true, updatedAt: true, permissions: { select: { id: true, roleId: true, permission: true, createdAt: true } }, members: { select: { id: true } } },
      orderBy: { name: "asc" },
    });

    return Response.json(roles);
  } catch (error) {
    return handleApiError(error);
  }
}
