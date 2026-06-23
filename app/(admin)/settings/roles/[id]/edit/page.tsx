import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import EditRoleForm from "./role-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Role" };

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("View Roles");
  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: true, members: true },
  });

  if (!role) {
    return <div className="p-10 text-zinc-500">Role not found</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Edit: ${role.name}`}
        description={role.description || "Modify role settings and permissions"}
        gradient={false}
        actions={
          <Link
            href={`/settings/roles/${role.id}`}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Back to Role
          </Link>
        }
      />
      <EditRoleForm role={role} />
    </div>
  );
}
