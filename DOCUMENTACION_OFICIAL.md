# MINISTERIO DE SALUD PÚBLICA DEL ECUADOR — ESCUELA POLITÉCNICA NACIONAL
## PROYECTO KAWSAPACHA — HUERTOS MEDICINALES COMUNITARIOS
### Documento de Especificación de Requisitos, Visión y Arquitectura V1 (HU-001 a HU-007)

---

- **Entidades Promotoras:** Ministerio de Salud Pública del Ecuador (MSP) & Escuela Politécnica Nacional (EPN)
- **Concepto Central:** "El Espejo Digital" (Sincronización Tierra-Nube)
- **Marco Legal y Técnico:** Modelo de Atención Integral de Salud Familiar, Comunitario e Intercultural (MAIS-FCI), Constitución del Ecuador, Acuerdo Ministerial 244 y Lineamientos Oficiales de Huertos Medicinales (MSP, 2017)
- **Fecha de Demostración V1:** 13 de noviembre de 2026
- **Total de Horas V1:** 78 Horas de Desarrollo en Equipo
- **Metodología:** Proceso Unificado & Extreme Programming (INVEST / XP / 3 "C")
- **Stack Seleccionado:** JavaScript Full-Stack (Node.js 22 + Express + Bootstrap 5 + PostgreSQL 16 / Prisma ORM)
- **URL Oficial en Producción:** [https://kawsapacha.ejedigital.io](https://kawsapacha.ejedigital.io)
- **Visor Web de Documentación:** [https://kawsapacha.ejedigital.io/documentacion](https://kawsapacha.ejedigital.io/documentacion)

---

## 1. VISIÓN GENERAL, ANTECEDENTES Y OBJETIVOS MEDIBLES

### 1.1. Antecedentes Institucionales
El Ministerio de Salud Pública del Ecuador (MSP), dentro del marco del MAIS-FCI y el principio kichwa *Kawsapacha* (mundo vivo e inteligente), impulsa la articulación de la medicina ancestral-tradicional con el sistema formal de salud a través de huertos medicinales comunitarios (*Hampi chakra*).

### 1.2. Declaración de Visión del Producto
Para las comunidades urbanas y rurales del Ecuador, voluntarios agrícolas y personal técnico del MSP que necesitan planificar, gestionar y sostener huertos medicinales bajo saberes tradicionales y normativas técnicas, el sistema **Kawsapacha** es una plataforma web accesible y gamificada que actúa como un **"Espejo Digital"**, sincronizando las labores físicas de la tierra con una representación virtual interactiva, recompensando el trabajo comunitario y garantizando equidad entre huertos de cualquier extensión.

### 1.3. Objetivos Comerciales Medibles
- **OB-01 (Adopción Piloto):** Lograr que al menos 15 comunidades piloto registren y configuren sus huertos medicinales en los primeros 3 meses de operación.
- **OB-02 (Cumplimiento Normativo):** Alcanzar un 85% de apego a las fases del calendario lunar andino y lineamientos del MSP en las actividades de siembra y cosecha registradas.
- **OB-03 (Retención y Sostenibilidad):** Reducir la tasa de abandono de los huertos comunitarios en un 40% durante el primer año mediante mecánicas de gamificación equitativa (puntos, niveles y ranking proporcional).

---

## 2. MATRIZ RESUMEN DE HISTORIAS DE USUARIO V1

| ID | Título de la Historia de Usuario | Módulo / Épica | Prioridad | Horas | Trazabilidad RF |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HU-001** | Registro, Login por Roles y Perfil Inicial | La Semilla | Alta | 10 h | RF-01, RF-02, RF-03 |
| **HU-002** | Creación de Comunidad y Miembros Voluntarios | La Semilla | Alta | 8 h | RF-04, RF-05 |
| **HU-003** | Gestión del Catálogo Oficial de Plantas MSP | La Tierra | Alta | 8 h | RF-08, RN-HEC-01 |
| **HU-004** | Configurador Físico del Huerto y Suelos | La Tierra | Alta | 12 h | RF-06, RF-07, RF-09 |
| **HU-005** | Asociación de Cultivos y Huerto Virtual 2D | El Reflejo | Alta | 12 h | RF-10, RF-15 |
| **HU-006** | Bitácora Agrícola, Reloj Lunar y Evidencia | El Ciclo | Alta | 14 h | RF-11, RF-12, RF-13 |
| **HU-007** | Validaciones, Gamificación y Ranking Justo | La Motivación | Media/Alta | 14 h | RF-14, RF-16, RF-17 |
| **TOTAL** | **7 Historias de Usuario Principales** | **5 Épicas** | — | **78 h** | **17 Requerimientos V1** |

---

## 3. ARQUITECTURA DE SEGURIDAD: DOS ROLES GLOBALES, PROPIEDAD Y 11 PERMISOS GRANULARES

### 3.1. Los Dos Roles Globales del Sistema
En Kawsapacha existen **únicamente DOS ROLES GLOBALES**:
1. **ADMINISTRADOR**:
   - Control y supervisión global del sistema.
   - Acceso irrestricto de consulta, auditoría y administración de cualquier comunidad o huerto del país sin necesidad de membresía ni invitación.
   - Administración de cuentas (suspensión/reactivación de usuarios).
   - Gestión y validación técnica del Catálogo Oficial de Plantas Medicinales del MSP.
   - Supervisión general del Ranking Justo y auditoría (`AuditLog`).
2. **USUARIO**:
   - Rol asignado automáticamente por defecto a toda persona que se registra.
   - Capacidad de crear comunidades propias, convirtiéndose en el **propietario absoluto** (`ownerId`) de las mismas.
   - Administración integral de sus huertos, cultivos y bitácora agrícola.
   - Capacidad exclusiva de invitar colaboradores a sus comunidades, definir sus permisos granulares y revocar accesos.
   - **Regla de Inmutabilidad:** El rol global `USUARIO` **nunca muta** a un rol de seguridad superior al crear una comunidad o recibir una invitación.

> **IMPORTANTE — Diferenciación con Gamificación:** Los distintivos **Aprendiz**, **Oficial** y **Maestro** son **niveles de experiencia y gamificación** calculados según los puntos acumulados por cuidar los huertos (`0-99`, `100-299`, `≥300` puntos). **No son roles de seguridad.**

---

### 3.2. Propiedad de Comunidades y Protección contra Secuestro
- Toda comunidad registra de manera inmutable el identificador de su creador mediante el campo `ownerId` en la base de datos PostgreSQL.
- **Acciones exclusivas del propietario (o Administrador global):**
  - Enviar invitaciones con permisos granulares.
  - Modificar permisos de integrantes existentes.
  - Cancelar invitaciones pendientes.
  - Retirar integrantes de la comunidad.
  - Editar la configuración física y tipología de la comunidad.
  - Eliminar la comunidad o sus huertos asociados.
- **Inmutabilidad para Invitados:** Un colaborador invitado jamás puede invitar a terceros, alterar permisos, expulsar al propietario ni autoproclamarse administrador de la comunidad.
- **Separación de Vistas:** La interfaz separa nítidamente las comunidades en **"Mis comunidades"** (donde el usuario es propietario) y **"Compartidas conmigo"** (donde actúa como colaborador con permisos delimitados).

---

### 3.3. Catálogo Oficial de los 11 Permisos Granulares

| Código del Permiso | Categoría | Nombre en Pantalla | Alcance y Funcionalidad |
| :--- | :--- | :--- | :--- |
| `VIEW_COMMUNITY` | General | Ver comunidad | Consulta información básica y estado de la comunidad. |
| `VIEW_GARDENS` | Huertos | Ver huertos | Acceso visual a los huertos asociados a la comunidad. |
| `CREATE_GARDENS` | Huertos | Crear huertos | Registro de nuevos huertos dentro de la comunidad. |
| `EDIT_GARDENS` | Huertos | Editar huertos | Modificación de la configuración física, suelo, riego y abono. |
| `MANAGE_CROPS` | Cultivos | Gestionar cultivos | Organización de casillas 2D: asignar especies, asociar y rotar. |
| `REGISTER_ACTIVITIES` | Bitácora | Registrar actividades | Anotación de labores diarias (siembra, riego, deshierbe, cosecha). |
| `UPLOAD_EVIDENCE` | Bitácora | Subir evidencias | Carga de fotografías JPG/PNG como evidencia real de la labor. |
| `VIEW_LOGS` | Bitácora | Ver bitácora | Consulta del historial de bitácora y registros de actividad. |
| `EDIT_OWN_ACTIVITIES` | Bitácora | Editar actividades propias | Corrección de notas de labores propias antes de ser validadas. |
| `VIEW_MEMBERS` | Comunidad | Ver integrantes | Consulta de la lista de miembros colaboradores de la comunidad. |
| `VIEW_STATS` | Métricas | Ver estadísticas | Acceso a métricas de rendimiento y avance del huerto. |

---

### 3.4. Perfiles Predefinidos de Invitación
Al invitar a un usuario por correo electrónico, el propietario puede seleccionar rápidamente un perfil predeterminado o personalizar los permisos casilla por casilla:
- **Solo lectura (`READ_ONLY`):** `VIEW_COMMUNITY`, `VIEW_GARDENS`, `VIEW_LOGS`, `VIEW_MEMBERS`, `VIEW_STATS`.
- **Colaborador agrícola (`AGRICULTURAL_COLLABORATOR`):** Perfil de solo lectura más `REGISTER_ACTIVITIES`, `UPLOAD_EVIDENCE`, `EDIT_OWN_ACTIVITIES`.
- **Colaborador avanzado (`ADVANCED_COLLABORATOR`):** Perfil agrícola más `CREATE_GARDENS`, `EDIT_GARDENS`, `MANAGE_CROPS`.
- **Personalizado (`CUSTOM`):** Cualquier combinación de los 11 permisos seleccionada manualmente.

---

### 3.5. Ciclo de Vida de Invitaciones
1. **PENDIENTE:** Creada por el propietario indicando correo del invitado y permisos otorgados.
2. **ACEPTADA:** El invitado confirma su participación voluntaria; se crea automáticamente su registro en `CommunityMember` con los permisos asignados.
3. **RECHAZADA:** El invitado declina la invitación sin consecuencias para su cuenta.
4. **CANCELADA:** El propietario anula una invitación antes de que el receptor la procese.

---

### 3.6. Regla Estricta Anti-Fraude: Prevención de Autovalidación
Para evitar la alteración deshonesta del Ranking Justo y la acreditación ilícita de puntos:
- **Un usuario jamás puede autovalidar sus propias evidencias fotográficas**, aun siendo el propietario de la comunidad.
- Las evidencias registradas por el propietario son validadas por el Administrador Global del MSP, preservando la legitimidad comunitaria e intercultural del sistema.

---

### 3.7. Registro de Auditoría Inmutable (AuditLog)
Toda acción administrativa queda registrada en la base de datos con marca temporal, IP de origen, usuario y detalles JSON:
- `COMMUNITY_CREATED`, `COMMUNITY_DELETED`
- `INVITATION_SENT`, `INVITATION_ACCEPTED`, `INVITATION_REJECTED`, `INVITATION_CANCELLED`
- `PERMISSIONS_UPDATED`, `MEMBER_REMOVED`
- `GARDEN_CREATED`, `GARDEN_UPDATED`, `GARDEN_DELETED`, `GARDEN_VALIDATED_MSP`
- `ACTIVITY_REGISTERED`, `ACTIVITY_VALIDATED`
- `USER_SUSPENDED`, `USER_REACTIVATED`

---

## 4. ESPECIFICACIÓN DETALLADA DE HISTORIAS DE USUARIO (HU-001 A HU-007)

### HU-001: Registro, Autenticación por Roles y Perfil Evolutivo Inicial ("La Semilla")
- **Prioridad:** Alta | **Estimación:** 10 horas | **Trazabilidad:** RF-01, RF-02, RF-03, RNF-02, RNF-03
- **Narrativa:** Como un voluntario comunitario, quiero registrarme e iniciar sesión en la plataforma web con un formulario sencillo que me asigne automáticamente el nivel inicial de Aprendiz, para acceder a las funciones de mi rol y empezar a acumular puntos por cuidar el huerto medicinal.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Registro exitoso con nivel Aprendiz):**
  - *Dado* que un ciudadano no registrado se encuentra en la pantalla de registro web,
  - *Cuando* ingresa su nombre completo, un correo electrónico único, una contraseña (mínimo 8 caracteres), fecha de nacimiento, género y selecciona sus talentos ancestrales declarados pulsando "Crear Cuenta",
  - *Entonces* el sistema cifra la contraseña con bcrypt (factor >= 10 rondas), guarda el usuario en la base de datos con nivel de experiencia "APRENDIZ" y 0 puntos, emite cookie de sesión segura y muestra su panel de bienvenida.
- **Escenario 2 (Ideal - Inicio de sesión y redirección por rol):**
  - *Dado* que un usuario registrado se encuentra en la pantalla de inicio de sesión,
  - *Cuando* ingresa su correo y contraseña válidos,
  - *Entonces* el sistema verifica sus credenciales, genera su sesión/token JWT y lo redirige automáticamente a la vista correspondiente a su rol (ADMIN_MSP, MAESTRO o VOLUNTARIO).
- **Escenario 3 (Excepcional - Correo duplicado o acceso no autorizado):**
  - *Dado* que un usuario intenta registrarse con un correo ya existente o intenta abrir una ruta exclusiva del Administrador MSP sin tener ese rol,
  - *Cuando* envía la solicitud al servidor,
  - *Entonces* el sistema rechaza la operación mostrando un mensaje claro en español ("Este correo ya está registrado") o devuelve un estado HTTP 403 Forbidden bloqueando el acceso.

#### Tareas Técnicas (10 h):
1. Crear el esquema de base de datos de la tabla `User` con campos de rol, nivel y puntos (2 h).
2. Programar en Express los endpoints `POST /api/auth/register` y `POST /api/auth/login` con bcrypt y JWT (3 h).
3. Diseñar en HTML5 + Bootstrap 5 las pantallas de Registro y Login con accesibilidad tipográfica (3 h).
4. Ejecutar pruebas unitarias verificando cifrado, cookies seguras y control de acceso (2 h).

---

### HU-002: Creación de Comunidad de Siembra y Vinculación de Miembros ("La Semilla")
- **Prioridad:** Alta | **Estimación:** 8 horas | **Trazabilidad:** RF-04, RF-05 | **Regla:** RN-HEC-02
- **Narrativa:** Como un maestro comunitario, quiero registrar mi comunidad de siembra (individual, familiar, condominio o barrial) y agregar a los vecinos o familiares voluntarios mediante su correo electrónico, para organizar nuestro equipo de trabajo agrícola en un mismo espacio digital.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Creación de comunidad escalable):**
  - *Dado* que un usuario autenticado accede a la opción "Crear Comunidad",
  - *Cuando* ingresa un nombre único de comunidad, selecciona mediante botones su tipología (INDIVIDUAL, FAMILIAR, CONDOMINIO o BARRIAL) e ingresa el teléfono de contacto,
  - *Entonces* el sistema registra la comunidad, asigna al creador como responsable (MAESTRO) y lo vincula en la tabla de miembros.
