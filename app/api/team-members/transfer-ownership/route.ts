import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Edit Users");
    const body = await req.json();
    const { targetMemberId } = body;

    if (!targetMemberId) {
      return Response.json({ error: "Target member ID is required" }, { status: 400 });
    }

    const ownerRole = await prisma.role.findUnique({ where: { name: "OWNER" }, select: { id: true } });
    if (!ownerRole) {
      return Response.json({ error: "Owner role not found" }, { status: 500 });
    }

    const currentOwner = await prisma.teamMember.findFirst({
      where: { roleId: ownerRole.id },
    });

    if (!currentOwner) {
      return Response.json({ error: "No current owner found" }, { status: 404 });
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: targetMemberId },
      select: { id: true, name: true, email: true, roleId: true },
    });

    if (!targetMember) {
      return Response.json({ error: "Target member not found" }, { status: 404 });
    }

    if (targetMember.id === currentOwner.id) {
      return Response.json({ error: "Target member is already the owner" }, { status: 400 });
    }

    const adminRole = await prisma.role.findFirst({
      where: { name: "ADMIN" },
      select: { id: true },
    });

    if (!adminRole) {
      return Response.json({ error: "Admin role not found" }, { status: 500 });
    }

    await prisma.$transaction([
      prisma.teamMember.update({
        where: { id: currentOwner.id },
        data: { roleId: adminRole.id },
      }),
      prisma.teamMember.update({
        where: { id: targetMemberId },
        data: { roleId: ownerRole.id },
      }),
      prisma.session.updateMany({
        where: {
          teamMemberId: { in: [currentOwner.id, targetMemberId] },
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      }),
    ]);

    await logAudit(
      AUDIT_ACTIONS.OWNERSHIP_TRANSFERRED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Transferred ownership from ${currentOwner.name} (${currentOwner.email}) to ${targetMember.name} (${targetMember.email})`,
      session.user.email
    );

    return Response.json({
      success: true,
      previousOwner: { id: currentOwner.id, name: currentOwner.name, email: currentOwner.email },
      newOwner: { id: targetMember.id, name: targetMember.name, email: targetMember.email },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
