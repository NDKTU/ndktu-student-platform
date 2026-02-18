#!/bin/bash
#
# Database Auto Backup Script
# Usage: ./scripts/backup.sh
# Cron:  0 */6 * * * /path/to/project/scripts/backup.sh
#

set -euo pipefail

# ─── Config ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DB_CONTAINER="database"
DB_NAME="basic_database"
DB_USER="bekzod"
MAX_BACKUPS=10  # Keep last N backups

# ─── Setup ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
BACKUP_GZ="$BACKUP_FILE.gz"

# ─── Check container ────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '$DB_CONTAINER' is not running!"
    exit 1
fi

# ─── Create backup ──────────────────────────────────────
echo "📦 Creating backup: $BACKUP_GZ"
echo "   Database: $DB_NAME | Container: $DB_CONTAINER"

docker exec "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_GZ"

SIZE=$(du -h "$BACKUP_GZ" | cut -f1)
echo "✅ Backup complete: $SIZE"

# ─── Rotate old backups ─────────────────────────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🔄 Rotating: removing $REMOVE_COUNT old backup(s)"
    ls -1t "$BACKUP_DIR"/backup_*.sql.gz | tail -n "$REMOVE_COUNT" | xargs rm -f
fi

# ─── List backups ────────────────────────────────────────
echo ""
echo "📂 Backups ($BACKUP_DIR):"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
echo ""
echo "💡 Restore with: make restore FILE=backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz"