- **Escenario 2 (Ideal - Vinculación de miembro voluntario):**
  - *Dado* que el Maestro Comunitario visualiza el panel de su comunidad,
  - *Cuando* ingresa el correo electrónico de un usuario registrado y pulsa "Agregar Voluntario",
  - *Entonces* el sistema crea el vínculo activo en `CommunityMember` y muestra al nuevo integrante en la lista del equipo.
- **Escenario 3 (Excepcional - Nombre repetido o usuario inexistente):**
  - *Dado* que se intenta crear una comunidad con un nombre ya registrado o agregar un correo inexistente,
  - *Cuando* se pulsa el botón de guardado,
  - *Entonces* el sistema detiene el registro, conserva los datos ingresados y muestra una alerta descriptiva.

#### Tareas Técnicas (8 h):
1. Crear modelos `Community` y `CommunityMember` con claves foráneas e índices únicos hacia `User` (2 h).
2. Codificar los endpoints `POST /api/comunidades` y `POST /api/comunidades/:id/miembros` (2.5 h).
3. Construir la interfaz de "Mi Comunidad" con tarjetas seleccionables de tipología (2 h).
4. Pruebas de integración del flujo de membresía comunitaria (1.5 h).

---

### HU-003: Gestión y Consulta del Catálogo Oficial de Plantas Medicinales MSP ("La Tierra")
- **Prioridad:** Alta | **Estimación:** 8 horas | **Trazabilidad:** RF-08, RF-09 | **Reglas:** RN-HEC-01, RN-RES-04
- **Narrativa:** Como un administrador del MSP, quiero gestionar y mantener precargado el catálogo oficial de plantas medicinales con su cualidad térmica (caliente o fría), ciclo, altitud y usos, para que las comunidades consulten información fitoterapéutica validada y sin errores.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Registro y señalética térmica oficial):**
  - *Dado* que un Administrador del MSP accede al formulario del catálogo oficial,
  - *Cuando* registra una planta ingresando su nombre científico único, nombre común, familia, pisos altitudinales, ciclo (CORTO/LARGO), usos, contraindicaciones y cualidad térmica (CALIENTE o FRIA),
  - *Entonces* el sistema asigna la señalética oficial (distintivo cromático Rojo para cálidas y Verde/Blanco para frías según RN-HEC-01) y publica la ficha.
