const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const policies = [
    ["OWNER", 7],
    ["SUPER_ADMIN", 7],
    ["DEVELOPER", 7],
    ["BILLING_MANAGER", 7],
    ["COMMUNITY_MANAGER", 14],
    ["SUPPORT_MANAGER", 14],
    ["SUPPORT_AGENT", 30],
    ["MODERATOR", 14],
    ["ANALYST", 30],
  ];

  for (const [role, days] of policies) {
    await prisma.securityPolicy.upsert({
      where: { role },
      update: { revalidationDays: days },
      create: {
        role,
        revalidationDays: days,
      },
    });
  }

  console.log("✅ Security policies seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
