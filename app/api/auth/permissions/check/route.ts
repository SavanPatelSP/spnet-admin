import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storedVersion = (session.user as { rolePermissionsVersion?: number }).rolePermissionsVersion ?? 0;
    const roleId = session.user.roleId;

    let currentVersion = 0;
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { permissionsVersion: true },
      });
      currentVersion = role?.permissionsVersion ?? 0;
    } catch {
      // permissionsVersion column may not exist in production yet
      return Response.json({ changed: false });
    }

    if (currentVersion === storedVersion) {
      return Response.json({ changed: false });
    }

    const permissionRows = await prisma.permission.findMany({
      where: { roleId },
      select: { permission: true },
    });

    return Response.json({
      changed: true,
      permissions: permissionRows.map(p => p.permission),
      version: currentVersion,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
