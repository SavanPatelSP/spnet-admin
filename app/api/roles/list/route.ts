import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET() {
  await requirePermission("View Roles");

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json(roles);
}