- **Escenario 2 (Ideal - Consulta pública accesible):**
  - *Dado* que cualquier visitante o voluntario abre el Catálogo de Plantas,
  - *Cuando* filtra por planta caliente o fría o busca por texto,
  - *Entonces* el sistema muestra tarjetas visuales con foto, distintivo térmico visible, propiedades y precauciones.
- **Escenario 3 (Excepcional - Rango de altitud inválido):**
  - *Dado* que se intenta guardar una planta con altitud mínima mayor a la máxima o sin nombre científico,
  - *Cuando* se envía el formulario,
  - *Entonces* el sistema bloquea el guardado y resalta los campos con error.

#### Tareas Técnicas (8 h):
1. Modelar tablas `Plant` y `PlantSoil` e implementar script de seed controlado (2.5 h).
2. Programar endpoints `GET /api/plantas` (público) y `POST / PUT /api/plantas` (restringidos a ADMIN_MSP) (2 h).
3. Maquetar la galería botánica en Bootstrap 5 con filtros térmicos rojo/verde (2 h).
4. Validar restricciones de rol y pruebas de catálogo (1.5 h).

---

### HU-004: Configurador Físico del Huerto Real y Recomendación por Suelo ("La Tierra")
- **Prioridad:** Alta | **Estimación:** 12 horas | **Trazabilidad:** RF-06, RF-07, RF-08 | **Reglas:** RN-HEC-02, RN-RES-04
- **Narrativa:** Como un maestro comunitario, quiero configurar las características físicas de mi huerto (ubicación, área en m², tipología, cerca, suelo, riego y abono) mediante selectores guiados y recibir una recomendación automática de plantas ideales para mi suelo, para planificar la siembra en menos de 5 minutos sin errores.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Configuración válida y recomendación agronómica):**
  - *Dado* que un Maestro Comunitario abre el Configurador Físico del Huerto,
  - *Cuando* selecciona provincia, parroquia, orientación, coordenadas de Ecuador, área entre 1 m² y 400 m² inclusivo, tipología, cerca, tipo de suelo (6 del MSP: arcilloso, limoso, arenoso, margoso, gredoso, pantanoso), riego y abono,
  - *Entonces* el sistema guarda el huerto en estado PENDIENTE de validación MSP y muestra la compatibilidad botánica de suelos.
