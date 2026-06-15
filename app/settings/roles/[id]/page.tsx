import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Shield, Users, KeyRound, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/shared";
import DeleteRoleButton from "../../DeleteRoleButton";

export const dynamic = "force-dynamic";

export default async function RoleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await prisma.role.findUnique({
    where: { id },
    include: { members: true, permissions: true },
  });

  if (!role) {
    return <div className="p-10 text-zinc-500">Role not found</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={role.name}
        description={role.description || "No description provided"}
        gradient={false}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/settings/roles/${role.id}/edit`}
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-500"
            >
              Edit Role
            </Link>
            {!role.protected && <DeleteRoleButton roleId={role.id} />}
          </div>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard title="Members" value={role.members.length} icon={Users} color="blue" />
        <StatCard title="Permissions" value={role.permissions.length} icon={KeyRound} color="green" />
        <StatCard title="Risk Level" value={role.riskLevel} icon={AlertTriangle} color={role.riskLevel === "High" || role.riskLevel === "Critical" ? "red" : "default"} />
        <StatCard title="Protected" value={role.protected ? "Yes" : "No"} icon={Shield} color={role.protected ? "yellow" : "default"} />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Granted Permissions ({role.permissions.length})</h2>
          {role.permissions.length === 0 ? (
            <p className="text-sm text-zinc-500">No permissions assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span key={permission.id} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                  {permission.permission}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Assigned Team Members ({role.members.length})</h2>
          {role.members.length === 0 ? (
            <p className="text-sm text-zinc-500">No members assigned.</p>
          ) : (
            <div className="space-y-3">
              {role.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-zinc-500">{member.email}</p>
                  </div>
                  <StatusBadge status={member.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Metadata</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Created</p>
            <p className="mt-1 font-medium">{formatDateTime(role.createdAt)}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Updated</p>
            <p className="mt-1 font-medium">{formatDateTime(role.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
