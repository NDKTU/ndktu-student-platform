#!/bin/bash
#
# Images/Uploads Backup Script
# Usage: ./scripts/backup_images.sh
#

set -euo pipefail

# ─── Config ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups/images"
UPLOADS_DIR="$PROJECT_DIR/backend/uploads"
MAX_BACKUPS=10

# ─── Setup ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/images_${TIMESTAMP}.tar.gz"

# ─── Check uploads directory ────────────────────────────
if [ ! -d "$UPLOADS_DIR" ] || [ -z "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
    echo "⚠️  No uploads found in $UPLOADS_DIR"
    exit 0
fi

# ─── Create backup ──────────────────────────────────────
echo "📦 Creating images backup: $BACKUP_FILE"

tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR/backend" uploads/

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Images backup complete: $SIZE"

# ─── Rotate old backups ─────────────────────────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/images_*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🔄 Rotating: removing $REMOVE_COUNT old backup(s)"
    ls -1t "$BACKUP_DIR"/images_*.tar.gz | tail -n "$REMOVE_COUNT" | xargs rm -f
fi

# ─── List backups ────────────────────────────────────────
echo ""
echo "📂 Image backups ($BACKUP_DIR):"
ls -lh "$BACKUP_DIR"/images_*.tar.gz 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
