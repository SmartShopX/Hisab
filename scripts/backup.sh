#!/usr/bin/env bash
# ==============================================================================
# SmartShopX Authoritative PostgreSQL Backup Script
# Creates compressed, timestamped database dumps with SHA-256 integrity checksums
# and applies automatic retention pruning.
# ==============================================================================

set -euo pipefail

# Configuration with defaults
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"

DB_HOST="${SQL_HOST:-${PGHOST:-127.0.0.1}}"
DB_PORT="${SQL_PORT:-${PGPORT:-5432}}"
DB_NAME="${SQL_DB_NAME:-${PGDATABASE:-smartshopx}}"
DB_USER="${SQL_USER:-${PGUSER:-postgres}}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/smartshopx_backup_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

echo "======================================================="
echo " Starting SmartShopX Database Backup"
echo " Host:     ${DB_HOST}:${DB_PORT}"
echo " Database: ${DB_NAME}"
echo " User:     ${DB_USER}"
echo " Output:   ${BACKUP_FILE}"
echo "======================================================="

# Execute pg_dump with compression
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "${DATABASE_URL}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "${BACKUP_FILE}"
else
  PGPASSWORD="${SQL_PASSWORD:-${PGPASSWORD:-}}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean --if-exists --no-owner --no-privileges | gzip -9 > "${BACKUP_FILE}"
fi

# Generate SHA-256 checksum for tamper-evidence
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"

echo " Backup completed successfully!"
echo " File:     ${BACKUP_FILE} (${BACKUP_SIZE})"
echo " Checksum: $(cat "${CHECKSUM_FILE}")"

# Prune archives older than RETENTION_DAYS
echo " Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "smartshopx_backup_*.sql.gz*" -mtime "+${RETENTION_DAYS}" -exec rm -f {} \;
echo " Retention policy applied."
echo "======================================================="
