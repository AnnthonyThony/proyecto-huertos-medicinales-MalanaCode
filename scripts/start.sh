#!/bin/sh
set -eu
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const [{ u }] = await db.\$queryRawUnsafe(\"SELECT to_regclass('public.\\\"User\\\"')::text AS u\");
  const [{ m }] = await db.\$queryRawUnsafe(\"SELECT to_regclass('public._prisma_migrations')::text AS m\");
  if (u && !m) console.log('NEED_BASELINE');
})().catch(() => {}).finally(() => db.\$disconnect());
" | grep -q NEED_BASELINE && npx prisma migrate resolve --applied 20261106000000_baseline || true
npx prisma migrate deploy
node prisma/seed.js
exec node src/server.js
