# Despliegue en Hostinger Node.js (sin Docker)

Esta edición añade `postinstall` y `build` para que Prisma genere su cliente. Es una corrección para el 503 `@prisma/client did not initialize yet`; no crea automáticamente una base de datos externa.

## En hPanel

1. En el sitio Node.js, ir a **Implementaciones / Deployments → Redeploy** y seleccionar **Upload new files**.
2. Subir este ZIP. Usar **Node.js 22**, tipo **Express**, script de compilación `npm run build` o `npx prisma generate`, y archivo de entrada `src/server.js` (si el panel pide uno).
3. Variables: `JWT_SECRET` de 32+ caracteres, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DATABASE_URL` con URL PostgreSQL **real y accesible**, `TRUST_PROXY=true`, `COOKIE_SECURE=true`, `POINTS_PER_ACTIVITY=10`. `PORT` puede omitirse cuando Hostinger lo provea. Las variables DB_USER, DB_NAME y DB_PASSWORD sirven para Docker, pero no reemplazan DATABASE_URL en este despliegue.
4. Guardar y redeplegar. Revisar **Build logs** primero y **Runtime logs** después.

## Preparar esquema y cuenta de administración (una vez)

La app no ejecuta migraciones/semillas al arrancar mediante `node src/server.js`, porque los accesos a la BD requieren preparación previa. Ejecutar en un entorno con acceso a la misma PostgreSQL y las mismas variables (por ejemplo, un entorno local seguro):

```sh
npx prisma db push
node prisma/seed.js
```

Si el panel permite un build command completo y DATABASE_URL está accesible durante la compilación, usar:

```sh
npx prisma generate && npx prisma db push && node prisma/seed.js
```

**Advertencias:**
- No usar `db:5432` como host en Hostinger Node.js sin Docker: es el nombre interno del servicio Docker Compose.
- Nunca incluir ni compartir `.env` con contraseñas dentro del ZIP.
- Si falla la compilación, enviar últimas líneas del Build log; si la app cae tras arrancar, del Runtime log.
- La carpeta de imágenes local puede no persistir a través de nuevos despliegues; para uso continuado configurar almacenamiento persistente.
