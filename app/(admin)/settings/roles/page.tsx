import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import DeleteRoleButton from "./DeleteRoleButton";
import { Shield, Users, KeyRound, AlertTriangle } from "lucide-react";
import { ALL_PERMISSIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  await requirePermission("View Roles");
  const roles = await prisma.role.findMany({
    include: { members: true, permissions: true },
    orderBy: { createdAt: "desc" },
  });

  const totalMembers = roles.reduce((sum, role) => sum + role.members.length, 0);
  const protectedCount = roles.filter((r) => r.protected).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Roles & Permissions"
        description="Enterprise RBAC management, permission governance and access control."
        actions={
          <Link
            href="/settings/roles/create"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Create Role
          </Link>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Roles" value={roles.length} icon={Shield} color="blue" />
        <StatCard title="Protected Roles" value={protectedCount} icon={AlertTriangle} color={protectedCount > 0 ? "yellow" : "default"} />
        <StatCard title="Assigned Members" value={totalMembers} icon={Users} color="green" />
        <StatCard title="Total Permissions" value={ALL_PERMISSIONS.length} icon={KeyRound} color="purple" />
      </StatCardGrid>

      <div className="space-y-5">
        {roles.map((role) => (
          <div key={role.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{role.name}</h2>
                  {role.protected && (
                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">Protected</span>
                  )}
                  <StatusBadge status={role.riskLevel === "High" ? "CRITICAL" : role.riskLevel === "Medium" ? "WARNING" : "HEALTHY"} />
                </div>
                <p className="mt-2 text-sm text-zinc-500">{role.description || "No description provided"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/settings/roles/${role.id}`} className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700">
                  View
                </Link>
                <Link href={`/settings/roles/${role.id}/edit`} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                  Edit
                </Link>
                {!role.protected && <DeleteRoleButton roleId={role.id} />}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs text-zinc-500">Members</p>
                <p className="mt-2 text-xl font-bold">{role.members.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs text-zinc-500">Permissions</p>
                <p className="mt-2 text-xl font-bold">{role.permissions.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs text-zinc-500">Risk Level</p>
                <p className="mt-2 text-xl font-bold">{role.riskLevel}</p>
              </div>
            </div>

            {role.permissions.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-medium text-zinc-400">Granted Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span key={permission.id} className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                      {permission.permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-6 text-xl font-bold">Permission Explorer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ALL_PERMISSIONS.map((permission) => (
            <div key={permission} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-sm text-zinc-300">
              {permission}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
