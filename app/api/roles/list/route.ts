import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    await requireApiPermission("View Roles");

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    });

    return Response.json(roles);
  } catch (error) {
    return handleApiError(error);
  }
}
