#!/usr/bin/env bash
# ==============================================================================
# SmartShopX Safe Production Database Restore Script
# Requires explicit CONFIRM_RESTORE=true environment variable to prevent accidental
# destruction of live production records.
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Error: Backup file path is required."
  echo "Usage: CONFIRM_RESTORE=true $0 ./backups/smartshopx_backup_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file does not exist: ${BACKUP_FILE}"
  exit 1
fi

if [ "${CONFIRM_RESTORE:-false}" != "true" ]; then
  echo "======================================================================"
  echo " SAFETY STOP: DESTRUCTIVE ACTION PREVENTED"
  echo " To restore over target database, you MUST explicitly set:"
  echo "   export CONFIRM_RESTORE=true"
  echo " Example: CONFIRM_RESTORE=true $0 ${BACKUP_FILE}"
  echo "======================================================================"
  exit 1
fi

DB_HOST="${SQL_HOST:-${PGHOST:-127.0.0.1}}"
DB_PORT="${SQL_PORT:-${PGPORT:-5432}}"
DB_NAME="${SQL_DB_NAME:-${PGDATABASE:-smartshopx}}"
DB_USER="${SQL_USER:-${PGUSER:-postgres}}"

echo "======================================================="
echo " Restoring SmartShopX Database"
echo " Source:   ${BACKUP_FILE}"
echo " Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "======================================================="

# Verify gzip archive before executing restore
echo "Verifying archive integrity..."
gzip -t "${BACKUP_FILE}"

echo "Restoring database schema and records..."
if [ -n "${DATABASE_URL:-}" ]; then
  gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}" -v ON_ERROR_STOP=1
else
  PGPASSWORD="${SQL_PASSWORD:-${PGPASSWORD:-}}" gunzip -c "${BACKUP_FILE}" | psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -v ON_ERROR_STOP=1
fi

echo "======================================================="
echo " Database restore completed successfully."
echo "======================================================="
