import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();

  const permissions = {
    OWNER: [
      "All Access",
      "Transfer Ownership",
      "Manage Roles",
      "Manage Team",
      "Manage Settings",
    ],

    SUPER_ADMIN: [
      "Manage Roles",
      "Manage Team",
      "Manage Settings",
      "View Analytics",
      "View Audit Logs",
    ],

    ADMIN: [
      "Manage Team",
      "View Analytics",
      "View Audit Logs",
    ],

    VIEWER: [
      "View Analytics",
    ],
  };

  for (const role of roles) {
    const rolePermissions =
      permissions[
        role.name as keyof typeof permissions
      ] || [];

    for (const permission of rolePermissions) {
      await prisma.permission.create({
        data: {
          roleId: role.id,
          permission,
        },
      });
    }
  }
}

main();
