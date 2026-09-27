# SmartShopX Production Backup, Verification & Disaster Recovery Guide

This document defines the authoritative operations runbook for database backup, integrity verification, retention policy, and disaster recovery procedures for SmartShopX.

---

## 1. Backup Strategy

SmartShopX uses PostgreSQL as its authoritative state store. All database mutations rely on strict multi-tenancy, ACID transactions, and additive migrations.

### Automated Backups
Automated scheduled backups are executed via cron or Kubernetes CronJob using `./scripts/backup.sh`.

```cron
# Daily backup at 02:00 AM UTC
0 2 * * * /app/scripts/backup.sh >> /var/log/smartshopx-backup.log 2>&1
```

### Backup Storage & Retention Policy
- **Local Storage:** `./backups/`
- **Compression:** Gzip level 9 (`.sql.gz`)
- **Integrity Validation:** SHA-256 hash generated alongside each archive (`.sql.gz.sha256`)
- **Daily Retention:** 7 days stored locally
- **Offsite Archive:** Recommended syncing to secure S3/GCS bucket with immutable object locking (WORM)

---

## 2. Backup Verification Procedure

A backup is **never** considered valid merely because a file was written to disk. The automated verification script (`./scripts/verify-backup.sh`) enforces a 4-step integrity audit:

1. **SHA-256 Checksum Validation:** Verifies that the file has not experienced bit rot or tampering.
2. **Gzip Stream Test:** Executes `gzip -t` to ensure the compressed stream has no corruption.
3. **Isolated Test Restoration:** Restores the archive into a temporary, isolated scratch database (`smartshopx_verify_<timestamp>`), **NEVER** touching production.
4. **Smoke Audit:** Queries table schemas, row counts, and indexes to ensure database consistency before dropping the temporary database.

Run verification:
```bash
./scripts/verify-backup.sh ./backups/smartshopx_backup_20260925_020000.sql.gz
```

---

## 3. Safe Database Restore Procedure

To prevent catastrophic accidental overwrites of live production data, `./scripts/restore.sh` requires explicit confirmation:

```bash
CONFIRM_RESTORE=true ./scripts/restore.sh ./backups/smartshopx_backup_20260925_020000.sql.gz
```

---

## 4. Disaster Recovery Scenarios (Runbooks)

### Scenario A: Application Server Failure
*Symptom:* The Node.js application process crashes or the container becomes unresponsive. Database is healthy.
- **Cause:** Memory leak, uncaught exception, or node host failure.
- **Action:**
  1. The container orchestrator (Docker / Kubernetes / Cloud Run) restarts the pod automatically.
  2. Health probes (`GET /health/live` and `GET /health/ready`) guide traffic once the server is ready.
  3. No database restore is required. Transactions in flight rolled back automatically via PostgreSQL ACID guarantees.

### Scenario B: Database Server Failure
*Symptom:* PostgreSQL instances becomes unreachable (`ECONNREFUSED` or hardware failure).
- **Cause:** Cloud SQL outage, disk exhaustion, or PostgreSQL host crash.
- **Action:**
  1. Failover to Cloud SQL High-Availability (HA) replica (automatic within 60 seconds).
  2. If primary storage is unrecoverable, provision a new PostgreSQL instance.
  3. Select the latest verified backup from offsite storage.
  4. Run `CONFIRM_RESTORE=true ./scripts/restore.sh <latest_backup.sql.gz>`.
  5. Run migrations (`npm run migrate` or `GET /api/v1/migration/status`) to confirm schema compatibility.

### Scenario C: Accidental Application Deployment Issue
*Symptom:* A bad application build was deployed containing a regression or buggy frontend logic.
- **Cause:** Broken code release.
- **Action:**
  1. Roll back application image to previous known-good deployment artifact in Cloud Run / Kubernetes.
  2. Because all SmartShopX migrations are **strictly additive**, the previous application version remains fully compatible with the existing database schema.
  3. No database rollback is required.

### Scenario D: Corrupted or Incomplete Migration
*Symptom:* A manual SQL script failed midway or locked tables.
- **Cause:** Unsafe DDL execution without idempotency checks.
- **Action:**
  1. Inspect the migration error in server logs.
  2. SmartShopX migrations use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`, preventing partial DDL failures.
  3. If a lock is held, query `pg_stat_activity` and cancel the blocking query.
  4. Do **not** drop existing production columns or tables.

### Scenario E: User Accidentally Modifies or Deletes Data
*Symptom:* A merchant accidentally deleted a product, customer, or made erroneous edits.
- **Cause:** Operator error.
- **Mitigation & Recovery:**
  1. SmartShopX uses **soft deletes** (`is_active = false`) for products, customers, and suppliers. The record can be reactivated directly:
     ```sql
     UPDATE products SET is_active = true WHERE id = '<prod_id>' AND business_id = '<business_id>';
     ```
  2. Complete audit trails exist in `audit_logs` detailing the previous state, timestamp, and user who performed the operation.
  3. If a hard restore of specific rows is required, restore the latest backup into a temporary database, export the specific rows, and re-insert them into production with tenant scoping intact.