- **Escenario 2 (Excepcional - Área fuera de límites o campo faltante):**
  - *Dado* que se intenta registrar un área <= 0 m², > 400 m² o se omite el tipo de suelo,
  - *Cuando* se pulsa "Guardar Huerto",
  - *Entonces* el sistema bloquea el envío, conserva todos los datos ingresados en pantalla (RF-10) y muestra una alerta formativa.

#### Tareas Técnicas (12 h):
1. Crear migración de la tabla `Garden` con parámetros agronómicos, geográficos y dimensiones de matriz (2 h).
2. Programar endpoints de creación y consulta de huertos vinculados a comunidades (3.5 h).
3. Diseñar formulario por pasos en Bootstrap 5 con controles accesibles e iconografía (4 h).
4. Pruebas de límites de área (0, 1, 400, 401 m²) y persistencia (2.5 h).

---

### HU-005: Asociación de Cultivos y Huerto Virtual 2D ("El Reflejo")
- **Prioridad:** Alta | **Estimación:** 12 horas | **Trazabilidad:** RF-10, RF-15, RNF-01, RNF-05
- **Narrativa:** Como un miembro de la comunidad, quiero visualizar nuestro Huerto Virtual como un tablero sencillo de tarjetas 2D organizadas por cuadrícula (mostrando nombre de planta, borde rojo o verde según sea caliente o fría, etapa actual y último riego), para entender el estado de nuestras plantas desde cualquier dispositivo sin complicaciones.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Asociación de planta a casilla de la cuadrícula):**
  - *Dado* que el huerto se encuentra configurado,
  - *Cuando* el responsable selecciona una casilla disponible (ej. A1), elige una planta del catálogo, técnica de siembra (SURCOS, TERRAZAS, CAMELLONES, RECIPIENTES) y propagación (SEMILLAS, ESTACAS, ESQUEJES, PLANTULAS),
  - *Entonces* el sistema crea el registro en `Crop` con etapa inicial PREPARACION y renderiza la celda en el tablero.
