#!/usr/bin/env bash
set -euo pipefail

echo "=== PRODUCTION DATABASE SETUP ==="

# Safety check: ensure we're targeting production
if [ "${APP_ENV:-}" != "production" ]; then
  echo "FATAL: APP_ENV is not set to production"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL is not set"
  exit 1
fi

# 1. Generate Prisma Client
echo ">>> Generating Prisma Client..."
npx prisma generate

# 2. Apply migrations
echo ">>> Applying database migrations..."
npx prisma migrate deploy

# 3. Verify connection
echo ">>> Verifying database connection..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.\$queryRawUnsafe('SELECT 1').then(() => {
  console.log('Database connection OK');
  return p.\$disconnect();
}).catch(e => {
  console.error('Database connection FAILED:', e.message);
  process.exit(1);
});
"

echo "=== PRODUCTION DATABASE SETUP COMPLETE ==="
