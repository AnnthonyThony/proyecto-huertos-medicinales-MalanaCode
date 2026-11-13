# Qué se ha verificado en este paquete

**Fecha:** 30 de octubre de 2026.

## Verificaciones automáticas disponibles

- `node --check src/server.js`: sintaxis backend.
- `node --check src/domain.js`: sintaxis lógica de dominio.
- `node --check public/app.js`: sintaxis frontend.
- `node --test tests/*.test.js`: cinco pruebas de fases, bonificaciones, niveles y ranking.

## Límite de la verificación en el entorno de creación

El entorno de creación no consiguió resolver `registry.npmjs.org`, así que **no fue posible instalar los paquetes npm ni ejecutar un arranque real con PostgreSQL**. Se entrega el código completo, el manifiesto de dependencias y Docker Compose, pero antes de presentar una demostración es indispensable ejecutar el arranque y el recorrido funcional indicado en `README.md` sobre el VPS.

Las pruebas unitarias no equivalen a una prueba integral con base de datos, navegador y sesión real.
