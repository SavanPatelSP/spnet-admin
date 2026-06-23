import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Edit Team Members");
    const { id, name, email, roleId, licenseId, status } = await req.json();

    if (!id) {
      return Response.json({ error: "Member id is required" }, { status: 400 });
    }

    const existing = await prisma.teamMember.findUnique({ where: { id }, include: { role: { select: { name: true } } } });
    if (!existing) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }

    if (existing.role.name === "OWNER") {
      return Response.json({ error: "Cannot edit the owner" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (roleId !== undefined) data.roleId = roleId;
    if (status !== undefined) data.status = status;

    if (licenseId !== undefined) {
      if (licenseId) {
        const license = await prisma.license.findUnique({ where: { id: licenseId } });
        if (!license) {
          return Response.json({ error: "License not found" }, { status: 404 });
        }
      }
      data.licenseId = licenseId || null;
    }

    const roleChanged = roleId !== undefined && roleId !== existing.roleId;

    const updated = await prisma.teamMember.update({
      where: { id },
      data,
      include: { role: { select: { name: true } } },
    });

    if (roleChanged) {
      await prisma.session.updateMany({
        where: {
          teamMemberId: id,
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      });
    }

    const changes: string[] = [];
    if (name !== undefined && name !== existing.name) changes.push(`name: ${existing.name} → ${name}`);
    if (email !== undefined && email !== existing.email) changes.push(`email: ${existing.email} → ${email}`);
    if (roleId !== undefined) {
      const newRole = await prisma.role.findUnique({ where: { id: roleId }, select: { name: true } });
      changes.push(`role: ${existing.role.name} → ${newRole?.name || roleId}`);
    }
    if (status !== undefined && status !== existing.status) changes.push(`status: ${existing.status} → ${status}`);
    if (licenseId !== undefined && licenseId !== existing.licenseId) {
      changes.push(`license: ${existing.licenseId || "none"} → ${licenseId || "none"}`);
    }

    await logAudit(
      AUDIT_ACTIONS.TEAM_MEMBER_UPDATED,
      null,
      null,
      session.user.role,
      session.user.name,
      `Updated team member ${updated.name}: ${changes.join(", ")}`,
      session.user.email
    );

    return Response.json({ member: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
