#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  echo 'Ya existe .env. No se sobrescribió para proteger las credenciales.'
  exit 1
fi
if ! command -v openssl >/dev/null; then
  echo 'Instala openssl antes de continuar.'; exit 1
fi
EMAIL="${1:-}"
if [[ ! "$EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo 'Uso: bash scripts/configurar.sh correo-admin@tudominio.com'
  exit 1
fi
DB_PASS=$(openssl rand -hex 20)
JWT_PASS=$(openssl rand -hex 48)
ADMIN_PASS=$(openssl rand -hex 12)
cat > .env <<ENV
DB_USER=kawsapacha
DB_NAME=kawsapacha
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT_PASS
ADMIN_EMAIL=$EMAIL
ADMIN_PASSWORD=$ADMIN_PASS
PORT=3100
TRUST_PROXY=false
COOKIE_SECURE=false
POINTS_PER_ACTIVITY=10
ENV
chmod 600 .env
printf '\nConfiguración creada: .env\n\nCORREO ADMIN: %s\nCONTRASEÑA ADMIN: %s\n\n' "$EMAIL" "$ADMIN_PASS"
echo 'Guarda esta contraseña en un lugar seguro. Podrás cambiarla posteriormente desde la base de datos o un procedimiento de administración.'
echo 'Inicia con: docker compose up -d --build'
