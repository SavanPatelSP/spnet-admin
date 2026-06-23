import { PrismaClient } from "@prisma/client";
import { getAppEnvironment } from "./env";

function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

function resolveDatabaseType(dbUrl: string): { isDev: boolean; isStaging: boolean; isProd: boolean } {
  if (dbUrl.startsWith("file:")) {
    const filename = dbUrl.replace(/^file:/, "").replace(/^\.\/prisma\//, "").trim();
    const isDev = filename.includes("dev") || filename === dbUrl;
    const isStaging = filename.includes("staging");
    const isProd = !isDev && !isStaging && filename.length > 0;
    return { isDev, isStaging, isProd };
  }
  if (isPostgresUrl(dbUrl)) {
    const dbName = dbUrl.split("/").pop()?.split("?")[0] ?? "";
    const isDev = dbName.includes("dev");
    const isStaging = dbName.includes("staging");
    const isProd = dbName.includes("prod") || (dbName.length > 0 && !isDev && !isStaging);
    return { isDev, isStaging, isProd };
  }
  return { isDev: false, isStaging: false, isProd: true };
}

function validateDatabaseEnvironment(): void {
  const appEnv = getAppEnvironment();
  const dbUrl = process.env.DATABASE_URL ?? "";

  const { isDev: isDevDatabase, isStaging: isStagingDatabase, isProd: isProdDatabase } = resolveDatabaseType(dbUrl);

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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Lazy validation — runs once on first request, not at module load time
const envValidated = { done: false };
function ensureEnvValidation(): void {
  if (envValidated.done) return;
  envValidated.done = true;
  try {
    validateDatabaseEnvironment();
  } catch {
    // Swallow validation errors in non-critical path
  }
}
ensureEnvValidation();

// Production owner initialization is deliberately removed.
// The production owner is created once during initial deployment setup
// via scripts/bootstrap-production-owner.ts. Running it on every cold start
// wastes a DB query (teamMember.count + teamMember.findUnique).