- **Escenario 2 (Ideal - Renderizado rápido y responsivo < 2.5 s):**
  - *Dado* que un usuario abre el Huerto Virtual desde móvil (360px) o PC (1920px),
  - *Cuando* carga la pantalla,
  - *Entonces* el sistema renderiza en menos de 2.5 s (RNF-01) la cuadrícula responsiva con bordes térmicos, etapa y fotos aprobadas.
- **Escenario 3 (Excepcional - Intento de doble cultivo en una misma casilla):**
  - *Dado* que la casilla A1 ya cuenta con un cultivo registrado,
  - *Cuando* se intenta asignar otra planta en esa misma coordenada,
  - *Entonces* el sistema impide la colisión y devuelve código HTTP 409 Conflict.

#### Tareas Técnicas (12 h):
1. Crear modelo `Crop` vinculando huerto, planta y celda con índice de unicidad `[gardenId, cell]` (2 h).
2. Programar endpoints `POST /api/huertos/:id/cultivos` y `GET /api/huertos/:id/virtual-grid` (3 h).
3. Construir la cuadrícula matricial interactiva en CSS Grid / Bootstrap 5 con filtros dinámicos (5 h).
4. Pruebas de rendimiento de renderizado en cliente y dispositivos móviles (2 h).

---

### HU-006: Bitácora de Actividades Agrícolas, Reloj Lunar y Evidencia Fotográfica ("El Ciclo")
- **Prioridad:** Alta | **Estimación:** 14 horas | **Trazabilidad:** RF-11, RF-12, RF-13 | **Reglas:** RN-RES-01 a RN-RES-04
- **Narrativa:** Como un voluntario comunitario, quiero ver en la cabecera en qué fase lunar andina estamos hoy y registrar mis labores de preparación, siembra, riego, cuidado o cosecha subiendo una foto desde mi celular, para dejar constancia de mi trabajo y saber si cumplo el calendario ancestral del MSP.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Actividad en fase lunar óptima con bonificador 1.25x):**
  - *Dado* que el Reloj Lunar indica la fase óptima (Wiñak Killa o Pura Killa para siembra),
  - *Cuando* el voluntario registra su labor en una casilla y sube una foto JPG/PNG <= 5 MB,
  - *Entonces* el sistema guarda la actividad en estado PENDIENTE con cumplimiento lunar óptimo (`factor = 1.25`).
- **Escenario 2 (Alternativo Educativo - Actividad fuera de fase):**
  - *Dado* que la fase actual es Yana Killa (recomendada para preparación profunda),
  - *Cuando* el voluntario registra una siembra con fotografía válida,
  - *Entonces* el sistema muestra un mensaje educativo sobre el saber andino y registra la actividad con factor normal (`factor = 1.00`).
