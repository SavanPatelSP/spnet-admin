import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Edit Users");
    const body = await req.json();
    const { targetMemberId } = body;

    if (!targetMemberId) {
      return Response.json({ error: "Target member ID is required" }, { status: 400 });
    }

    const ownerRole = await prisma.role.findUnique({ where: { name: "OWNER" } });
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
      include: { role: true },
    });

    if (!targetMember) {
      return Response.json({ error: "Target member not found" }, { status: 404 });
    }

    if (targetMember.id === currentOwner.id) {
      return Response.json({ error: "Target member is already the owner" }, { status: 400 });
    }

    const adminRole = await prisma.role.findFirst({
      where: { name: "ADMIN" },
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
    console.error("Transfer ownership error:", error);
    return Response.json({ error: "Failed to transfer ownership" }, { status: 500 });
  }
}
