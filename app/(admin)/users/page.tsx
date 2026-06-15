export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Users, UserPlus, Calendar, Shield } from "lucide-react";
import { formatDate } from "@/lib/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function UsersPage() {
  const [teamMembers, roles] = await Promise.all([
    prisma.teamMember.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }),
    prisma.role.findMany(),
  ]);

  const activeMembers = teamMembers.filter((m) => m.status === "ACTIVE").length;
  const uniqueRoles = new Set(teamMembers.map((m) => m.role.name)).size;

  return (
    <div className="space-y-8">
      <PageHeader title="Users" description="Manage team members, roles and access across your organization." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Members" value={teamMembers.length} icon={Users} color="blue" />
        <StatCard title="Active" value={activeMembers} icon={UserPlus} color="green" subtitle={`${teamMembers.length > 0 ? Math.round((activeMembers / teamMembers.length) * 100) : 0}% of total`} />
        <StatCard title="Roles" value={roles.length} icon={Shield} color="purple" />
        <StatCard title="Role Assignments" value={uniqueRoles} icon={Calendar} color="yellow" subtitle="Distinct roles used" />
      </StatCardGrid>

      <DataTable
        columns={[
          { key: "name", label: "Name", sortable: true, searchable: true },
          { key: "email", label: "Email", sortable: true, searchable: true },
          { key: "role", label: "Role", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "createdAt", label: "Joined", sortable: true },
        ]}
        rows={teamMembers.map((m) => ({
          id: m.id,
          values: {
            name: m.name,
            email: m.email,
            role: m.role.name,
            status: m.status,
            createdAt: m.createdAt.toISOString(),
          },
          cells: [
            <span className="font-medium">{m.name}</span>,
            <>{m.email}</>,
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium">
              {m.role.name}
            </span>,
            <StatusBadge status={m.status} />,
            <>{formatDate(m.createdAt)}</>,
          ],
        }))}
        searchPlaceholder="Search by name, email, or role..."
        emptyMessage="No team members found. Invite members to get started."
      />
    </div>
  );
}
