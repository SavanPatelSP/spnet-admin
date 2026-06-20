#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  SPNET Admin - Production Database Backup                       ║
# ║                                                                  ║
# ║  Usage: ./scripts/backup-db.sh [output-dir]                      ║
# ║    Default output directory: ./backups                           ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# Safety: This script verifies the database is a production database
# before performing any backup operations.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# ─── Configuration ─────────────────────────────────────────────────
APP_ENV="${APP_ENV:-production}"
DB_URL="${DATABASE_URL:-}"
DEFAULT_OUTPUT_DIR="${SCRIPT_DIR}/backups"
OUTPUT_DIR="${1:-$DEFAULT_OUTPUT_DIR}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="spnet_admin_prod_${TIMESTAMP}.db"

# ─── Safety Checks ─────────────────────────────────────────────────
echo "🔍 Environment: ${APP_ENV}"

if [ "$APP_ENV" != "production" ]; then
  echo "❌ SAFETY BLOCKED: APP_ENV is '${APP_ENV}', not 'production'."
  echo "   This backup script is designed for production databases only."
  exit 1
fi

if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL is not set. Cannot determine database location."
  exit 1
fi

# Extract file path from SQLite DATABASE_URL
DB_PATH=$(echo "$DB_URL" | sed 's/^file://')

# Verify it's not pointing to dev or staging databases
if echo "$DB_PATH" | grep -qiE '(dev|staging)\.db$'; then
  echo "❌ SAFETY BLOCKED: DATABASE_URL points to a development or staging database."
  echo "   Path: ${DB_PATH}"
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database file not found at: ${DB_PATH}"
  exit 1
fi

# ─── Backup ────────────────────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"

echo "📁 Database: ${DB_PATH}"
echo "💾 Backing up to: ${OUTPUT_DIR}/${BACKUP_FILE}"

cp "$DB_PATH" "${OUTPUT_DIR}/${BACKUP_FILE}"

echo "✅ Backup complete: ${OUTPUT_DIR}/${BACKUP_FILE}"

# Show file size
if command -v stat &>/dev/null; then
  SIZE=$(stat -f "%z" "${OUTPUT_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c "%s" "${OUTPUT_DIR}/${BACKUP_FILE}" 2>/dev/null)
  echo "📦 Size: $(numfmt --to=iec $SIZE 2>/dev/null || echo "${SIZE} bytes")"
fi
