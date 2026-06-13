const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const license = await prisma.license.findFirst();

  if (!license) {
    console.log("No license found");
    return;
  }

  await prisma.activation.createMany({
    data: [
      {
        licenseId: license.id,
        deviceId: "macbook-m5",
        deviceName: "MacBook Pro M5",
      },
      {
        licenseId: license.id,
        deviceId: "iphone-16",
        deviceName: "iPhone 16 Pro",
      },
    ],
  });

  console.log("✅ Activations seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
