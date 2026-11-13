# Changelog — Kawsapacha V1

## V1 Complete (2026-11-12)

### Base de datos y migraciones
- Migración aditiva no destructiva con línea base `20261106000000_baseline` y evolución `20261112000000_v1_complete`:
  - `Community.description`
  - `Plant.botanicalNotes`, `Plant.imageAttribution`, `Plant.imageLicense`, `Plant.imageSource`
  - `Garden.description`
  - `Crop.notes`, `Crop.updatedAt`
  - `Activity.updatedAt`
- `scripts/start.sh` actualizado para detectar despliegues previos creados con `prisma db push`, marcar la línea base sin pérdida de datos y ejecutar `npx prisma migrate deploy`.
- Catálogo inicial de 12 especies botánicas reales en `prisma/seed.js` manteniendo `verified: false` (**Pendiente de validación**) por rigor editorial.

### Backend y API REST
- Nuevos y ampliados endpoints en `src/server.js` y `src/domain.js`:
  - `PATCH /api/me` para actualizar perfil del usuario autenticado.
  - `PATCH /api/comunidades/:id` para edición de comunidades por su responsable o administrador.
  - `GET/POST/PUT/DELETE /api/plantas` con metadatos botánicos y de atribución de imagen.
  - `POST/PATCH /api/huertos`, `GET /api/huertos/:id/estadisticas`, `GET /api/huertos/:id/virtual-grid` con validación de redimensionado seguro de cuadrícula.
  - `PATCH/DELETE /api/huertos/:id/cultivos/:cropId` para edición de etapa, notas y rotación.
  - `GET /api/reloj-lunar/actual` con proyección próxima (`moonUpcoming`) y filtro `?pendingReview=true` en `/api/actividades`.
  - Montaje estático local de `/vendor/gsap` compatible con la política CSP `'self'`.

### Activos visuales y Frontend V1
- 12 recortes fotográficos botánicos transparentes en formato WebP (`public/assets/plants/*.webp`) procedentes de Wikimedia Commons con licencias permisivas documentadas en `public/assets/ATTRIBUTION.json`.
- 13 imágenes WebP para hero, comunidad, tipologías de huerto (`urban`, `vertical`, `containers`, `hanging`) y texturas de terreno/suelo (`public/assets/{landing,gardens,terrain}/`).
- Landing page editorial renovada con 8 secciones, simulador visual de huerto 2D, modal de créditos de imagen y modal de alcance legal/académico.
- Espejo digital 2D realista con coordenadas `A–Z × 1–30`, niveles de zoom (`compact`, `normal`, `large`), filtros unificados entre **Vista de huerto** y **Vista de gestión**, estadísticas (`VIEW_STATS`) y soporte completo de modo claro/oscuro y pantallas de `360px` a `1920px`.