- **Escenario 3 (Excepcional - Archivo sin foto, formato inválido o peso > 5 MB):**
  - *Dado* que se intenta enviar un archivo no admitido (.pdf, .exe) o mayor a 5 MB,
  - *Cuando* se envía la solicitud,
  - *Entonces* el middleware Multer y el inspector de Magic Bytes rechazan la carga informando el error.

#### Tareas Técnicas (14 h):
1. Modelar tabla `Activity` y configurar almacenamiento seguro con Multer (límite 5 MB) (3 h).
2. Programar algoritmo astronómico sinódico de fases andinas y matriz de labores (3.5 h).
3. Endpoints `GET /api/reloj-lunar/actual` y `POST /api/cultivos/:id/actividades` (3 h).
4. Componente visual de Reloj Lunar y modal multipart con soporte de cámara móvil (2.5 h).
5. Pruebas de validación binaria de imágenes y control de formatos (2 h).

---

### HU-007: Flujo de Validación, Motor de Gamificación y Ranking Nacional Justo ("La Motivación")
- **Prioridad:** Media/Alta | **Estimación:** 14 horas | **Trazabilidad:** RF-14, RF-16, RF-17 | **Reglas:** RN-HAB-01, RN-INF-01, RN-COM-01
- **Narrativa:** Como un maestro comunitario o administrador del MSP, quiero aprobar con un solo clic las evidencias fotográficas y los huertos registrados para que el sistema sume automáticamente puntos, actualice el nivel de los voluntarios y ordene el Ranking Nacional Justo, manteniendo motivadas a las comunidades sin importar el tamaño de su huerto.

#### Criterios de Aceptación (Gherkin):
- **Escenario 1 (Ideal - Habilitación técnica de huerto por Admin MSP):**
  - *Dado* que existe un huerto en estado PENDIENTE,
  - *Cuando* el Administrador MSP revisa sus datos técnicos y pulsa "Aprobar Huerto",
  - *Entonces* el estado cambia a ACTIVO y queda formalmente habilitado para el Ranking Público.
- **Escenario 2 (Ideal - Aprobación de evidencia, puntos y progresión de nivel):**
  - *Dado* que el responsable revisa una actividad PENDIENTE con fotografía legítima,
  - *Cuando* pulsa "Aprobar Evidencia",
  - *Entonces* el estado cambia a APROBADA, se acreditan los puntos con el factor lunar correspondiente, se actualiza el nivel del voluntario (Aprendiz 0-99, Oficial 100-299, Maestro >= 300) y se actualiza el puntaje del huerto.
- **Escenario 3 (Excepcional - Rechazo sin motivo o prevención de doble acreditación):**
  - *Dado* que se intenta rechazar una labor sin ingresar una nota de observación o se intenta aprobar dos veces la misma evidencia,
  - *Cuando* el servidor procesa la petición,
  - *Entonces* el sistema rechaza la operación manteniendo la integridad de los puntajes.

#### Tareas Técnicas (14 h):
1. Implementar motor de cálculo de gamificación y algoritmo de Ranking Justo (3.5 h).
2. Endpoints transaccionales `PATCH /api/huertos/:id/validar-msp`, `PATCH /api/actividades/:id/validar-maestro` y `GET /api/ranking` (4 h).
3. Interfaz de moderación de evidencias y tabla pública del Ranking Nacional (4 h).
4. Pruebas de escalafón de niveles, fórmula proporcional y consistencia concurrente (2.5 h).

---

## 4. ESTRATEGIA DE ENTREGA INCREMENTAL: ALCANCE V1 VS. V2

Para garantizar un producto robusto y operativo para la demostración del 13 de noviembre sin incurrir en desbordamiento de alcance (*scope creep*), se delimitó estrictamente el entregable:

