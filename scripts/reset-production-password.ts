import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const OWNER_EMAIL = "prod-owner@spnet.local";
const LICENSE_KEY = "SPNET-PROD-OWNER-00001";

function generatePassword(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not set. Export the Neon PostgreSQL URL.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const member = await prisma.teamMember.findUnique({ where: { email: OWNER_EMAIL } });
    if (!member) {
      console.error(`Owner not found: ${OWNER_EMAIL}. Has the bootstrap script been run?`);
      process.exit(1);
    }

    const password = generatePassword(24);
    const hash = await bcrypt.hash(password, 12);

    await prisma.teamMember.update({
      where: { email: OWNER_EMAIL },
      data: {
        password: hash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  PRODUCTION OWNER PASSWORD RESET                                ║");
    console.log(`║  Email:    ${OWNER_EMAIL.padEnd(37)}║`);
    console.log(`║  Password: ${password.padEnd(37)}║`);
    console.log(`║  License:  ${LICENSE_KEY.padEnd(37)}║`);
    console.log("╚══════════════════════════════════════════════════════════════════╝");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Password reset failed:", err);
  process.exit(1);
});
