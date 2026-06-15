import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RoleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      members: true,
      permissions: true,
    },
  });

  if (!role) {
    return (
      <div className="p-10">
        Role not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-black p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black">
              {role.name}
            </h1>

            <p className="mt-3 text-zinc-400">
              {role.description ||
                "No description provided"}
            </p>
          </div>

          <Link
            href={`/settings/roles/${role.id}/edit`}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white"
          >
            Edit Role
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Members
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {role.members.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Permissions
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {role.permissions.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Risk Level
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {role.riskLevel}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Protected
          </p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-400">
            {role.protected
              ? "YES"
              : "NO"}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-6 text-xl font-semibold">
          Granted Permissions
        </h2>

        <div className="flex flex-wrap gap-3">
          {role.permissions.map(
            (permission) => (
              <div
                key={permission.id}
                className="rounded-xl border border-zinc-800 px-4 py-2"
              >
                {permission.permission}
              </div>
            )
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-6 text-xl font-semibold">
          Assigned Team Members
        </h2>

        <div className="space-y-3">
          {role.members.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-zinc-800 p-4"
            >
              <div className="font-medium">
                {member.name}
              </div>

              <div className="text-sm text-zinc-500">
                {member.email}
              </div>
            </div>
          ))}

          {role.members.length === 0 && (
            <p className="text-zinc-500">
              No members assigned.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
