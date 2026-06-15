import { prisma } from "@/lib/prisma";
import EditRoleForm from "./role-form";

export const dynamic = "force-dynamic";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: true,
      members: true,
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
    <EditRoleForm role={role} />
  );
}
