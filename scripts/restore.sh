#!/bin/bash
#
# Database Restore Script
# Usage: ./scripts/restore.sh backups/backup_2026-02-18_13-00-00.sql.gz
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_CONTAINER="database"
DB_NAME="basic_database"
DB_USER="bekzod"

# ─── Validate input ─────────────────────────────────────
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "$PROJECT_DIR"/backups/backup_*.sql.gz 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}'
    exit 1
fi

BACKUP_FILE="$1"
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="$PROJECT_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ File not found: $BACKUP_FILE"
    exit 1
fi

# ─── Confirm ────────────────────────────────────────────
echo "⚠️  This will REPLACE ALL DATA in '$DB_NAME' with:"
echo "   $BACKUP_FILE"
echo ""
read -p "Are you sure? (y/N): " confirm
if [[ "$confirm" != [yY] ]]; then
    echo "Cancelled."
    exit 0
fi

# ─── Check container ────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '$DB_CONTAINER' is not running!"
    exit 1
fi

# ─── Restore ────────────────────────────────────────────
echo "🔄 Dropping existing data..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "📦 Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1

echo "✅ Restore complete!"
echo ""

# Show counts
echo "📊 Table counts:"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "SELECT schemaname, relname AS table, n_live_tup AS rows 
     FROM pg_stat_user_tables 
     ORDER BY relname;" 2>/dev/null


echo "🏷️  Stamping database with current migration head..."

BACKEND_DIR="$(dirname "$SCRIPT_DIR")/backend"
ALEMBIC_DIR="$BACKEND_DIR/app"
VENV_DIR="$BACKEND_DIR/.venv"
ENV_FILE="$BACKEND_DIR/.env"

# ─── Read DATABASE_URL from .env and rewrite for localhost access ────────────
# Docker internal URL uses 'database:5432'; from the host we need 'localhost:5436'
RAW_URL=$(grep -E '^APP_CONFIG__DATABASE__URL=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)
if [ -z "$RAW_URL" ]; then
    echo "❌ Could not read APP_CONFIG__DATABASE__URL from $ENV_FILE"
    exit 1
fi
# Replace docker service host (database:5432) → localhost:5436
LOCAL_URL=$(echo "$RAW_URL" | sed 's|@[^/]*:[0-9]\+/|@localhost:5436/|')
echo "🔗 Using URL: $LOCAL_URL"

# ─── Ensure .venv exists ─────────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    echo "� No .venv found — creating virtual environment..."
    cd "$BACKEND_DIR"
    if command -v uv &>/dev/null; then
        uv venv "$VENV_DIR"
        uv sync --python "$VENV_DIR/bin/python"
    else
        python3 -m venv "$VENV_DIR"
        "$VENV_DIR/bin/pip" install --quiet -r "$BACKEND_DIR/requirements.txt" 2>/dev/null \
            || "$VENV_DIR/bin/pip" install --quiet -e "$BACKEND_DIR" 2>/dev/null \
            || echo "⚠️  Could not auto-install deps — run pip install manually if stamp fails"
    fi
    echo "✅ .venv ready"
else
    echo "✅ .venv found at $VENV_DIR"
fi

ALEMBIC_BIN="$VENV_DIR/bin/alembic"
if [ ! -f "$ALEMBIC_BIN" ]; then
    echo "❌ alembic not found in .venv — install it first:"
    echo "   cd $BACKEND_DIR && uv sync   OR   pip install alembic"
    exit 1
fi

# ─── Run alembic stamp head ───────────────────────────────────────────────────
if [ -d "$ALEMBIC_DIR" ]; then
    echo "📂 Changing directory to: $ALEMBIC_DIR"
    cd "$ALEMBIC_DIR"

    export APP_CONFIG__DATABASE__URL="$LOCAL_URL"
    "$ALEMBIC_BIN" stamp head

    echo "✅ Stamp complete!"
else
    echo "❌ Could not find alembic directory at $ALEMBIC_DIR"
    exit 1
fi