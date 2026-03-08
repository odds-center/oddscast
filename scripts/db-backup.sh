#!/usr/bin/env bash
# Manual DB backup script.
# Usage: DATABASE_URL=<url> ./scripts/db-backup.sh [output-dir]
#
# Examples:
#   # Use DATABASE_URL from server/.env
#   cd server && export $(grep -v '^#' .env | xargs) && cd .. && ./scripts/db-backup.sh
#
#   # Specify output directory
#   DATABASE_URL=postgresql://... ./scripts/db-backup.sh /tmp/backups
#
# To restore:
#   pg_restore -d "$DATABASE_URL" --no-owner --role=<user> backup.dump

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set" >&2
  echo "Usage: DATABASE_URL=<url> ./scripts/db-backup.sh [output-dir]" >&2
  exit 1
fi

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

FILENAME="oddscast_$(date +%Y%m%d_%H%M%S).dump"
FILEPATH="$OUT_DIR/$FILENAME"

echo "Starting backup -> $FILEPATH"
pg_dump "$DATABASE_URL" -Fc -f "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "Done: $FILEPATH ($SIZE)"
