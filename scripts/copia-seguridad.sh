#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source ./.env
set +a
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="backups/kawsapacha-${STAMP}.sql"
docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" > "$FILE"
chmod 600 "$FILE"
printf 'Base de datos guardada: %s\n' "$FILE"
echo 'IMPORTANTE: Respalda también el volumen uploads (fotografías) y conserva la copia fuera del VPS.'
