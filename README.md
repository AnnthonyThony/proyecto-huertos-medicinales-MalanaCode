# Kawsapacha — Tierra & Comunidad

Plataforma integral de gestión comunitaria para huertos medicinales andinos. El sistema combina planificación agronómica, un espejo digital 2D interactivo de parcelas, catálogo botánico con especificaciones de cosecha (Norma Técnica MSP 2017), reloj lunar andino con ponderación sinódica, bitácora fotográfica, gobernanza por roles y permisos granulares, saberes tradicionales, retos comunitarios, foro deliberativo («La Asamblea») y bodega de insumos con trazabilidad postcosecha («El Resguardo»).

---

## 1. Características Principales

### Gestión de Comunidades y Huertos
- **Gobernanza Comunitaria:** Creación de comunidades (individual, familiar, condominio o barrial) con 11 permisos granulares e invitaciones seguras con perfiles predefinidos.
- **Configuración Agronómica:** Huertos de 1 a 400 m² con selección de suelo (arcilloso, limoso, arenoso, margoso, gredoso, pantanoso) y fuentes de riego oficiales (Río, Canal/Acequia, Goteo, Agua potable).
- **Espejo Digital 2D:** Cuadrícula virtual personalizable (`A–T × 1–20`, hasta 160 casillas) con suelo texturizado fijo y representación visual de especies botánicas por etapa de desarrollo.

### Catálogo Botánico y Ciclo Lunar
- **Catálogo Botánico:** 14 especies medicinales andinas con taxonomía, cualidad térmica (cálida o fresca), requerimientos de suelo, recomendaciones de recolección y partes aprovechadas según la Norma Técnica MSP 2017.
- **Reloj Lunar Andino:** 4 fases lunares tradicionales (*Yana Killa, Wiñak Killa, Pura Killa, Wañuk Killa*) con calendario proyectado a 8 días y bonificación lunar en labores agrícolas oportunas.

### Bitácora, Evidencias y Trazabilidad
- **Bitácora Agrícola:** Registro de labores agrícolas (preparación, siembra, riego, cuidado, cosecha) con adjuntos fotográficos y validación comunitaria estricta (anti-autovalidación).
- **Bodega e Inventario:** Control de stock de insumos con prevención de sobregiro y registro de lotes de secado con emisión de etiquetas oficiales de trazabilidad (100 g).
- **Gamificación y Saberes:** Niveles de experiencia (Aprendiz, Oficial, Maestro), certificación de talentos ancestrales (+25 pts) y ranking justo proporcional por cultivo activo.

---

## 2. Tecnologías y Arquitectura

- **Frontend:** HTML5 semántico, CSS3 con variables de diseño (temas claro y oscuro), JavaScript vanilla estructurado, Bootstrap 5 (componentes base), Bootstrap Icons y animaciones fluidas con GSAP + ScrollTrigger (respetando `prefers-reduced-motion`).
- **Backend:** Node.js 22/24 con Express, Helmet (políticas CSP estrictas), Express Rate Limit, Cookie-Parser, Multer con procesamiento y sanitización Sharp, Bcrypt (cost factor 10) y JSON Web Tokens (JWT) en cookies HttpOnly y Secure.
- **Base de Datos:** PostgreSQL 16 con Prisma ORM 6.14 (migraciones versionadas e índices compuestos únicos).
- **Infraestructura:** Docker Engine & Docker Compose con balanceo y terminación SSL vía Nginx Reverse Proxy (TLS 1.2/1.3, HSTS y cabeceras de seguridad activas).

---

## 3. Estructura del Proyecto

```text
kawsapacha-mvp/
├── backups/           # Respaldos de base de datos y medios
├── prisma/            # Esquema de base de datos, migraciones y datos iniciales
│   ├── migrations/    # Historial de migraciones SQL versionadas
│   ├── schema.prisma  # Modelo de datos declarativo
│   └── seed.js        # Sincronización de catálogo botánico y cuentas base
├── public/            # Interfaz web pública y recursos estáticos
│   ├── assets/        # Fotografías botánicas recortadas y texturas
│   ├── css/           # Estilos modulares y temas
│   ├── js/            # Controlador de animaciones GSAP
│   ├── app.js         # Lógica central del cliente frontend
│   └── index.html     # Punto de entrada de la aplicación
├── scripts/           # Herramientas de despliegue, configuración y respaldo
├── src/               # Código fuente del backend
│   ├── domain.js      # Lógica de dominio, ciclo lunar, permisos y reglas
│   └── server.js      # API REST, autenticación, seguridad y controladores
├── tests/             # Suites de pruebas automatizadas
│   ├── domain.test.js           # Pruebas unitarias de dominio
│   ├── test_v2_functional.mjs   # Pruebas de integración funcional
│   ├── test_audit_concurrency.mjs # Pruebas de concurrencia e idempotencia
│   └── test_wizards_clean.mjs   # Pruebas E2E y responsivas Playwright
├── docker-compose.yml # Definición de servicios (aplicación y PostgreSQL)
├── Dockerfile         # Construcción multicapa del contenedor
└── package.json       # Dependencias y comandos de ejecución
```

---

## 4. Instalación y Despliegue

### Requisitos Previos
- Docker Engine 24+ y Docker Compose v2.
- Servidor Linux (VPS) con puertos 80 y 443 accesibles.
- Dominio con registros DNS apuntando a la IP del VPS.

### Despliegue con Docker Compose

1. Clonar o ubicar el proyecto en el servidor:
   ```bash
   cd /root/kawsapacha-mvp
   ```

2. Generar el archivo de entorno `.env` seguro:
   ```bash
   bash scripts/configurar.sh admin@ejedigital.dev
   ```

3. Construir e iniciar los contenedores de producción:
   ```bash
   docker compose up -d --build
   ```

4. Comprobar el estado de los servicios:
   ```bash
   docker compose ps
   curl -I http://127.0.0.1:3100/api/health
   ```

5. Configurar el proxy inverso Nginx con certificado SSL (Let's Encrypt). El archivo de configuración de ejemplo se encuentra en `scripts/nginx-ejemplo.conf`.

---

## 5. Pruebas Automatizadas

El proyecto cuenta con cuatro niveles de pruebas integradas:

```bash
# 1. Pruebas unitarias de dominio (fases lunares, permisos, puntuación)
npm test

# 2. Comprobación estricta de sintaxis
npm run check

# 3. Pruebas de integración funcional de la API
node tests/test_v2_functional.mjs

# 4. Pruebas de concurrencia e idempotencia transaccional
node tests/test_audit_concurrency.mjs

# 5. Pruebas visuales E2E y responsividad Playwright (7 resoluciones x 2 temas)
node tests/test_wizards_clean.mjs
```

---

## 6. Roles y Permisos

El sistema implementa dos roles globales y once permisos granulares de comunidad:

- **Roles de Cuenta:**
  - `ADMINISTRADOR`: Acceso a auditoría global, gestión de usuarios, creación de retos y revisión de catálogo botánico.
  - `USUARIO`: Participación comunitaria, creación de comunidades, registro de huertos, labores agrícolas y declaración de saberes.
- **Permisos Granulares:** `VIEW_COMMUNITY`, `VIEW_GARDENS`, `CREATE_GARDENS`, `EDIT_GARDENS`, `MANAGE_CROPS`, `REGISTER_ACTIVITIES`, `UPLOAD_EVIDENCE`, `VIEW_LOGS`, `EDIT_OWN_ACTIVITIES`, `VIEW_MEMBERS`, `VIEW_STATS`.
