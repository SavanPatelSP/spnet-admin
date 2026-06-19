import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("User Lifecycle Management");
    const body = await req.json();
    const { teamMemberId, action, department, phone, avatarUrl } = body;

    if (!teamMemberId) {
      return Response.json({ success: false, error: "teamMemberId is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    if (action === "ARCHIVE") {
      await prisma.teamMember.update({
        where: { id: teamMemberId },
        data: { status: "ARCHIVED" },
      });

      await logAudit(
        AUDIT_ACTIONS.USER_LIFECYCLE_ARCHIVED,
        undefined,
        undefined,
        session.user.role,
        session.user.name,
        `Archived team member ${member.name} (${member.email})`,
        session.user.email
      );

      return Response.json({ success: true, message: "Team member archived" });
    }

    if (action === "RESTORE") {
      await prisma.teamMember.update({
        where: { id: teamMemberId },
        data: { status: "ACTIVE" },
      });

      await logAudit(
        AUDIT_ACTIONS.USER_LIFECYCLE_RESTORED,
        undefined,
        undefined,
        session.user.role,
        session.user.name,
        `Restored team member ${member.name} (${member.email})`,
        session.user.email
      );

      return Response.json({ success: true, message: "Team member restored" });
    }

    if (department !== undefined || phone !== undefined || avatarUrl !== undefined) {
      const data: Record<string, unknown> = {};
      if (department !== undefined) data.department = department;
      if (phone !== undefined) data.phone = phone;
      if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

      await prisma.teamMember.update({
        where: { id: teamMemberId },
        data,
      });

      await logAudit(
        AUDIT_ACTIONS.TEAM_MEMBER_UPDATED,
        undefined,
        undefined,
        session.user.role,
        session.user.name,
        `Updated profile for team member ${member.name} (${member.email})`,
        session.user.email
      );

      return Response.json({ success: true, message: "Profile updated" });
    }

    return Response.json({ success: false, error: "action must be 'ARCHIVE' or 'RESTORE', or provide profile fields to update" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
