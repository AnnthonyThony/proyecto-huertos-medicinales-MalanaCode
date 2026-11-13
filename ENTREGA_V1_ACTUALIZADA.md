# Kawsapacha V1 — entrega actualizada para Hostinger

## Estado verificable

Esta entrega conserva Express, PostgreSQL/Prisma, el diseño forestal de Kawsapacha y las rutas API existentes.

### Cambios concretos

- Corregidos los ocho `enum` de Prisma que provocaban el error P1012 durante `prisma generate`.
- Configuración de filas (1–26) y columnas (1–30) al crear un huerto; no se asignan cultivos ficticios.
- Identificadores de cuadrícula A1, A2, B1…; lectura compatible con cultivos históricos que usaban A-1.
- Filtros de casillas por fila, columna, planta, etapa, clasificación térmica y ocupación; vista de listado.
- Modo claro/oscuro persistente con preferencia del sistema como valor inicial.
- Modales con altura máxima y desplazamiento interno, además de ajustes móviles.
- La carga de plantas de ejemplo queda **desactivada** por defecto (`SEED_DEMO_PLANTS=false`).
- Las fichas botánicas no verificadas están identificadas como pendientes, sin atribuirles certificación MSP.
- Se añadió una `DATABASE_URL` explícita de ejemplo para evitar confundir el servicio `db` de Docker con PostgreSQL externo.

### Qué no está demostrado todavía

- No se verificó conexión a una base PostgreSQL real ni a Hostinger. Se necesita configurar `DATABASE_URL` y ejecutar el esquema.
- El valor `POINTS_PER_ACTIVITY=10`, las reglas de puntuación lunar y el ranking proporcional se mantienen como hipótesis del prototipo: requieren contraste con los PDF originales (no adjuntos aquí).
- La validación botánica, la clasificación térmica y las compatibilidades agrícolas requieren fuentes técnicas; no se importaron datos oficiales inexistentes.
- No se han ejecutado pruebas de navegador, de subida de archivos reales ni una prueba completa de la API con PostgreSQL.

## Instalación en Hostinger (aplicación Node.js / Express)

1. Extraer el ZIP. Utilizar `kawsapacha-mvp` como directorio raíz de la aplicación si Hostinger exige esa estructura.
2. Usar Node.js 20 o posterior. Archivo de inicio `src/server.js` y comando `npm start`.
3. Crear PostgreSQL con las credenciales propias del alojamiento (o servicio externo). Confirmar la conectividad de red al host y puerto.
4. Crear `.env` a partir de `.env.example` y definir `DATABASE_URL`, `JWT_SECRET` de 32 caracteres o más, `COOKIE_SECURE=true` bajo HTTPS y `TRUST_PROXY=true` cuando Hostinger reenvíe correctamente los encabezados del proxy.
5. Ejecutar `npm install`, `npx prisma validate`, `npx prisma generate` y `npx prisma db push` (o migraciones aprobadas para bases con datos). **Antes de `db push`, realizar una copia de seguridad si hay información existente.**
6. Opcionalmente, configurar `ADMIN_EMAIL` y `ADMIN_PASSWORD` temporalmente para crear el administrador con `npm run db:seed`. El seed no crea plantas de muestra salvo que explícitamente se active `SEED_DEMO_PLANTS=true`.
7. Retirar `ADMIN_PASSWORD` después del alta inicial; no incluir `.env` en el ZIP público.
8. Iniciar con `npm start`, comprobar `GET /api/health` (debe devolver `ok:true`) y registrar una cuenta nueva.
9. Probar en orden: crear comunidad → crear huerto con filas/columnas → registrar ficha de planta con una cuenta administradora → asignar planta a casilla → recargar página → añadir actividad fotográfica → revisarla.

## Cobertura de historias de usuario

| Historia | Estado de implementación en código | Verificación pendiente |
| --- | --- | --- |
| HU-001 | Registro/login, bcrypt, cookie HttpOnly y roles de servidor | API sobre BD real y sesiones HTTPS |
| HU-002 | Comunidades, tipos y vínculo por correo | Flujo de creación/vinculación end-to-end |
| HU-003 | CRUD de plantas solo para ADMIN_MSP | Catálogo oficial y fuentes verificadas |
| HU-004 | Formulario y persistencia Prisma, área 1–400 m², filas y columnas | Inserción real y validación agrícola |
| HU-005 | Cuadrícula y filtros, unicidad BD por casilla | E2E en navegador y datos preexistentes |
| HU-006 | Actividades fotográficas y cálculo lunar aproximado | Persistencia de imágenes, reglas del PDF |
| HU-007 | Revisión transaccional, niveles y ranking de huertos activos | Fórmula y puntos contrastados con PDF |

## Pruebas locales realizadas

- `npm run check`: validación sintáctica de servidor, app y seed.
- `npm test`: cinco pruebas unitarias del módulo de dominio.
- La instalación de dependencias o validación Prisma puede quedar pendiente en entornos sin acceso a npm. No equivale a una prueba funcional completa.

## Datos existentes

No elimina datos anteriores. La normalización visual A-1 → A1 mantiene la lectura de casillas históricas, pero **no migra** las claves antiguas. Si hay datos, se recomienda migración controlada con backup antes de crear nuevos cultivos sobre posiciones antiguas. No ejecutar seeds de demostración sobre una base productiva.
