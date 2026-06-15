import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.role.upsert({
    where: { name: "OWNER" },
    update: {},
    create: { name: "OWNER" },
  });

  const superAdmin = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN" },
  });

  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  await prisma.role.upsert({
    where: { name: "VIEWER" },
    update: {},
    create: { name: "VIEWER" },
  });

  await prisma.teamMember.upsert({
    where: {
      email: "admin@spnet.local",
    },
    update: {},
    create: {
      name: "Savan Patel",
      email: "admin@spnet.local",
      roleId: owner.id,
    },
  });

  const policies = [
    "Audit Logging",
    "MFA Enforcement",
    "Session Timeout",
    "IP Allowlist",
    "Rate Limiting",
    "Device Fingerprinting",
    "Emergency Lockdown",
    "Duplicate Device Protection",
  ];

  for (const policy of policies) {
    await prisma.securityPolicy.upsert({
      where: { name: policy },
      update: {},
      create: {
        name: policy,
        enabled: true,
      },
    });
  }
}

main()
  .then(() => {
    console.log("✅ Seed complete");
  })
  .catch((error) => {
    console.error("❌ Seed failed");
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
