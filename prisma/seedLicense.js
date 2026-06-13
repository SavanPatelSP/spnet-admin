const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.license.create({
    data: {
      key: "SPNET-ENT-A8K4-X92D-Q7M1",
      organization: "SP-NET",
      plan: "ENTERPRISE",
      status: "ACTIVE",
      maxDevices: 10,
      expiresAt: new Date("2027-12-31"),
    },
  });

  console.log("✅ License created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
