import { PrismaClient } from "@prisma/client";
import { getAppEnvironment } from "./env";

function validateDatabaseEnvironment(): void {
  const appEnv = getAppEnvironment();
  const dbUrl = process.env.DATABASE_URL ?? "";
  const dbFilename = dbUrl.replace(/^file:/, "").replace(/^\.\/prisma\//, "").trim();

  const isDevDatabase = dbFilename.includes("dev") || dbFilename === dbUrl;
  const isStagingDatabase = dbFilename.includes("staging");
  const isProdDatabase = !isDevDatabase && !isStagingDatabase && dbFilename.length > 0;

  if (appEnv === "development" && isProdDatabase) {
    console.warn(
      "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  WARNING: Development environment points to a non-dev database  ║\n" +
      "║  DATABASE_URL does not look like a development database file.    ║\n" +
      "║  Double-check your .env.development file.                       ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝"
    );
  }

  if (appEnv === "production" && (isDevDatabase || isStagingDatabase)) {
    console.error(
      "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  FATAL: Production environment points to a non-production DB!   ║\n" +
      "║  DATABASE_URL resolves to a development or staging database.    ║\n" +
      "║  Check your .env.production or deployment environment variables.║\n" +
      "╚══════════════════════════════════════════════════════════════════╝"
    );
  }

  if (appEnv === "staging" && isProdDatabase) {
    console.error(
      "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  FATAL: Staging environment points to a production database!    ║\n" +
      "║  DATABASE_URL resolves to a production database.                ║\n" +
      "║  Check your staging deployment environment variables.           ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝"
    );
  }

  if (appEnv === "staging" && isDevDatabase) {
    console.warn(
      "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  WARNING: Staging environment points to a development database! ║\n" +
      "║  DATABASE_URL resolves to a development database.               ║\n" +
      "║  Update your staging deployment environment variables.          ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝"
    );
  }
}

validateDatabaseEnvironment();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
