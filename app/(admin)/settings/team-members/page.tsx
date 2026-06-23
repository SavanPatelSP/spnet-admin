import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import TeamMembersDataTable from "@/components/settings/TeamMembersDataTable";
import InviteTeamMemberModal from "@/components/settings/team-members/InviteTeamMemberModal";
import OwnershipPanel from "@/components/settings/team-members/OwnershipPanel";
import SecurityEventsPanel from "@/components/settings/team-members/SecurityEventsPanel";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Team Members" };

export default async function TeamMembersPage() {
  const session = await requirePermission("View Team Members");
  const currentUserRole = session.user.role;
  const [totalMembers, activeMembers, totalRoles, members, auditEvents] = await Promise.all([
    prisma.teamMember.count(),
    prisma.teamMember.count({ where: { status: "ACTIVE" } }),
    prisma.role.count(),
    prisma.teamMember.findMany({
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "LOGIN_FAILURE", "LOGIN_SUCCESS", "LOGOUT", "PERMISSION_DENIED",
            "TEAM_MEMBER_SUSPENDED", "TEAM_MEMBER_REACTIVATED",
            "PASSWORD_RESET", "EMERGENCY_LOCKDOWN",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const suspendedMembers = await prisma.teamMember.count({ where: { status: "SUSPENDED" } });
  const roles = await prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const owner = members.find((m) => m.role?.name === "OWNER");
  const memberRows = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    status: m.status,
    roleId: m.roleId,
    roleName: m.role?.name ?? "Unknown",
    createdAt: m.createdAt,
    lastLogin: m.lastLogin,
    failedLoginAttempts: m.failedLoginAttempts,
    lockedUntil: m.lockedUntil,
    licenseId: m.licenseId,
  }));

  const roleList = roles.map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Management"
        description="Enterprise identity, ownership, access control, governance and role administration."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Team Members" value={totalMembers} icon={Users} color="blue" />
        <StatCard title="Active Members" value={activeMembers} icon={UserCheck} color="green" subtitle={`${totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}% active`} />
        <StatCard title="Suspended" value={suspendedMembers} icon={UserX} color={suspendedMembers > 0 ? "yellow" : "default"} />
        <StatCard title="Active Roles" value={totalRoles} icon={Shield} color="purple" />
      </StatCardGrid>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Invite Team Member</h2>
              <p className="mt-1 text-sm text-zinc-500">Create new administrators and assign platform roles.</p>
            </div>
            <div className="flex items-center gap-2">
              <InviteTeamMemberModal currentUserRole={currentUserRole} />
            </div>
          </div>
        </div>

        <OwnershipPanel
          owner={owner ? { id: owner.id, name: owner.name, email: owner.email } : null}
          members={memberRows.map((m) => ({ id: m.id, name: m.name, email: m.email }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TeamMembersDataTable members={memberRows} roles={roleList} currentUserRole={currentUserRole} />
        </div>
        <div>
          <SecurityEventsPanel
            events={auditEvents.map((e) => ({
              id: e.id,
              action: e.action,
              description: e.description,
              actorEmail: e.actorEmail,
              createdAt: e.createdAt,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
