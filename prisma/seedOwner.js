const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: {
      email: "owner@spnet.local",
    },
    update: {},
    create: {
      name: "Savan Patel",
      email: "owner@spnet.local",
      role: "OWNER",
    },
  });

  console.log("✅ OWNER created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