| Módulo / Funcionalidad | Versión 1 (V1 — Entrega 13 de Noviembre) | Versión 2 (V2 — Roadmap Posterior) |
| :--- | :--- | :--- |
| **FE-01: Usuarios y Comunidades** | Registro, login, roles (Admin, Maestro, Voluntario), perfil Aprendiz y comunidades (Individual, Familiar, Condominio, Barrial). | Certificación avanzada de saberes ancestrales e historial médico extendido. |
| **FE-02: Configurador Físico** | Georreferenciación, área ($1 \text{ a } 400\text{ m}^2$), 6 tipos de suelo del MSP, riego, cerca, abono y compatibilidad botánica. | Recetario interactivo de biopreparados (purines) y mapeo alelopático avanzado contra plagas. |
| **FE-03: Catálogo Oficial MSP** | Fichas botánicas precargadas, cualidad térmica (Cálida/Roja vs. Fría/Verde), usos y contraindicaciones. | Búsqueda por patologías clínicas complejas, dosificación y fichas en ultra alta resolución. |
| **FE-04: Reloj Agrícola** | Cálculo sinódico de 4 fases andinas, bonificación 1.25x en bitácora y subida de fotos (JPG/PNG $\le 5\text{ MB}$). | Notificaciones push en las 5 franjas energéticas andinas (05:00, 08:00, 11:00, 17:00, 23:00) e histórico anual. |
| **FE-05: Huerto Virtual & Gamificación** | Tablero 2D matricial, estados fenológicos, suma de puntos, niveles (Aprendiz/Oficial/Maestro) y Ranking Justo. | Representación 3D isométrica animada, insignias desbloqueables y torneos inter-barriales. |
| **FE-06: Moderación y Validación** | Aprobación de huertos por Admin MSP y validación de evidencias fotográficas por Maestro Comunitario. | Moderación comunitaria de foros y auditorías técnicas multi-criterio. |
| **FE-07: Bodega e Inventario** | *Excluido deliberadamente de V1 para proteger la fecha de entrega.* | Control de 3 categorías de bodega (herramientas, semillas, abonos), secado post-cosecha y etiquetas de 100 g. |
| **FE-08: Foro Comunitario** | *Excluido deliberadamente de V1 para proteger la fecha de entrega.* | Diálogo de saberes, asamblea virtual comunitaria, ferias de trueque y banco de semillas. |

---

## 5. CATÁLOGO OFICIAL DE REGLAS DE NEGOCIO (MSP 2017)

Las reglas provienen del manual oficial *Lineamientos para la implementación de huertos medicinales en el Primer Nivel de Atención* (MSP, 2017):

| Código | Tipo | Enunciado Normativo de la Regla de Negocio | Origen Oficial |
| :--- | :--- | :--- | :--- |
| **RN-HEC-01** | Hecho | Toda planta del catálogo posee una única cualidad térmica: Planta Caliente (señalética roja) o Planta Fresca/Fría (señalética verde/blanca). | Lineamientos MSP 2017 (Fase III, Anexo 5) |
| **RN-HEC-02** | Hecho | Los suelos se clasifican en 6 tipos: arcilloso, limoso, arenoso, margoso, gredoso y pantanoso, cada uno con especies vegetales afines. | Lineamientos MSP 2017 (Fase I, Tabla 1) |
| **RN-RES-01** | Restricción | La preparación y abonado profundo del suelo solo debe ejecutarse en Luna Oscura (*Yana Killa*), requiriendo 15 días de reposo previo a la siembra. | Lineamientos MSP 2017 (Fase II, Anexo 4) |
| **RN-RES-02** | Restricción | La siembra debe realizarse en Luna Creciente (*Wiñak Killa*) o Luna Llena (*Pura Killa*), preferentemente en franja matutina tras el ritual de inicio. | Lineamientos MSP 2017 (Fase III, Anexo 4) |
| **RN-RES-03** | Restricción | La cosecha de hojas, flores y frutos exige Luna Creciente o Llena; la cosecha de raíces, tubérculos y semillas exige Cuarto Menguante (*Wañuk Killa*). | Lineamientos MSP 2017 (Fase III) |
| **RN-RES-04** | Restricción | Se prohíbe el uso de agroquímicos sintéticos. El manejo de plagas debe realizarse únicamente con plantas protectoras, ceniza, cal o biopreparados. | Lineamientos MSP 2017 (Fases II y III) |
| **RN-HAB-01** | Habilitador | Cuando el Maestro Comunitario aprueba una evidencia fotográfica, el sistema acredita de inmediato los puntos al voluntario y actualiza el huerto. | Definición del Proyecto (El Reflejo) |
| **RN-INF-01** | Inferencia | Escala de progresión: 0 a 99 puntos $\rightarrow$ Aprendiz; 100 a 299 puntos $\rightarrow$ Oficial; $\ge 300$ puntos $\rightarrow$ Maestro. | Definición del Proyecto (La Semilla) |
| **RN-COM-01** | Cómputo | El Puntaje de Ranking Justo ($PRJ$) se calcula como: $PRJ = \left(\frac{\sum \text{Puntos Validados}}{\text{Cultivos Activos}}\right) \times \text{Factor Lunar}$ (Factor 1.25 en fase, 1.00 fuera de fase). | Regla de Equidad Comunitaria |

---

## 6. ESPECIFICACIÓN DE REQUERIMIENTOS ATÓMICOS

