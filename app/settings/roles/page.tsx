import Link from "next/link";
import { prisma } from "@/lib/prisma";

import DeleteRoleButton from "./DeleteRoleButton";

export const dynamic = "force-dynamic";

const availablePermissions = [
  "View Users",
  "Suspend Users",
  "Delete Users",
  "Restore Users",
  "Manage User Access",
  "Add Team Members",
  "Remove Team Members",
  "Assign Roles",
  "Transfer Ownership",
  "Create Roles",
  "Edit Roles",
  "Delete Roles",
  "Manage Permission Matrix",
  "View Devices",
  "Revoke Devices",
  "View Activations",
  "Manage Device Policies",
  "View Audit Logs",
  "Export Audit Logs",
  "Compliance Reporting",
  "View Analytics",
  "View Revenue",
  "Export Reports",
  "Manage Settings",
  "Maintenance Mode",
  "Backup Management",
];

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    include: {
      members: true,
      permissions: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalMembers = roles.reduce(
    (sum, role) => sum + role.members.length,
    0
  );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-black p-8">
        <h1 className="text-4xl font-black">
          Roles & Permissions
        </h1>

        <p className="mt-3 text-zinc-400">
          Enterprise RBAC management, permission governance and access control.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Total Roles
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {roles.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Protected Roles
          </p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-400">
            {roles.filter((r) => r.protected).length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Assigned Members
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalMembers}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Total Permissions
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {availablePermissions.length}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <input
          placeholder="Search roles..."
          className="w-80 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
        />

        <Link
          href="/settings/roles/create"
          className="rounded-xl bg-blue-600 px-5 py-3 text-white"
        >
          Create Role
        </Link>
      </div>

      <div className="space-y-5">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {role.name}
                  </h2>

                  {role.protected && (
                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                      Protected
                    </span>
                  )}
                </div>

                <p className="mt-2 text-zinc-500">
                  {role.description ||
                    "No description provided"}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/settings/roles/${role.id}`}
                  className="rounded-xl bg-zinc-800 px-4 py-2"
                >
                  View
                </Link>

                <Link
                  href={`/settings/roles/${role.id}/edit`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                >
                  Edit
                </Link>

                {!role.protected && (
<DeleteRoleButton roleId={role.id} />
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Members
                </p>

                <p className="mt-2 text-xl font-bold">
                  {role.members.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Permissions
                </p>

                <p className="mt-2 text-xl font-bold">
                  {role.permissions.length}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500">
                  Risk Level
                </p>

                <p className="mt-2 text-xl font-bold">
                  {role.riskLevel}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-zinc-400">
                Granted Permissions
              </p>

              <div className="flex flex-wrap gap-2">
                {role.permissions.length === 0 ? (
                  <span className="text-zinc-500">
                    No permissions assigned
                  </span>
                ) : (
                  role.permissions.map((permission) => (
                    <span
                      key={permission.id}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm"
                    >
                      {permission.permission}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-6 text-xl font-semibold">
          Permission Explorer
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availablePermissions.map((permission) => (
            <div
              key={permission}
              className="rounded-xl border border-zinc-800 p-4"
            >
              {permission}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