### 6.1. Requerimientos Funcionales V1 (Entregable 13 de Noviembre)
- **RF-01:** El sistema deberá registrar cuentas de usuario solicitando nombre, correo único, contraseña, fecha de nacimiento, género y talentos ancestrales.
- **RF-02:** El sistema deberá asignar automáticamente el nivel Aprendiz y 0 puntos a todo usuario al completar su registro.
- **RF-03:** El sistema deberá autenticar a los usuarios mediante credenciales cifradas y redirigirlos al panel de su rol (Admin, Maestro, Voluntario).
- **RF-04:** El sistema deberá permitir la creación de comunidades indicando nombre único, tipología (Individual, Familiar, Condominio, Barrial) y teléfono.
- **RF-05:** El sistema deberá permitir al Maestro Comunitario vincular usuarios registrados como miembros activos de su comunidad por correo.
- **RF-06:** El sistema deberá registrar la configuración física del huerto capturando provincia, parroquia, coordenadas, orientación y área ($1 \text{ m}^2 \text{ a } 400 \text{ m}^2$).
- **RF-07:** El sistema deberá registrar la tipología arquitectónica, cerramiento, tipo de suelo (6 del MSP), riego y abono en la ficha del huerto.
- **RF-08:** El sistema deberá mostrar la lista de plantas del catálogo oficial compatibles con el tipo de suelo del huerto.
- **RF-09:** El sistema deberá permitir únicamente al Administrador MSP crear, editar y moderar el catálogo oficial de plantas medicinales.
- **RF-10:** El sistema deberá permitir asociar plantas del catálogo a secciones de la cuadrícula 2D del huerto indicando técnica de siembra y propagación.
- **RF-11:** El sistema deberá calcular y mostrar en tiempo real la fase lunar andina vigente (*Yana Killa*, *Wiñak Killa*, *Pura Killa*, *Wañuk Killa*) y su labor afín.
- **RF-12:** El sistema deberá permitir registrar bitácoras agrícolas adjuntando una fotografía de evidencia en formato JPG/PNG de hasta 5 MB.
- **RF-13:** El sistema deberá evaluar automáticamente si la actividad coincide con la fase lunar recomendada, asignando bonificación 1.25x.
- **RF-14:** El sistema deberá permitir al Maestro Comunitario aprobar o rechazar con observación obligatoria las evidencias fotográficas de su equipo.
- **RF-15:** El sistema deberá renderizar un Dashboard 2D interactivo con tarjetas de cultivo, distintivos térmicos oficiales (rojo/verde) y fotos aprobadas.
- **RF-16:** El sistema deberá sumar puntos y promover el nivel de experiencia del voluntario (Aprendiz $\rightarrow$ Oficial $\rightarrow$ Maestro) tras cada aprobación.
- **RF-17:** El sistema deberá calcular y publicar el Ranking Nacional Justo ($PRJ$) para huertos activos en igualdad de condiciones.

### 6.2. Requerimientos No Funcionales (Atributos de Calidad Cuantificados)
- **RNF-01 (Rendimiento):** El Dashboard 2D y el Ranking Nacional deberán cargar en un tiempo máximo de 2.5 segundos bajo carga de 50 usuarios concurrentes.
- **RNF-02 (Seguridad en Reposo):** Las contraseñas de usuarios deberán almacenarse cifradas con el algoritmo bcrypt con un factor de costo mínimo de 10 rondas.
- **RNF-03 (Control de Acceso):** El sistema deberá restringir rutas mediante tokens JWT devolviendo HTTP 403 Forbidden en el 100% de accesos no autorizados por rol.
- **RNF-04 (Usabilidad):** Un usuario nuevo deberá completar la configuración guiada de su huerto en un tiempo máximo de 5 minutos.
- **RNF-05 (Portabilidad y Responsividad):** La interfaz deberá adaptarse fluidamente a resoluciones desde 360 px (móviles) hasta 1920 px (escritorio).

---

## 7. ORGANIZACIÓN DEL EQUIPO Y RAMAS GIT (INVEST / XP)

Dado que las 7 Historias de Usuario cumplen con el principio *Independent* de INVEST y comparten el mismo esquema relacional en PostgreSQL, el desarrollo se organiza en 4 ramas paralelas en GitHub:

```text
main (Producción VPS: kawsapacha.ejedigital.io)
 └── develop (Integración continua)
      ├── feature/la-semilla       (Pareja 1: HU-001, HU-002 · Auth, roles y comunidades)
      ├── feature/la-tierra        (Pareja 2: HU-003, HU-004 · Catálogo MSP y configurador físico)
      ├── feature/el-reflejo-ciclo (Pareja 3: HU-005, HU-006 · Tablero 2D, reloj lunar y bitácora Multer)
      └── feature/la-motivacion    (Pareja 4: HU-007 · Moderación, gamificación y ranking PRJ)
```

---

## 8. ENLACES Y RECURSOS EN VIVO

- **Plataforma Kawsapacha en Producción:** [https://kawsapacha.ejedigital.io](https://kawsapacha.ejedigital.io)
- **Visor Visual de Documentación:** [https://kawsapacha.ejedigital.io/documentacion](https://kawsapacha.ejedigital.io/documentacion)
- **Archivo Markdown en Línea:** [https://kawsapacha.ejedigital.io/DOCUMENTACION.md](https://kawsapacha.ejedigital.io/DOCUMENTACION.md)
- **Repositorio en VPS:** `/root/kawsapacha-mvp`
