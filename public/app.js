(() => {
  'use strict';

  const state = {
    user: null,
    moon: null,
    moonPhases: [],
    moonUpcoming: [],
    communities: [],
    ownedCommunities: [],
    sharedCommunities: [],
    allCommunities: [],
    pendingInvitations: [],
    plants: [],
    gardens: [],
    activities: [],
    rank: [],
    dashboard: null,
    gardenDetail: null,
    gardenStats: null,
    gardenActivities: [],
    screen: 'inicio',
    gardenId: null,
    filter: 'TODAS',
    soilFilter: 'TODAS',
    cycleFilter: 'TODAS',
    verifiedFilter: 'TODAS',
    plantSort: 'name_asc',
    plantPage: 1,
    search: '',
    communityView: 'cards',
    gardenStatusFilter: 'TODAS',
    gardenSoilFilter: 'TODAS',
    gardenSearch: '',
    rankTypeFilter: 'TODAS',
    rankSearch: '',
    activityTab: 'TODAS',
    adminUsers: [],
    auditLogs: [],
    attributions: null,
    gridFilter: {
      row: 'TODAS',
      col: 'TODAS',
      q: '',
      plant: 'TODAS',
      stage: 'TODAS',
      thermal: 'TODAS',
      occupancy: 'TODAS',
      view: 'grid',
      zoom: 'normal'
    }
  };

  const themePreference = localStorage.getItem('kawsapacha_theme');
  document.documentElement.dataset.theme = themePreference || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = s => String(s ?? '').replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  const shortDate = d => d ? new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin registrar';
  const fmt = n => new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 }).format(n || 0);
  const icon = (name, cls = '') => `<i aria-hidden="true" class="bi bi-${name} ${cls}"></i>`;
  const initial = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase();

  const themeControl = () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    return `<button type="button" class="theme-toggle" data-action="toggle-theme" aria-label="Cambiar modo claro u oscuro" title="Cambiar tema">${icon(isDark ? 'sun' : 'moon-stars')} <span>${isDark ? 'Modo claro' : 'Modo oscuro'}</span></button>`;
  };

  const ROLES = { ADMINISTRADOR: 'Administrador', USUARIO: 'Usuario' };
  const LEVELS = { APRENDIZ: 'Aprendiz', OFICIAL: 'Oficial', MAESTRO: 'Maestro' };
  const SOILS = ['ARCILLOSO', 'LIMOSO', 'ARENOSO', 'MARGOSO', 'GREDOSO', 'PANTANOSO'];
  const ARCH_LABELS = { TIERRA: 'En tierra / parcelas', VERTICAL: 'Huerto vertical', COLGANTE: 'Huerto colgante', PISO: 'En recipientes / piso' };
  const STATUS_LABELS = {
    ACTIVO: 'Activo',
    PENDIENTE: 'Pendiente',
    OBSERVADO: 'Observado',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada'
  };
  const STAGE_LABELS = {
    PREPARACION: 'Preparación del suelo',
    SIEMBRA: 'Siembra / brote inicial',
    CRECIMIENTO: 'Crecimiento vegetal',
    COSECHA: 'Listo para cosecha'
  };
  const TASK_LABELS = {
    PREPARACION: 'Preparación del terreno',
    SIEMBRA: 'Siembra',
    RIEGO: 'Riego',
    CUIDADO: 'Cuidado y manejo',
    COSECHA: 'Cosecha'
  };
  const COMMUNITY_TYPE_LABELS = {
    INDIVIDUAL: 'Individual',
    FAMILIAR: 'Familiar',
    CONDOMINIO: 'Condominio',
    BARRIAL: 'Barrial'
  };
  const IRRIGATION_LABELS = {
    RIO: 'Río (Superficial)',
    CANAL: 'Canal o acequia',
    GOTEO: 'Goteo localizado',
    AGUA_POTABLE: 'Agua potable',
    MANUAL: 'Manual (Regadera)',
    ASPERSION: 'Aspersión giratoria'
  };
  const TALENT_CATEGORIES = {
    SIEMBRA: 'Siembra y propagación vegetal',
    PREPARACION_SUELO: 'Preparación de suelo y compostaje',
    PLANTAS_MEDICINALES: 'Manejo e identificación de plantas medicinales',
    RECOLECCION: 'Recolección, cosecha y secado',
    COMPOSTAJE: 'Abonos orgánicos y biopreparados',
    SABERES_ANCESTRALES: 'Saberes tradicionales y cosmovisión andina'
  };
  const TALENT_STATUS_LABELS = {
    DECLARADO: 'Declarado',
    PENDIENTE: 'En revisión',
    VALIDADO: 'Certificado',
    RECHAZADO: 'No certificado'
  };
  const INVENTORY_CATEGORIES = {
    HERRAMIENTAS: 'Herramientas y Equipamiento',
    SEMILLAS: 'Semillas y Material Genético',
    ABONOS: 'Abonos y Biopreparados'
  };
  const AUDIT_ACTION_LABELS = {
    USER_REGISTERED: 'Cuenta registrada',
    USER_LOGIN: 'Inicio de sesión',
    PROFILE_UPDATED: 'Perfil actualizado',
    USER_SUSPENDED: 'Usuario suspendido',
    USER_REACTIVATED: 'Usuario reactivado',
    COMMUNITY_CREATED: 'Comunidad creada',
    COMMUNITY_UPDATED: 'Comunidad actualizada',
    COMMUNITY_DELETED: 'Comunidad eliminada',
    INVITATION_SENT: 'Invitación enviada',
    INVITATION_ACCEPTED: 'Invitación aceptada',
    INVITATION_REJECTED: 'Invitación rechazada',
    INVITATION_CANCELLED: 'Invitación cancelada',
    MEMBER_PERMISSIONS_UPDATED: 'Permisos actualizados',
    MEMBER_REMOVED: 'Integrante retirado',
    GARDEN_CREATED: 'Huerto registrado',
    GARDEN_UPDATED: 'Huerto actualizado',
    GARDEN_DELETED: 'Huerto eliminado',
    GARDEN_VALIDATED_MSP: 'Validación de huerto',
    CROP_CREATED: 'Cultivo asignado',
    CROP_UPDATED: 'Cultivo actualizado',
    CROP_DELETED: 'Casilla liberada',
    ACTIVITY_REGISTERED: 'Actividad registrada',
    ACTIVITY_UPDATED: 'Actividad editada',
    ACTIVITY_REVIEWED: 'Evidencia revisada',
    PLANT_CREATED: 'Planta registrada',
    PLANT_UPDATED: 'Planta actualizada',
    PLANT_DELETED: 'Planta eliminada',
    PLANT_IMAGE_UPLOADED: 'Fotografía botánica subida'
  };

  function humanizeAuditAction(code) {
    return AUDIT_ACTION_LABELS[code] || cap(code);
  }

  function humanizeAuditDetails(raw) {
    if (!raw) return 'Sin detalles adicionales';
    let obj = raw;
    if (typeof raw === 'string') {
      try { obj = JSON.parse(raw); } catch { return raw; }
    }
    if (!obj || typeof obj !== 'object') return String(raw);
    const keyMap = {
      name: 'Nombre',
      commonName: 'Especie',
      plantName: 'Especie',
      cell: 'Casilla',
      rows: 'Filas',
      cols: 'Columnas',
      area: 'Área (m²)',
      soil: 'Suelo',
      status: 'Estado',
      task: 'Labor',
      invitedEmail: 'Correo invitado',
      preset: 'Perfil',
      email: 'Correo',
      observations: 'Observación',
      reviewNote: 'Observación',
      type: 'Tipo',
      points: 'Puntos'
    };
    const parts = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined || v === '' || k === 'width' || k === 'height' || k === 'removeLightBg') continue;
      if (k === 'permissions' && Array.isArray(v)) {
        parts.push(`Permisos: ${v.length}`);
        continue;
      }
      const label = keyMap[k] || cap(k);
      const val = Array.isArray(v) ? v.join(', ') : (typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v));
      parts.push(`${label}: ${val}`);
    }
    return parts.slice(0, 4).join(' · ') || 'Operación registrada';
  }

  function kvGrid(pairs) {
    return `<dl class="kp-kv-grid mb-0">${pairs.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>`;
  }
  const ARCH_IMAGES = {
    TIERRA: '/assets/gardens/garden-urban.webp',
    VERTICAL: '/assets/gardens/garden-vertical.webp',
    COLGANTE: '/assets/gardens/garden-hanging.webp',
    PISO: '/assets/gardens/garden-containers.webp'
  };
  const LOCAL_PLANT_ASSETS = [
    ['', 'Sin imagen / Usar enlace HTTPS'],
    ['/assets/plants/manzanilla.webp', 'Manzanilla (recorte botánico)'],
    ['/assets/plants/hierbaluisa.webp', 'Hierbaluisa (recorte botánico)'],
    ['/assets/plants/menta.webp', 'Menta (recorte botánico)'],
    ['/assets/plants/romero.webp', 'Romero (recorte botánico)'],
    ['/assets/plants/calendula.webp', 'Caléndula (recorte botánico)'],
    ['/assets/plants/toronjil.webp', 'Toronjil (recorte botánico)'],
    ['/assets/plants/ruda.webp', 'Ruda (recorte botánico)'],
    ['/assets/plants/oregano.webp', 'Orégano (recorte botánico)'],
    ['/assets/plants/llanten.webp', 'Llantén (recorte botánico)'],
    ['/assets/plants/sabila.webp', 'Sábila (recorte botánico)'],
    ['/assets/plants/matico.webp', 'Matico (recorte botánico)'],
    ['/assets/plants/cedron.webp', 'Cedrón (recorte botánico)']
  ];

  const PERM_METADATA = {
    VIEW_COMMUNITY: { id: 'VIEW_COMMUNITY', name: 'Ver comunidad', category: 'General', desc: 'Información general y estado' },
    VIEW_GARDENS: { id: 'VIEW_GARDENS', name: 'Ver huertos', category: 'Huertos', desc: 'Acceso visual a parcelas' },
    CREATE_GARDENS: { id: 'CREATE_GARDENS', name: 'Crear huertos', category: 'Huertos', desc: 'Registrar nuevos huertos' },
    EDIT_GARDENS: { id: 'EDIT_GARDENS', name: 'Editar huertos', category: 'Huertos', desc: 'Modificar configuración física y agronómica' },
    MANAGE_CROPS: { id: 'MANAGE_CROPS', name: 'Gestionar cultivos', category: 'Cultivos', desc: 'Asignar, rotar y asociar plantas en casillas 2D' },
    REGISTER_ACTIVITIES: { id: 'REGISTER_ACTIVITIES', name: 'Registrar actividades', category: 'Bitácora', desc: 'Anotar labores en la bitácora del cultivo' },
    UPLOAD_EVIDENCE: { id: 'UPLOAD_EVIDENCE', name: 'Subir evidencias', category: 'Bitácora', desc: 'Adjuntar fotografías de respaldo' },
    VIEW_LOGS: { id: 'VIEW_LOGS', name: 'Ver bitácora', category: 'Bitácora', desc: 'Consultar historial y evidencias' },
    EDIT_OWN_ACTIVITIES: { id: 'EDIT_OWN_ACTIVITIES', name: 'Editar actividades propias', category: 'Bitácora', desc: 'Corregir labores no validadas' },
    VIEW_MEMBERS: { id: 'VIEW_MEMBERS', name: 'Ver integrantes', category: 'Comunidad', desc: 'Consultar lista de participantes' },
    VIEW_STATS: { id: 'VIEW_STATS', name: 'Ver estadísticas', category: 'Métricas', desc: 'Consultar métricas y avance del huerto' }
  };

  const PRESET_PROFILES = {
    READ_ONLY: {
      id: 'READ_ONLY',
      name: 'Solo lectura',
      desc: 'Consulta general de huertos, bitácora y estadísticas sin realizar modificaciones.',
      permissions: ['VIEW_COMMUNITY', 'VIEW_GARDENS', 'VIEW_LOGS', 'VIEW_MEMBERS', 'VIEW_STATS']
    },
    AGRICULTURAL_COLLABORATOR: {
      id: 'AGRICULTURAL_COLLABORATOR',
      name: 'Colaborador agrícola',
      desc: 'Registra labores diarias, sube fotografías y edita sus propias actividades pendientes.',
      permissions: ['VIEW_COMMUNITY', 'VIEW_GARDENS', 'VIEW_LOGS', 'VIEW_MEMBERS', 'VIEW_STATS', 'REGISTER_ACTIVITIES', 'UPLOAD_EVIDENCE', 'EDIT_OWN_ACTIVITIES']
    },
    ADVANCED_COLLABORATOR: {
      id: 'ADVANCED_COLLABORATOR',
      name: 'Colaborador avanzado',
      desc: 'Crea y configura huertos, organiza casillas en el tablero y gestiona labores agrícolas.',
      permissions: ['VIEW_COMMUNITY', 'VIEW_GARDENS', 'VIEW_LOGS', 'VIEW_MEMBERS', 'VIEW_STATS', 'CREATE_GARDENS', 'EDIT_GARDENS', 'MANAGE_CROPS', 'REGISTER_ACTIVITIES', 'UPLOAD_EVIDENCE', 'EDIT_OWN_ACTIVITIES']
    },
    CUSTOM: {
      id: 'CUSTOM',
      name: 'Personalizado',
      desc: 'Configuración manual de cualquier combinación de los 11 permisos.',
      permissions: []
    }
  };

  const app = $('#app');

  async function realizarPeticion(url, opts = {}) {
    const isForm = opts.body instanceof FormData;
    const r = await fetch(url, {
      credentials: 'same-origin',
      ...opts,
      headers: isForm ? opts.headers : { 'Content-Type': 'application/json', ...opts.headers }
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401 && state.user) {
        state.user = null;
        setTimeout(() => navigate('inicio'), 80);
      }
      throw new Error(data.error || `Error ${r.status}`);
    }
    return data;
  }
  const request = realizarPeticion;
  const post = (url, data, method = 'POST') => realizarPeticion(url, { method, body: JSON.stringify(data) });

  function mostrarNotificacion(message, ok = true) {
    const id = 't' + Date.now() + Math.floor(Math.random() * 100);
    $('#toastRoot').insertAdjacentHTML(
      'beforeend',
      `<div id="${id}" class="toast show" role="status"><div class="d-flex align-items-center"><div class="toast-body">${icon(ok ? 'check-circle' : 'exclamation-circle', ok ? 'text-success' : 'text-danger')} &nbsp;${e(message)}</div><button class="btn-close me-3 m-auto" type="button" aria-label="Cerrar" data-bs-dismiss="toast"></button></div></div>`
    );
    setTimeout(() => document.getElementById(id)?.remove(), 4200);
  }
  const toast = mostrarNotificacion;

  function navItems() {
    if (!state.user) {
      return [
        ['inicio', 'house', 'Inicio'],
        ['plantas', 'flower2', 'Catálogo botánico'],
        ['ranking', 'trophy', 'Ranking justo']
      ];
    }
    const items = [
      ['resumen', 'grid-1x2', 'Resumen'],
      ['comunidades', 'people', 'Comunidades'],
      ['plantas', 'flower2', 'Catálogo de plantas'],
      ['huertos', 'grid-3x3-gap', 'Mis huertos'],
      ['actividades', 'journal-check', 'Bitácora y validaciones'],
      ['retos', 'trophy', 'Misiones y retos'],
      ['asamblea', 'chat-dots', 'La Asamblea'],
      ['ranking', 'award', 'Ranking justo']
    ];
    if (state.user.role === 'ADMINISTRADOR') {
      items.push(['administracion', 'shield-lock', 'Administración']);
    }
    return items;
  }

  function go(screen, id) {
    const next = `#${screen}${id ? '/' + id : ''}`;
    if (location.hash === next) navigate(screen, id);
    else location.hash = next;
  }

  function navigate(screen, id) {
    state.screen = screen;
    state.gardenId = screen === 'huerto' ? (id || null) : null;
    state.warehouseCommunityId = screen === 'bodega' ? (id || null) : null;
    render().catch(err => {
      console.error(err);
      toast(err.message, false);
    });
  }

  function frame(inner) {
    const items = navItems();
    const current = state.screen === 'huerto' ? 'huertos' : state.screen === 'bodega' ? 'comunidades' : state.screen;

    if (!state.user) {
      return `
        <div class="public-page">
          <nav class="public-nav">
            <a href="#inicio" class="brand" data-nav="inicio">
              <span class="brand-mark light">${icon('flower1')}</span>
              <span class="brand-copy"><strong>Kawsapacha</strong><small>Tierra & comunidad</small></span>
            </a>
            <div class="public-nav-links">
              <a href="#inicio" data-nav="inicio">Inicio</a>
              <a href="#plantas" data-nav="plantas">Catálogo</a>
              <a href="#ranking" data-nav="ranking">Ranking</a>
              <a href="/documentacion" target="_blank">Docs</a>
              ${themeControl()}
              <button type="button" class="btn-outline-forest" data-action="auth-login">Ingresar ${icon('arrow-right')}</button>
            </div>
          </nav>
          ${state.screen === 'huerto' ? `<div class="public-content public-section">${inner}</div>` : inner}
          <div class="public-content">
            <footer class="footer-grid">
              <div>
                <div class="brand" style="color:var(--forest);margin-bottom:10px">
                  <span class="brand-mark">${icon('flower1')}</span>
                  <span class="brand-copy"><strong>Kawsapacha</strong><small style="color:var(--muted)">Tierra & comunidad</small></span>
                </div>
                <p class="mb-2">Plataforma web para la gestión comunitaria de huertos medicinales, seguimiento agroecológico y trazabilidad fotográfica.</p>
                <p class="mb-0 small">Nota: las referencias etnobotánicas y el calendario lunar tienen carácter informativo y tradicional; no sustituyen asesoramiento médico profesional.</p>
              </div>
              <div>
                <h4>Navegación</h4>
                <div class="footer-links">
                  <a href="#inicio" data-nav="inicio">Página principal</a>
                  <a href="#plantas" data-nav="plantas">Catálogo botánico</a>
                  <a href="#ranking" data-nav="ranking">Ranking justo</a>
                  <button type="button" data-action="auth-register">Crear cuenta</button>
                  <button type="button" data-action="auth-login">Iniciar sesión</button>
                </div>
              </div>
              <div>
                <h4>Transparencia y créditos</h4>
                <div class="footer-links">
                  <a href="/documentacion" target="_blank">Documentación técnica V1</a>
                  <button type="button" data-action="open-credits">Créditos y licencias de imágenes</button>
                  <button type="button" data-action="open-legal">Alcance y aviso legal</button>
                </div>
              </div>
            </footer>
            <div class="public-footer">
              <span>Kawsapacha · Tierra & Comunidad · Sistema Web V1</span>
              <span>Sin aval institucional no autorizado · Fotografías botánicas con licencias libres verificadas</span>
            </div>
          </div>
        </div>`;
    }

    const pendingBadge = (state.pendingInvitations && state.pendingInvitations.length > 0)
      ? `<span class="badge rounded-pill bg-warning text-dark ms-1" title="Tienes invitaciones pendientes">${state.pendingInvitations.length}</span>`
      : '';

    return `
      <div class="app-layout">
        <div class="mobile-backdrop" id="mobileBackdrop" data-action="toggle-menu"></div>
        <aside class="sidebar" id="sidebar">
          <div class="side-head">
            <a href="#resumen" class="brand" data-nav="resumen">
              <span class="brand-mark light">${icon('flower1')}</span>
              <span class="brand-copy"><strong>Kawsapacha</strong><small>Tierra & comunidad</small></span>
            </a>
          </div>
          <div class="side-group-label">Espacio de trabajo</div>
          <nav class="side-nav">
            ${items.map(([k, ic, label]) => `
              <a href="#${k}" class="nav-link-custom ${k === current ? 'active' : ''}" data-nav="${k}">
                ${icon(ic)} <span>${label}</span>
                ${k === 'comunidades' ? pendingBadge : ''}
              </a>
            `).join('')}
          </nav>
          <div class="side-bottom">
            <strong>Kawsapacha · V1</strong>
            ${state.user.role === 'ADMINISTRADOR' ? '<span class="badge bg-success-subtle text-success border border-success-subtle mt-1 mb-2 d-inline-block">Rol: Administrador Global</span>' : '<span class="text-secondary d-block mt-1 mb-2">Rol: Usuario</span>'}
            <button type="button" class="nav-link-custom side-logout mt-1" data-action="open-profile">${icon('person-circle')} Mi perfil</button>
            <button type="button" class="nav-link-custom side-logout mt-1" data-action="logout">${icon('box-arrow-left')} Cerrar sesión</button>
          </div>
        </aside>
        <div class="main-area">
          <header class="topbar">
            <div class="topbar-left">
              <button type="button" class="mobile-toggle" aria-label="Abrir menú" data-action="toggle-menu">${icon('list')}</button>
              <span class="topbar-breadcrumb">Mi espacio <span class="mx-2">/</span> <strong>${e(items.find(x => x[0] === current)?.[2] || 'Huerto virtual')}</strong></span>
            </div>
            <div class="topbar-right">
              <span class="today-pill">${new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date())}</span>
              <button type="button" class="user-brief bg-transparent border-0 text-start p-0" data-action="open-profile" title="Ver o editar mi perfil">
                <span class="avatar-circle">${e(initial(state.user.name))}</span>
                <span>
                  <strong>${e(state.user.name)}</strong>
                  <small>${e(ROLES[state.user.role] || state.user.role)} · ${e(LEVELS[state.user.level] || state.user.level)}</small>
                </span>
              </button>
            </div>
          </header>
          <main class="content">
            ${renderPendingInvitationsNotice()}
            ${inner}
            <p class="foot-disclaimer">Kawsapacha · Tierra & Comunidad · Gobernanza comunitaria, espejo digital 2D y trazabilidad agroecológica. <button type="button" class="link-inline small ms-2" data-action="open-credits">Créditos de imágenes</button></p>
          </main>
        </div>
      </div>`;
  }

  function renderPendingInvitationsNotice() {
    if (!state.pendingInvitations || state.pendingInvitations.length === 0) return '';
    return `
      <div class="alert alert-warning d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 mb-4 rounded-3 shadow-sm border-warning-subtle" role="alert">
        <div class="d-flex align-items-center gap-2">
          ${icon('envelope-paper-heart', 'fs-4 text-warning-emphasis')}
          <div>
            <strong>¡Tienes ${state.pendingInvitations.length} invitación(es) para unirte a comunidades!</strong>
            <p class="mb-0 small text-body-secondary">Revisa los permisos asignados y confirma tu participación.</p>
          </div>
        </div>
        <button type="button" class="btn btn-warning btn-sm fw-semibold" data-action="open-pending-invitations">
          ${icon('eye')} Revisar invitaciones
        </button>
      </div>`;
  }

  function pageHead(kicker, title, desc = '', actionHtml = '') {
    return `
      <div class="page-head hero-reveal">
        <div>
          <p class="kicker">${e(kicker)}</p>
          <h1>${e(title)}</h1>
          ${desc ? `<p class="page-description">${e(desc)}</p>` : ''}
        </div>
        <div class="page-actions">${themeControl()}${actionHtml}</div>
      </div>`;
  }

  function empty(iconName, title, desc, button = '') {
    return `<div class="empty-state">${icon(iconName)}<h3>${e(title)}</h3><p>${e(desc)}</p>${button}</div>`;
  }

  function status(s) {
    return `<span class="tag ${s === 'ACTIVO' || s === 'APROBADA' ? 'tag-approved' : s === 'PENDIENTE' ? 'tag-pending' : 'tag-rejected'}">${e(STATUS_LABELS[s] || cap(s))}</span>`;
  }

  function isLocalCutout(url) {
    return typeof url === 'string' && (url.startsWith('/assets/plants/') || url.startsWith('/uploads/plants/'));
  }

  function plantThumb(p) {
    return p?.imageThumbUrl || p?.imageUrl || '';
  }

  function plantCard(p) {
    const thumb = plantThumb(p);
    const imgHtml = thumb
      ? `<img class="${isLocalCutout(thumb) ? 'plant-cutout' : 'plant-photo-rect'}" src="${e(thumb)}" data-fallback-src="/assets/plants/planta-fallback.svg" loading="lazy" alt="${e(p.commonName)} (${e(p.scientific)})">`
      : icon('flower2');
    return `
      <article class="plant-card">
        <div class="plant-visual ${p.thermal === 'CALIENTE' ? 'hot' : ''}">
          ${imgHtml}
          <span class="thermal-pill tag ${p.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${p.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca / fría'}</span>
        </div>
        <div class="plant-body">
          <h3 class="card-title">${e(p.commonName)}</h3>
          <div class="latin">${e(p.scientific)}${p.family ? ` · ${e(p.family)}` : ''}</div>
          <div class="plant-meta-row">
            <span>${icon('arrow-repeat')} Ciclo ${e(cap(p.cycle))}</span>
            ${p.minAltitude != null || p.maxAltitude != null ? `<span>${icon('geo-alt')} ${p.minAltitude ?? 0}–${p.maxAltitude ?? '?'} m</span>` : ''}
          </div>
          <p class="card-copy">${e(p.uses || 'Información medicinal pendiente de validación.')}</p>
          <div class="plant-soils">${icon('layers')} ${e(p.soils?.map(s => cap(s.soil)).join(' · ') || 'Suelo por determinar')}</div>
          <div class="card-footer-line flex-wrap">
            <span class="tag ${p.verified ? 'tag-approved' : 'tag-demo'}">${p.verified ? 'Validada' : 'Pendiente de validación'}</span>
            <div class="d-flex gap-2">
              <button type="button" class="detail-btn" data-action="plant-detail" data-id="${e(p.id)}">Ver ficha ${icon('eye')}</button>
              ${state.user?.role === 'ADMINISTRADOR' ? `<button type="button" class="detail-btn" data-action="edit-plant" data-id="${e(p.id)}">Editar ${icon('pencil-square')}</button>` : ''}
            </div>
          </div>
        </div>
      </article>`;
  }

  function communityCard(c, isOwned = false) {
    const isOwner = isOwned || c.ownerId === state.user?.id;
    const isGlobalAdmin = state.user?.role === 'ADMINISTRADOR';
    const canManage = isOwner || isGlobalAdmin;
    const membersList = c.members || [];
    const gardensCount = c._count?.gardens ?? (c.gardens?.length || 0);
    const ownerName = c.owner?.name || c.leader?.name || 'Responsable';

    return `
      <article class="community-card ${isOwner ? 'is-owned' : 'is-shared'}">
        <div class="community-top">
          <div class="d-flex align-items-center gap-2 min-w-0">
            <span class="avatar-circle" style="width:36px;height:36px;font-size:12px">${e(initial(c.name))}</span>
            <div class="min-w-0">
              <h3 class="card-title mb-0 text-truncate">${e(c.name)}</h3>
              <span class="tiny-note">${e(COMMUNITY_TYPE_LABELS[c.type] || cap(c.type))} · Desde ${shortDate(c.createdAt)}</span>
            </div>
          </div>
          <span class="tag ${isOwner ? 'tag-approved' : 'tag-neutral'}">${isOwner ? 'Propietario' : 'Colaborador'}</span>
        </div>

        ${c.description ? `<p class="card-copy mt-2 mb-2">${e(c.description)}</p>` : ''}

        <div class="kp-comm-meta-grid mt-2">
          <div><small>Responsable</small><strong>${e(ownerName)}</strong></div>
          <div><small>Contacto</small><strong>${e(c.phone || c.owner?.email || 'No registrado')}</strong></div>
          <div><small>Integrantes</small><strong>${membersList.length} activos</strong></div>
          <div><small>Huertos</small><strong>${gardensCount} registrados</strong></div>
        </div>

        ${!isOwner && c.myPermissions ? `
          <div class="my-permissions-badges mt-2">
            <span class="tiny-note d-block mb-1">Mis permisos (${c.myPermissions.length}):</span>
            <div class="d-flex flex-wrap gap-1">
              ${c.myPermissions.slice(0, 3).map(p => `<span class="badge bg-light text-dark border" style="font-size:10px;">${e(PERM_METADATA[p]?.name || p)}</span>`).join('')}
              ${c.myPermissions.length > 3 ? `<span class="badge bg-secondary-subtle text-secondary" style="font-size:10px;">+${c.myPermissions.length - 3}</span>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="card-footer-line flex-wrap gap-2 mt-3 pt-2 border-top">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="community-detail" data-id="${e(c.id)}">${icon('eye')} Detalle</button>
          <button type="button" class="btn btn-sm btn-outline-forest" data-action="open-warehouse" data-id="${e(c.id)}" title="El Resguardo — Bodega">${icon('box-seam')} Bodega</button>
          <div class="d-flex flex-wrap gap-1 ms-auto">
            ${canManage ? `
              <button type="button" class="btn btn-sm btn-outline-success" data-action="manage-members" data-id="${e(c.id)}" title="Integrantes y permisos">${icon('people')} Integrantes</button>
              <button type="button" class="btn btn-sm btn-success" data-action="invite-member" data-id="${e(c.id)}" title="Invitar">${icon('person-plus')}</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-community" data-id="${e(c.id)}" title="Editar">${icon('pencil')}</button>
              <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-community" data-id="${e(c.id)}" title="Eliminar">${icon('trash')}</button>
            ` : `
              <button type="button" class="btn btn-sm btn-outline-secondary" data-action="view-members" data-id="${e(c.id)}">${icon('people')} Equipo</button>
            `}
          </div>
        </div>
      </article>`;
  }

  function gardenCard(g) {
    const thumb = ARCH_IMAGES[g.architecture] || ARCH_IMAGES.TIERRA;
    const totalCells = g.rows * g.cols;
    const cropsCount = g._count?.crops ?? 0;
    return `
      <article class="garden-card">
        <div class="kp-garden-thumb-wrap">
          <img src="${e(thumb)}" loading="lazy" alt="${e(ARCH_LABELS[g.architecture] || g.architecture)}">
          <span class="kp-garden-thumb-badge tag tag-neutral">${e(ARCH_LABELS[g.architecture] || cap(g.architecture))}</span>
          <span class="kp-garden-thumb-status">${status(g.status)}</span>
        </div>
        <h3 class="card-title mt-2 mb-1">${e(g.name)}</h3>
        <p class="tiny-note mb-2">${icon('people')} ${e(g.community.name)} · ${icon('geo-alt')} ${e(g.parish)}, ${e(g.province)}</p>
        ${kvGrid([
          ['Tipo de suelo', cap(g.soil)],
          ['Cuadrícula', `${g.rows} × ${g.cols} (${totalCells} casillas)`],
          ['Cultivos activos', `${cropsCount} de ${totalCells}`],
          ['Superficie', `${fmt(g.area)} m²`]
        ])}
        <div class="card-footer-line mt-3 pt-2">
          <span class="tiny-note">${icon('droplet-half')} Riego ${e(cap(g.irrigation))}</span>
          <button type="button" class="btn-forest btn-sm-soft" data-action="open-garden" data-id="${e(g.id)}">
            Abrir tablero 2D ${icon('arrow-right')}
          </button>
        </div>
      </article>`;
  }

  function rankingRows(items, maxScoreOverride = null) {
    if (!items.length) {
      return empty('trophy', 'El ranking comenzará pronto', 'Los huertos aparecen aquí cuando están activos y tienen cultivos registrados con evidencias aprobadas.');
    }
    const topScore = maxScoreOverride || Math.max(...items.map(r => Number(r.score) || 0), 1);
    return items.map(r => {
      const pct = Math.max(6, Math.min(100, Math.round(((Number(r.score) || 0) / topScore) * 100)));
      return `
        <article class="rank-row ${r.position === 1 ? 'first' : ''}">
          <span class="rank-position">${r.position}</span>
          <span class="card-signet mb-0" style="height:40px;width:40px">${icon(r.position === 1 ? 'award' : 'flower2')}</span>
          <div class="kp-rank-main">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <h3 class="mb-0">${e(r.community)}</h3>
              <span class="tag tag-neutral">${e(COMMUNITY_TYPE_LABELS[r.type] || cap(r.type))}</span>
            </div>
            <p class="mb-1">${e(r.name)} · ${r.activeCrops} cultivos activos · ${fmt(r.approvedPoints)} pts acreditados</p>
            <div class="kp-rank-bar-track" aria-hidden="true"><span class="kp-rank-bar-fill" style="width:${pct}%"></span></div>
          </div>
          <div class="rank-points">
            <strong>${fmt(r.score)}</strong>
            <small>Índice PRJ</small>
          </div>
          <button class="btn-soft btn-sm-soft" type="button" data-action="open-garden" data-id="${e(r.id)}" title="Ver huerto" aria-label="Abrir huerto ${e(r.name)}">
            ${icon('arrow-up-right')}
          </button>
        </article>`;
    }).join('');
  }

  function landing() {
    const moon = state.moon || { id: 'WINAK_KILLA', name: 'Wiñak Killa', subtitle: 'Luna creciente', advice: 'Fase favorable para la siembra', ageDays: 7 };
    const phases = state.moonPhases?.length ? state.moonPhases : [
      { id: 'YANA_KILLA', name: 'Yana Killa', subtitle: 'Luna oscura', advice: 'Preparación y abonado de la tierra' },
      { id: 'WINAK_KILLA', name: 'Wiñak Killa', subtitle: 'Luna creciente', advice: 'Fase favorable para la siembra' },
      { id: 'PURA_KILLA', name: 'Pura Killa', subtitle: 'Luna llena', advice: 'Fase favorable para la siembra y cosecha de hojas y flores' },
      { id: 'WANUK_KILLA', name: 'Wañuk Killa', subtitle: 'Luna menguante', advice: 'Cosecha de raíces, tubérculos y semillas' }
    ];
    const showcaseCrops = [
      { cell: 'A1', name: 'Manzanilla', thermal: 'FRIA', img: '/assets/plants/manzanilla.webp', offset: 0 },
      { cell: 'A2', name: 'Romero', thermal: 'CALIENTE', img: '/assets/plants/romero.webp', offset: 0 },
      { cell: 'A3', name: 'Caléndula', thermal: 'FRIA', img: '/assets/plants/calendula.webp', offset: 0 },
      { cell: 'B1', name: 'Ruda', thermal: 'CALIENTE', img: '/assets/plants/ruda.webp', offset: 0 },
      { cell: 'B2', name: 'Toronjil', thermal: 'FRIA', img: '/assets/plants/toronjil.webp', offset: 0 },
      { cell: 'B3', name: 'Orégano', thermal: 'CALIENTE', img: '/assets/plants/oregano.webp', offset: 0 }
    ];
    const featuredPlants = state.plants.slice(0, 6);

    return `
      <!-- 5.1 HERO PRINCIPAL -->
      <section class="landing-hero">
        <div class="public-content landing-hero-grid">
          <div class="hero-reveal">
            <span class="landing-badge-pill">${icon('flower1')} Tierra & Comunidad · Espejo Digital 2D</span>
            <h1>La tierra tiene una historia. <em>Cuidémosla juntos.</em></h1>
            <p class="landing-hero-lead">Organiza comunidades agrícolas, configura huertos medicinales según su suelo y tipología, administra cada parcela por filas y columnas, y valida labores reales con respaldo fotográfico.</p>
            <div class="public-actions">
              <button type="button" class="hero-btn" data-action="auth-register">${icon('people-fill')} Crear comunidad ${icon('arrow-up-right')}</button>
              <button type="button" class="public-secondary" data-action="scroll-how">${icon('compass')} Explorar cómo funciona</button>
            </div>
          </div>
          <div class="landing-hero-visual img-reveal">
            <div class="landing-photo-frame">
              <img src="/assets/landing/hero-community-garden.webp" alt="Huerto medicinal comunitario andino al amanecer">
            </div>
            <div class="landing-mirror-card" aria-hidden="true">
              <div class="d-flex justify-content-between align-items-center">
                <strong style="font-size:11px">Espejo digital en vivo</strong>
                <span class="tag tag-approved" style="padding:2px 7px;font-size:9px">A1–A3</span>
              </div>
              <div class="landing-mirror-mini">
                <div class="landing-mirror-cell"><span>A1</span><img src="/assets/plants/manzanilla.webp" alt=""></div>
                <div class="landing-mirror-cell"><span>A2</span><img src="/assets/plants/romero.webp" alt=""></div>
                <div class="landing-mirror-cell"><span>A3</span><img src="/assets/plants/calendula.webp" alt=""></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5.2 CÓMO FUNCIONA -->
      <section id="como-funciona" class="public-content public-section">
        <div class="section-heading mt-0">
          <div>
            <p class="kicker">Recorrido del sistema</p>
            <h2>Cómo funciona Kawsapacha</h2>
            <p>Seis pasos conectados entre el trabajo real en la tierra y tu tablero comunitario.</p>
          </div>
        </div>
        <div class="journey-storyboard" id="journeyStoryboard" data-active-step="1">
          <div class="journey-stage-col">
            <div class="journey-visual-stage" id="journeyVisualStage" data-active-step="1">
              <div class="journey-stage-bar">
                <span class="journey-stage-pill" id="journeyStageBadge">Paso 01 / 06 · Comunidad</span>
                <div class="journey-step-dots" role="tablist" aria-label="Pasos del recorrido">
                  ${[1, 2, 3, 4, 5, 6].map(num => `<button type="button" class="journey-dot ${num === 1 ? 'active' : ''}" data-journey-jump="${num}" aria-label="Paso ${num}">${num}</button>`).join('')}
                </div>
              </div>
              <div class="journey-scene-frame">
                <span class="parcel-soil-layer journey-soil-layer" aria-hidden="true"></span>
                <div class="journey-scene-overlay" aria-hidden="true">
                  <div class="journey-blueprint-grid">
                    ${showcaseCrops.map((item, idx) => `
                      <div class="journey-mini-plot" data-plot-idx="${idx}" data-thermal="${item.thermal}">
                        <span class="journey-plot-soil" aria-hidden="true"></span>
                        <div class="journey-plot-plant">
                          <img class="parcel-sprout-img" src="/assets/plants/brote-inicial.svg" alt="">
                          <img class="parcel-plant-img" src="${item.img}" alt="${item.name}">
                        </div>
                        <span class="journey-plot-coord">${item.cell}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div class="journey-context-card" id="journeyContextCard">
                    <div class="journey-context-icon">${icon('house-heart')}</div>
                    <div>
                      <strong id="journeyContextTitle">1. Crear comunidad</strong>
                      <span id="journeyContextDesc">Propietario único e invitaciones con 11 permisos granulares.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="journey-steps-track">
            <div class="journey-rail" aria-hidden="true"><span class="journey-rail-fill"></span></div>
            <article class="journey-step is-active" data-step="1">
              <div class="journey-step-top"><span class="journey-num">01</span><span class="journey-icon">${icon('house-heart')}</span></div>
              <h3>Crear comunidad</h3>
              <p>Registra una comunidad individual, familiar, de condominio o barrial manteniendo la propiedad y control total para invitar colaboradores.</p>
            </article>
            <article class="journey-step" data-step="2">
              <div class="journey-step-top"><span class="journey-num">02</span><span class="journey-icon">${icon('sliders')}</span></div>
              <h3>Configurar huerto</h3>
              <p>Define ubicación, área (1 a 400 m²), suelo, riego, abono, tipología y las filas y columnas de tu parcela medicinal.</p>
            </article>
            <article class="journey-step" data-step="3">
              <div class="journey-step-top"><span class="journey-num">03</span><span class="journey-icon">${icon('layers')}</span></div>
              <h3>Preparar terreno</h3>
              <p>Acondiciona la tierra de cada casilla según suelo y fase lunar; la parcela vacía y preparada queda lista en tu mapa 2D.</p>
            </article>
            <article class="journey-step" data-step="4">
              <div class="journey-step-top"><span class="journey-num">04</span><span class="journey-icon">${icon('grid-3x3-gap')}</span></div>
              <h3>Sembrar</h3>
              <p>Asocia especies compatibles (A1, B2…) según su cualidad cálida o fresca y registra los primeros brotes con foto real.</p>
            </article>
            <article class="journey-step" data-step="5">
              <div class="journey-step-top"><span class="journey-num">05</span><span class="journey-icon">${icon('droplet-half')}</span></div>
              <h3>Cuidar</h3>
              <p>Documenta riego y manejo agroecológico con respaldo fotográfico validado sin permitir autovalidación entre miembros.</p>
            </article>
            <article class="journey-step" data-step="6">
              <div class="journey-step-top"><span class="journey-num">06</span><span class="journey-icon">${icon('award')}</span></div>
              <h3>Cosechar</h3>
              <p>Observa las plantas desarrolladas sobre el mismo suelo, acredita puntos hacia Aprendiz, Oficial o Maestro y compara en el Ranking Justo.</p>
            </article>
          </div>
        </div>
      </section>

      <!-- 5.3 SECCIÓN DEL HUERTO VIRTUAL -->
      <section class="landing-showcase-band" id="landingGardenSection">
        <div class="public-content">
          <div class="showcase-grid">
            <div class="showcase-copy-col">
              <p class="kicker">El espejo digital 2D</p>
              <h2>Un huerto virtual donde la tierra permanece fija y evoluciona cada planta</h2>
              <p class="card-copy" style="font-size:14px">Cada parcela conserva intacta su cama de tierra y textura permanente. Lo único que cambia es la capa vegetal según la etapa guardada en el sistema.</p>
              <div class="stage-pill-bar" role="group" aria-label="Simulador de etapas de cultivo">
                <button type="button" class="stage-pill-btn active" data-landing-stage="PREPARACION" aria-pressed="true">1. Preparación</button>
                <button type="button" class="stage-pill-btn" data-landing-stage="SIEMBRA" aria-pressed="false">2. Siembra</button>
                <button type="button" class="stage-pill-btn" data-landing-stage="CRECIMIENTO" aria-pressed="false">3. Crecimiento</button>
                <button type="button" class="stage-pill-btn" data-landing-stage="COSECHA" aria-pressed="false">4. Cosecha</button>
              </div>
              <p class="stage-caption-live" id="landingStageCaption" aria-live="polite">Preparación: se observa únicamente la tierra acondicionada y fija.</p>
              <div class="d-flex flex-wrap gap-3 tiny-note mt-2">
                <span><span class="tag tag-hot">Borde rojo</span> Plantas cálidas</span>
                <span><span class="tag tag-cold">Borde verde</span> Plantas frescas / frías</span>
              </div>
            </div>
            <div class="demo-garden-board" id="landingGardenShowcase" data-stage="PREPARACION">
              <div class="demo-garden-inner">
                ${showcaseCrops.map(item => `
                  <div class="demo-parcel" data-stage="PREPARACION" data-thermal="${item.thermal}">
                    <span class="parcel-soil-layer" aria-hidden="true"></span>
                    <div class="demo-parcel-top">
                      <span class="demo-parcel-coord">${item.cell}</span>
                      <span class="parcel-thermal-dot ${item.thermal === 'CALIENTE' ? 'hot' : 'cold'}"></span>
                    </div>
                    <div class="demo-parcel-plant" aria-hidden="true">
                      <img class="parcel-sprout-img" src="/assets/plants/brote-inicial.svg" alt="">
                      <img class="parcel-plant-img" src="${item.img}" alt="${item.name}">
                    </div>
                    <div class="demo-parcel-label">${item.name}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="typology-strip">
            <article class="typology-card"><img src="/assets/gardens/garden-urban.webp" loading="lazy" alt="Huerto urbano en tierra"><div><strong>En tierra y surcos</strong><span>Camellones, terrazas y camas elevadas</span></div></article>
            <article class="typology-card"><img src="/assets/gardens/garden-vertical.webp" loading="lazy" alt="Huerto vertical"><div><strong>Huerto vertical</strong><span>Bolsillos y muros productivos urbanos</span></div></article>
            <article class="typology-card"><img src="/assets/gardens/garden-containers.webp" loading="lazy" alt="Huerto en recipientes"><div><strong>En recipientes</strong><span>Macetas de barro, cajones y patios</span></div></article>
            <article class="typology-card"><img src="/assets/gardens/garden-hanging.webp" loading="lazy" alt="Huerto colgante"><div><strong>Huerto colgante</strong><span>Cestas suspendidas y balcones</span></div></article>
          </div>
        </div>
      </section>

      <!-- 5.4 CATÁLOGO MEDICINAL — GALERÍA BOTÁNICA DIFERENCIADA -->
      <section class="public-content public-section landing-catalog-band">
        <div class="section-heading mt-0">
          <div>
            <p class="kicker">Saberes etnobotánicos</p>
            <h2>Catálogo de plantas medicinales</h2>
            <p>Especies reales documentadas sin fondos artificiales, pisos altitudinales, suelos compatibles y estado transparente.</p>
          </div>
          <button type="button" class="btn-outline-forest" data-nav="plantas">Explorar catálogo completo ${icon('arrow-right')}</button>
        </div>
        ${featuredPlants.length ? (() => {
          const lead = featuredPlants[0];
          const rest = featuredPlants.slice(1, 6);
          const leadThumb = plantThumb(lead);
          return `
            <div class="botanical-showcase-layout catalog-showcase-grid">
              <article class="botanical-spotlight ${lead.thermal === 'CALIENTE' ? 'hot' : ''}">
                <div class="spotlight-visual">
                  ${leadThumb ? `<img class="plant-cutout" src="${e(leadThumb)}" data-fallback-src="/assets/plants/planta-fallback.svg" loading="lazy" alt="${e(lead.commonName)}">` : icon('flower2')}
                </div>
                <div class="spotlight-body">
                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <span class="tag ${lead.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${lead.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca / fría'}</span>
                    <span class="tag ${lead.verified ? 'tag-approved' : 'tag-demo'}">${lead.verified ? 'Validada' : 'Pendiente de validación'}</span>
                  </div>
                  <h3 class="card-title">${e(lead.commonName)}</h3>
                  <p class="latin mb-2">${e(lead.scientific)}${lead.family ? ` · ${e(lead.family)}` : ''}</p>
                  <p class="card-copy mb-3">${e(lead.uses || 'Información botánica y cultural registrada en catálogo.')}</p>
                  <div class="d-flex flex-wrap gap-1 mb-3">
                    ${(lead.soils || []).map(s => `<span class="badge bg-light text-dark border">${e(cap(s.soil))}</span>`).join('')}
                  </div>
                  <button type="button" class="detail-btn" data-action="plant-detail" data-id="${e(lead.id)}">Abrir ficha botánica ${icon('arrow-up-right')}</button>
                </div>
              </article>
              <div class="botanical-specimen-strip">
                ${rest.map(p => {
                  const t = plantThumb(p);
                  return `
                    <button type="button" class="specimen-tile ${p.thermal === 'CALIENTE' ? 'hot' : ''}" data-action="plant-detail" data-id="${e(p.id)}">
                      <span class="specimen-dot ${p.thermal === 'CALIENTE' ? 'hot' : 'cold'}" title="${p.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca/fría'}"></span>
                      <div class="specimen-img-box">
                        ${t ? `<img class="plant-cutout" src="${e(t)}" data-fallback-src="/assets/plants/planta-fallback.svg" loading="lazy" alt="${e(p.commonName)}">` : icon('flower2')}
                      </div>
                      <div class="plant-body p-0 text-start">
                        <strong>${e(p.commonName)}</strong>
                        <small>${e(p.scientific)}</small>
                      </div>
                    </button>`;
                }).join('')}
              </div>
            </div>`;
        })() : empty('flower2', 'Catálogo botánico en preparación', 'El administrador puede registrar especies medicinales en cualquier momento.')}
      </section>

      <div class="public-content"><hr class="public-divider"></div>

      <!-- 5.5 COMUNIDAD — COMPOSICIÓN NARRATIVA DE GOBERNANZA -->
      <section class="public-content public-section landing-community-band">
        <div class="community-showcase-grid">
          <div class="community-photo-card">
            <img src="/assets/landing/community-gardening.webp" loading="lazy" alt="Voluntarios cuidando juntos un huerto medicinal comunitario">
            <div class="community-photo-caption">
              <span>${icon('people-fill')} Trabajo colaborativo verificado en campo</span>
            </div>
          </div>
          <div class="community-story-col">
            <p class="kicker">Gobernanza y trabajo colaborativo</p>
            <h2>Comunidades con propiedad protegida y permisos granulares</h2>
            <p class="card-copy" style="font-size:14px">Cada persona que crea una comunidad conserva su propiedad exclusiva y puede asignar perfiles o configurar uno a uno los <strong>11 permisos granulares</strong>.</p>
            <div class="governance-flow-diagram" aria-label="Flujo de permisos comunitarios">
              <div class="gov-node"><span>1</span><div><strong>Propietario único</strong><small>Invita miembros y define accesos</small></div></div>
              <div class="gov-node"><span>2</span><div><strong>11 permisos granulares</strong><small>Solo lectura, agrícola o avanzado</small></div></div>
              <div class="gov-node"><span>3</span><div><strong>Validación cruzada</strong><small>Impide autovalidación y audita todo</small></div></div>
            </div>
          </div>
        </div>
      </section>

      <div class="public-content"><hr class="public-divider"></div>

      <!-- 5.6 CALENDARIO AGRÍCOLA LUNAR — VISUALIZACIÓN ORBITAL TEMPORAL -->
      <section class="public-content public-section landing-lunar-band">
        <div class="section-heading mt-0">
          <div>
            <p class="kicker">Calendario agrícola tradicional</p>
            <h2>Ciclo lunar de referencia: ${e(moon.name)} (${e(moon.subtitle)})</h2>
            <p>Estimación orientativa basada en ciclo sinódico (~${fmt(moon.ageDays)} días de edad lunar). Guía cultural andina; no sustituye criterios técnicos locales.</p>
          </div>
          <span class="tag tag-approved">${icon('moon-stars')} Hoy: ${e(moon.name)}</span>
        </div>
        <div class="lunar-orbital-stage">
          <div class="lunar-central-dial">
            <div class="lunar-dial-ring">
              <div class="lunar-dial-core">
                ${icon('moon-stars')}
                <strong>${e(moon.name)}</strong>
                <small>${e(moon.subtitle)}</small>
              </div>
            </div>
            <p class="mb-0 small text-center mt-3"><strong>Recomendación actual:</strong> ${e(moon.advice)}</p>
          </div>
          <div class="lunar-horizon-track lunar-reveal-grid">
            ${phases.map((ph, idx) => {
              const active = ph.id === moon.id;
              const orbIcons = ['moon', 'moon-stars', 'brightness-high', 'moon-fill'];
              return `
                <article class="lunar-phase-node lunar-phase-card ${active ? 'active' : ''}">
                  <div class="lunar-orb">${icon(orbIcons[idx] || 'moon')}</div>
                  <div>
                    <div class="d-flex justify-content-between align-items-center gap-2">
                      <strong>${e(ph.name)}</strong>
                      ${active ? '<span class="tag tag-approved">Vigente</span>' : `<span class="tiny-note">Fase ${idx + 1}</span>`}
                    </div>
                    <div class="small text-muted">${e(ph.subtitle)}</div>
                    <p class="small mb-0 mt-1">${e(ph.advice)}</p>
                  </div>
                </article>`;
            }).join('')}
          </div>
        </div>
      </section>

      <div class="public-content"><hr class="public-divider"></div>

      <!-- 5.7 RANKING Y MOTIVACIÓN — PROGRESIÓN DE NIVELES + TABLA COMPARATIVA -->
      <section class="public-content public-section landing-ranking-band">
        <div class="section-heading mt-0">
          <div>
            <p class="kicker">Equidad y reconocimiento</p>
            <h2>Ranking Justo y niveles de experiencia</h2>
            <p>Normaliza los puntos validados según el número de cultivos activos (factor ×1.25 en fase lunar favorable). Solo participan datos reales guardados.</p>
          </div>
          <button type="button" class="btn-outline-forest" data-nav="ranking">Ver tabla completa ${icon('arrow-right')}</button>
        </div>
        <div class="level-progression-track stagger-grid">
          <div class="level-milestone"><span>0–99 pts</span><strong>Aprendiz</strong><small>Inicio comunitario y primeras bitácoras</small></div>
          <div class="level-milestone"><span>100–299 pts</span><strong>Oficial</strong><small>Constancia verificada en riego y cuidado</small></div>
          <div class="level-milestone"><span>300+ pts</span><strong>Maestro</strong><small>Experiencia acumulada (independiente del rol)</small></div>
        </div>
        <div class="mt-3">${rankingRows(state.rank.slice(0, 5))}</div>
      </section>

      <!-- 5.8 CIERRE CTA -->
      <section class="public-content landing-cta-band">
        <div class="landing-cta-banner cta-reveal-banner">
          <div>
            <h2>Empieza a organizar tu huerto medicinal comunitario</h2>
            <p>Regístrate en segundos, crea tu comunidad, configura las parcelas reales de tu terreno y lleva un historial duradero de cada cultivo.</p>
          </div>
          <div class="d-flex flex-wrap gap-2 cta-actions">
            <button type="button" class="hero-btn" data-action="auth-register">${icon('person-plus')} Registrar cuenta</button>
            <button type="button" class="public-secondary" data-action="auth-login">Ya tengo cuenta</button>
          </div>
        </div>
      </section>`;
  }

  function dashboard() {
    const d = state.dashboard || { communities: 0, gardens: 0, pending: 0, approved: 0, points: 0, level: 'APRENDIZ' };
    const upcoming = (state.moonUpcoming || []).slice(0, 5);
    const activeCrops = (state.gardens || []).reduce((sum, g) => sum + (g._count?.crops || 0), 0);
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const reviewQueue = (state.activities || []).filter(a => (isAdmin || (a.crop?.garden?.community?.ownerId === state.user?.id && a.volunteerId !== state.user?.id)) && a.status === 'PENDIENTE');
    const recentActs = (state.activities || []).slice(0, 4);
    const pendingInvs = state.pendingInvitations?.length || 0;

    // Pasos sugeridos reales según el estado vigente del usuario
    const nextSteps = [];
    if (pendingInvs > 0) {
      nextSteps.push({ icon: 'envelope-paper', text: `Tienes ${pendingInvs} invitación(es) comunitaria(s) por responder.`, cta: 'Revisar', action: 'open-pending-invitations' });
    }
    if (reviewQueue.length > 0) {
      nextSteps.push({ icon: 'check2-square', text: `${reviewQueue.length} evidencia(s) fotográfica(s) esperan validación.`, cta: 'Ir a bandeja', nav: 'actividades' });
    }
    if (d.communities === 0) {
      nextSteps.push({ icon: 'house-heart', text: 'Crea tu primera comunidad para habilitar huertos y colaboradores.', cta: 'Crear comunidad', action: 'new-community' });
    } else if (d.gardens === 0) {
      nextSteps.push({ icon: 'grid-3x3-gap', text: 'Configura tu primer huerto medicinal con filas y columnas.', cta: 'Crear huerto', nav: 'huertos' });
    } else if (activeCrops === 0) {
      nextSteps.push({ icon: 'flower2', text: 'Asocia especies medicinales a las parcelas libres de tu huerto 2D.', cta: 'Abrir huertos', nav: 'huertos' });
    } else {
      nextSteps.push({ icon: 'camera', text: `Jornada lunar ${state.moon?.name || ''}: ${state.moon?.advice || 'registra una labor con foto'}.`, cta: 'Ver huertos', nav: 'huertos' });
    }

    return `
      ${pageHead('Mi espacio comunitario', 'Buen día, ' + state.user.name.split(' ')[0] + '.', 'Vista operativa de tus comunidades, cultivos activos, labores recientes y orientación lunar.')}
      <section class="dashboard-hero hero-reveal">
        <div class="hero-content">
          <p class="kicker">Jornada agrícola y fase lunar</p>
          <h2>${e(state.moon?.name || 'Reloj agrícola')} · ${e(state.moon?.subtitle || 'Fase lunar')}</h2>
          <p>${e(state.moon?.advice || 'Consulta la orientación de la jornada.')} Orientación cultural andina (bonificación ×1.25 en labores alineadas).</p>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="hero-btn" data-nav="huertos">Abrir mis huertos ${icon('arrow-right')}</button>
            <button type="button" class="public-secondary" data-nav="actividades">Bitácora y validaciones</button>
          </div>
        </div>
        <div class="moon-scene">
          <div class="moon-disk">${icon('moon-stars')}<small>Reloj lunar</small></div>
          <span class="moon-foot">Edad lunar ~${fmt(state.moon?.ageDays || 0)} d</span>
        </div>
      </section>

      <div class="kp-kpi-strip-5 stagger-grid">
        <article class="metric-card">
          <span class="metric-label">Comunidades</span>
          <strong>${fmt(d.communities)}</strong>
          <small class="tiny-note">Activas bajo tu cuenta</small>
          <span class="metric-icon">${icon('people')}</span>
        </article>
        <article class="metric-card">
          <span class="metric-label">Huertos accesibles</span>
          <strong>${fmt(d.gardens)}</strong>
          <small class="tiny-note">${fmt(state.gardens.filter(g => g.status === 'ACTIVO').length)} activos</small>
          <span class="metric-icon">${icon('grid')}</span>
        </article>
        <article class="metric-card">
          <span class="metric-label">Cultivos activos</span>
          <strong>${fmt(activeCrops)}</strong>
          <small class="tiny-note">Parcelas sembradas</small>
          <span class="metric-icon">${icon('flower2')}</span>
        </article>
        <article class="metric-card">
          <span class="metric-label">Por atender</span>
          <strong>${fmt(reviewQueue.length + d.pending + pendingInvs)}</strong>
          <small class="tiny-note">${reviewQueue.length} por validar · ${d.pending} propias</small>
          <span class="metric-icon">${icon('bell')}</span>
        </article>
        <article class="metric-card">
          <span class="metric-label">Progreso (${e(LEVELS[d.level] || d.level)})</span>
          <strong>${fmt(d.points)} pts</strong>
          <small class="tiny-note">${d.approved} labores aprobadas</small>
          <span class="metric-icon">${icon('stars')}</span>
        </article>
      </div>

      <section class="kp-action-banner mt-3">
        <strong class="small text-uppercase">${icon('compass')} Qué hacer ahora</strong>
        <div class="kp-action-items">
          ${nextSteps.slice(0, 2).map(s => `
            <div class="kp-action-item">
              <span>${icon(s.icon)} ${e(s.text)}</span>
              ${s.action
                ? `<button type="button" class="btn btn-sm btn-success" data-action="${e(s.action)}">${e(s.cta)}</button>`
                : `<button type="button" class="btn btn-sm btn-outline-success" data-nav="${e(s.nav)}">${e(s.cta)}</button>`}
            </div>
          `).join('')}
        </div>
      </section>

      <div class="dash-split-grid">
        <div class="d-grid gap-3 align-content-start">
          <section class="panel dash-box">
            <div class="section-heading mt-0 mb-2">
              <div>
                <h2>Tu camino de cultivo</h2>
                <p>Nivel: <strong>${e(LEVELS[d.level] || d.level)}</strong></p>
              </div>
              <button type="button" class="detail-btn" data-nav="ranking">Ranking ${icon('arrow-up-right')}</button>
            </div>
            <div class="progress" style="height:9px;background:var(--surface-soft)">
              <div class="progress-bar" role="progressbar" aria-label="Progreso de nivel" aria-valuenow="${Math.min(d.points, 300)}" aria-valuemin="0" aria-valuemax="300" style="width:${Math.min(100, d.points < 100 ? d.points : d.points < 300 ? ((d.points - 100) / 2) : 100)}%;background:#548566"></div>
            </div>
            <p class="tiny-note mt-2 mb-3">Aprendiz: 0–99 pts · Oficial: 100–299 pts · Maestro: 300+ pts.</p>
            ${upcoming.length ? `
              <div class="upcoming-moon-strip">
                <strong class="d-block small mb-2">${icon('calendar3')} Próximas jornadas lunares</strong>
                <div class="d-flex flex-wrap gap-2">
                  ${upcoming.map(u => `<span class="badge bg-light text-dark border">${e(u.date.slice(5))} · ${e(u.name)}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </section>

          <section class="panel dash-box">
            <div class="section-heading mt-0 mb-2">
              <div>
                <h2>Huertos recientes</h2>
                <p>Acceso directo a tus tableros 2D.</p>
              </div>
              <button type="button" class="detail-btn" data-nav="huertos">Ver todos ${icon('arrow-right')}</button>
            </div>
            ${state.gardens.length
              ? `<div class="d-grid gap-2">
                  ${state.gardens.slice(0, 3).map(g => `
                    <div class="dash-garden-row">
                      <div class="min-w-0">
                        <strong class="d-block text-truncate">${e(g.name)}</strong>
                        <div class="tiny-note">${e(g.community.name)} · ${g.rows}×${g.cols} · ${g._count?.crops || 0} cultivos · ${e(cap(g.soil))}</div>
                      </div>
                      <div class="d-flex align-items-center gap-2 flex-none">
                        ${status(g.status)}
                        <button type="button" class="btn btn-sm btn-outline-success" data-action="open-garden" data-id="${e(g.id)}">Abrir</button>
                      </div>
                    </div>
                  `).join('')}
                </div>`
              : empty('flower2', 'Tu primer huerto empieza aquí', 'Crea una comunidad y configura tu huerto 2D.', `<button type="button" class="btn-forest" data-nav="comunidades">Ir a comunidades</button>`)}
          </section>
        </div>

        <section class="panel dash-box align-self-start">
          <div class="section-heading mt-0 mb-3">
            <div>
              <h2>Actividad reciente</h2>
              <p>Últimos registros en bitácora.</p>
            </div>
            <button type="button" class="detail-btn" data-nav="actividades">Ver bitácora ${icon('arrow-right')}</button>
          </div>
          ${recentActs.length
            ? `<div class="kp-mini-timeline">
                ${recentActs.map(a => `
                  <div class="kp-mini-timeline-item">
                    <img src="/uploads/${e(a.imageName)}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="${e(a.task)}">
                    <div class="min-w-0 flex-grow-1">
                      <div class="d-flex justify-content-between align-items-center gap-1">
                        <strong class="small text-truncate">${e(TASK_LABELS[a.task] || cap(a.task))} · ${e(a.crop.plant.commonName)}</strong>
                        ${status(a.status)}
                      </div>
                      <div class="tiny-note text-truncate">${e(a.crop.garden.name)} · ${e(a.volunteer.name)} · ${shortDate(a.createdAt)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>`
            : empty('journal-richtext', 'Sin labores registradas aún', 'Abre un huerto y sube la primera evidencia fotográfica para iniciar tu bitácora.', `<button type="button" class="btn-outline-forest btn-sm-soft" data-nav="huertos">Ir a huertos</button>`)}
        </section>
      </div>
    `;
  }

  function communitiesPage() {
    const isAdm = state.user?.role === 'ADMINISTRADOR';
    const owned = state.ownedCommunities || [];
    const shared = state.sharedCommunities || [];
    const ownedIds = new Set(owned.map(c => c.id));
    const sharedIds = new Set(shared.map(c => c.id));
    const supervised = isAdm ? (state.communities || []).filter(c => !ownedIds.has(c.id) && !sharedIds.has(c.id)) : [];
    const visibleAll = [...owned, ...shared, ...supervised];
    const totalMembers = new Set(visibleAll.flatMap(c => (c.members || []).map(m => m.userId || m.user?.id))).size;
    const totalGardens = visibleAll.reduce((s, c) => s + (c._count?.gardens ?? (c.gardens?.length || 0)), 0);

    const renderCompactTable = (list, isOwnedList) => `
      <div class="management-table-wrap table-responsive">
        <table class="table table-hover align-middle mb-0 kp-responsive-table">
          <thead>
            <tr class="table-light">
              <th>Comunidad</th>
              <th>Tipo</th>
              <th>Responsable</th>
              <th>Integrantes</th>
              <th>Huertos</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(c => {
              const isOwner = isOwnedList || c.ownerId === state.user?.id;
              const canManage = isOwner || isAdm;
              const ownerName = c.owner?.name || c.leader?.name || 'Responsable';
              const gCount = c._count?.gardens ?? (c.gardens?.length || 0);
              return `
                <tr>
                  <td data-label="Comunidad">
                    <strong>${e(c.name)}</strong>
                    <div class="tiny-note">${c.description ? e(c.description) : `Creada el ${shortDate(c.createdAt)}`}</div>
                  </td>
                  <td data-label="Tipo"><span class="tag tag-neutral">${e(COMMUNITY_TYPE_LABELS[c.type] || cap(c.type))}</span></td>
                  <td data-label="Responsable">${e(ownerName)}</td>
                  <td data-label="Integrantes">${(c.members || []).length}</td>
                  <td data-label="Huertos">${gCount}</td>
                  <td data-label="Acciones" class="text-end">
                    <div class="d-inline-flex flex-wrap gap-1 justify-content-end">
                      <button type="button" class="btn btn-sm btn-outline-secondary" data-action="community-detail" data-id="${e(c.id)}">Detalle</button>
                      ${canManage ? `
                        <button type="button" class="btn btn-sm btn-outline-success" data-action="manage-members" data-id="${e(c.id)}">Integrantes</button>
                        <button type="button" class="btn btn-sm btn-success" data-action="invite-member" data-id="${e(c.id)}">Invitar</button>
                      ` : `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="view-members" data-id="${e(c.id)}">Equipo</button>`}
                    </div>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    return `
      ${pageHead('La semilla', 'Comunidades', 'Organización editorial de tus comunidades propias, equipo colaborador, permisos y huertos.', `
        <div class="btn-group btn-group-sm" role="group" aria-label="Vista de comunidades">
          <button type="button" class="btn ${state.communityView === 'cards' ? 'btn-success' : 'btn-outline-secondary'}" data-action="community-view" data-view="cards">${icon('grid')} Visual</button>
          <button type="button" class="btn ${state.communityView === 'list' ? 'btn-success' : 'btn-outline-secondary'}" data-action="community-view" data-view="list">${icon('table')} Compacta</button>
        </div>
        <button type="button" class="btn-forest" data-action="new-community">${icon('plus-lg')} Crear comunidad</button>
      `)}

      ${isAdm ? `
        <div class="alert alert-info d-flex align-items-center gap-2 mb-3 p-3 rounded-3 border-info-subtle">
          ${icon('shield-fill-check', 'fs-4 text-primary')}
          <div class="small"><strong>Modo Administrador Global:</strong> acceso de supervisión y auditoría sobre todas las comunidades.</div>
        </div>
      ` : ''}

      <div class="stats-grid-4 mb-4">
        <div class="stat-mini-box"><span>Propias</span><strong>${owned.length}</strong></div>
        <div class="stat-mini-box"><span>Compartidas</span><strong>${shared.length}</strong></div>
        <div class="stat-mini-box"><span>Participantes únicos</span><strong>${totalMembers}</strong></div>
        <div class="stat-mini-box"><span>Huertos asociados</span><strong>${totalGardens}</strong></div>
      </div>

      <div class="community-sections">
        <div class="mb-5">
          <div class="section-heading mt-0 mb-3">
            <div>
              <h2 style="font-size: 20px;">${icon('house-heart', 'text-success')} Mis comunidades (Propietario)</h2>
              <p>Control total sobre integrantes, permisos granulares y huertos asociados.</p>
            </div>
            <span class="tag tag-approved">${owned.length} propias</span>
          </div>
          ${owned.length
            ? (state.communityView === 'list' ? renderCompactTable(owned, true) : `<div class="grid-3 stagger-grid">${owned.map(c => communityCard(c, true)).join('')}</div>`)
            : `<div class="p-4 bg-light rounded-3 text-center border">
                <p class="mb-2 text-muted">Aún no has creado una comunidad propia.</p>
                <button type="button" class="btn btn-sm btn-outline-success" data-action="new-community">${icon('plus-lg')} Crear mi primera comunidad</button>
              </div>`}
        </div>

        <div class="mb-4">
          <div class="section-heading mt-0 mb-3">
            <div>
              <h2 style="font-size: 20px;">${icon('people', 'text-primary')} Compartidas conmigo (Colaborador)</h2>
              <p>Comunidades donde colaboras según los permisos otorgados por su propietario.</p>
            </div>
            <span class="tag tag-neutral">${shared.length} compartidas</span>
          </div>
          ${shared.length
            ? (state.communityView === 'list' ? renderCompactTable(shared, false) : `<div class="grid-3 stagger-grid">${shared.map(c => communityCard(c, false)).join('')}</div>`)
            : `<div class="p-4 bg-light rounded-3 text-center border"><p class="mb-0 text-muted">No tienes comunidades compartidas por el momento.</p></div>`}
        </div>

        ${isAdm ? `
          <div class="mb-4">
            <div class="section-heading mt-0 mb-3">
              <div>
                <h2 style="font-size: 20px;">${icon('globe2', 'text-success')} Supervisión global del ecosistema</h2>
                <p>Comunidades gestionadas por otros líderes visibles para auditoría y soporte administrativo.</p>
              </div>
              <span class="tag tag-neutral">${supervised.length} supervisadas</span>
            </div>
            ${supervised.length
              ? (state.communityView === 'list' ? renderCompactTable(supervised, false) : `<div class="grid-3 stagger-grid">${supervised.map(c => communityCard(c, false)).join('')}</div>`)
              : `<div class="p-4 bg-light rounded-3 text-center border"><p class="mb-0 text-muted">No existen otras comunidades adicionales.</p></div>`}
          </div>
        ` : ''}
      </div>`;
  }

  function filteredSortedPlants() {
    const q = (state.search || '').trim().toLowerCase();
    let items = state.plants.filter(p =>
      (state.filter === 'TODAS' || p.thermal === state.filter) &&
      (state.soilFilter === 'TODAS' || p.soils?.some(s => s.soil === state.soilFilter)) &&
      (state.cycleFilter === 'TODAS' || p.cycle === state.cycleFilter) &&
      (state.verifiedFilter === 'TODAS' || (state.verifiedFilter === 'VERIFIED' ? p.verified : !p.verified)) &&
      (!q || p.commonName.toLowerCase().includes(q) || p.scientific.toLowerCase().includes(q) || (p.family || '').toLowerCase().includes(q) || (p.uses || '').toLowerCase().includes(q))
    );
    items = [...items].sort((a, b) => {
      if (state.plantSort === 'name_desc') return b.commonName.localeCompare(a.commonName, 'es');
      if (state.plantSort === 'thermal') return a.thermal.localeCompare(b.thermal) || a.commonName.localeCompare(b.commonName, 'es');
      if (state.plantSort === 'cycle') return a.cycle.localeCompare(b.cycle) || a.commonName.localeCompare(b.commonName, 'es');
      return a.commonName.localeCompare(b.commonName, 'es');
    });
    return items;
  }

  function plantResults() {
    const items = filteredSortedPlants();
    const hasFilter = Boolean((state.search || '').trim()) || state.filter !== 'TODAS' || state.soilFilter !== 'TODAS' || state.cycleFilter !== 'TODAS' || state.verifiedFilter !== 'TODAS';
    const perPage = 12;
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    if (state.plantPage > totalPages) state.plantPage = totalPages;
    const slice = items.slice((state.plantPage - 1) * perPage, state.plantPage * perPage);
    if (!slice.length) {
      return empty(
        'search',
        'No se encontraron plantas',
        'Prueba cambiando los filtros de búsqueda, suelo, ciclo o cualidad térmica.',
        hasFilter ? `<button type="button" class="btn-outline-forest btn-sm" data-action="clear-plant-filters">${icon('arrow-counterclockwise')} Limpiar filtros</button>` : ''
      );
    }
    return `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <span class="tag tag-neutral">${items.length} especie${items.length === 1 ? '' : 's'} ${hasFilter ? 'coincidente' + (items.length === 1 ? '' : 's') : 'registrada' + (items.length === 1 ? '' : 's')}</span>
        ${hasFilter ? `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="clear-plant-filters">${icon('x-circle')} Limpiar filtros</button>` : ''}
      </div>
      <div class="grid-3">${slice.map(plantCard).join('')}</div>
      ${totalPages > 1 ? `
        <nav class="d-flex justify-content-center align-items-center gap-2 mt-4" aria-label="Paginación del catálogo">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="plant-page" data-page="${state.plantPage - 1}" ${state.plantPage <= 1 ? 'disabled' : ''}>Anterior</button>
          <span class="small text-muted">Página ${state.plantPage} de ${totalPages} (${items.length} especies)</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="plant-page" data-page="${state.plantPage + 1}" ${state.plantPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        </nav>
      ` : ''}`;
  }

  function catalogPage() {
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const header = state.user
      ? pageHead('La tierra', 'Catálogo botánico medicinal', 'Fichas con fotografías reales verificadas, pisos altitudinales y compatibilidad de suelos.', isAdmin ? `<button type="button" class="btn-forest" data-action="new-plant">${icon('plus-lg')} Agregar planta</button>` : '')
      : `<section class="public-content public-section">${pageHead('La tierra', 'Catálogo botánico medicinal', 'Fichas de referencia botánica y cultural. Los datos clínicos no validados se muestran claramente como pendientes.')}`;

    return `
      ${header}
      <div class="catalog-tools">
        <div class="search-box">
          ${icon('search')}
          <input id="searchPlants" placeholder="Buscar por nombre común, científico, familia o uso..." aria-label="Buscar planta" value="${e(state.search || '')}">
        </div>
        <select class="form-select" id="thermalFilter" aria-label="Filtrar por cualidad térmica" style="width:auto">
          <option value="TODAS">Todas las cualidades</option>
          <option value="FRIA" ${state.filter === 'FRIA' ? 'selected' : ''}>Frescas / frías</option>
          <option value="CALIENTE" ${state.filter === 'CALIENTE' ? 'selected' : ''}>Cálidas</option>
        </select>
        <select class="form-select" id="soilCatalogFilter" aria-label="Filtrar por suelo" style="width:auto">
          <option value="TODAS">Todos los suelos</option>
          ${SOILS.map(s => `<option value="${s}" ${state.soilFilter === s ? 'selected' : ''}>Suelo ${e(cap(s))}</option>`).join('')}
        </select>
        <select class="form-select" id="cycleCatalogFilter" aria-label="Filtrar por ciclo" style="width:auto">
          <option value="TODAS">Todos los ciclos</option>
          <option value="CORTO" ${state.cycleFilter === 'CORTO' ? 'selected' : ''}>Ciclo corto</option>
          <option value="LARGO" ${state.cycleFilter === 'LARGO' ? 'selected' : ''}>Ciclo largo</option>
        </select>
        <select class="form-select" id="verifiedCatalogFilter" aria-label="Filtrar por validación" style="width:auto">
          <option value="TODAS">Toda validación</option>
          <option value="VERIFIED" ${state.verifiedFilter === 'VERIFIED' ? 'selected' : ''}>Validadas</option>
          <option value="PENDING" ${state.verifiedFilter === 'PENDING' ? 'selected' : ''}>Pendientes de validación</option>
        </select>
        <select class="form-select" id="sortPlants" aria-label="Ordenar plantas" style="width:auto">
          <option value="name_asc" ${state.plantSort === 'name_asc' ? 'selected' : ''}>Nombre A–Z</option>
          <option value="name_desc" ${state.plantSort === 'name_desc' ? 'selected' : ''}>Nombre Z–A</option>
          <option value="thermal" ${state.plantSort === 'thermal' ? 'selected' : ''}>Cualidad térmica</option>
          <option value="cycle" ${state.plantSort === 'cycle' ? 'selected' : ''}>Ciclo</option>
        </select>
      </div>
      <div id="plantResults">${plantResults()}</div>
      ${!state.user ? '</section>' : ''}`;
  }

  function gardensResultsHtml() {
    const all = state.gardens || [];
    const gq = (state.gardenSearch || '').trim().toLowerCase();
    const filtered = all.filter(g =>
      (state.gardenStatusFilter === 'TODAS' || g.status === state.gardenStatusFilter) &&
      (state.gardenSoilFilter === 'TODAS' || g.soil === state.gardenSoilFilter) &&
      (!gq || g.name.toLowerCase().includes(gq) || g.community.name.toLowerCase().includes(gq) || `${g.parish} ${g.province}`.toLowerCase().includes(gq))
    );
    return filtered.length
      ? `<div class="grid-3">${filtered.map(gardenCard).join('')}</div>`
      : (all.length
        ? empty('search', 'Sin huertos con esos filtros', 'Prueba limpiando el buscador o seleccionando otro tipo de suelo o estado.')
        : empty('grid-3x3-gap', 'Aquí aparecerán tus huertos', 'Primero crea una comunidad o pide permiso al propietario para registrar huertos.', `<button type="button" class="btn-forest" data-nav="comunidades">Ver comunidades ${icon('arrow-right')}</button>`));
  }

  function gardensPage() {
    const available = state.ownedCommunities.length > 0 ||
      state.sharedCommunities.some(c => c.myPermissions?.includes('CREATE_GARDENS')) ||
      state.user?.role === 'ADMINISTRADOR';
    const all = state.gardens || [];
    const activeCount = all.filter(g => g.status === 'ACTIVO').length;
    const pendingCount = all.filter(g => g.status !== 'ACTIVO').length;
    const totalCrops = all.reduce((s, g) => s + (g._count?.crops || 0), 0);

    return `
      ${pageHead('El reflejo', 'Huertos comunitarios', 'Panel operativo con configuración agronómica, dimensiones de cuadrícula y acceso directo a parcelas 2D.', available ? `<button type="button" class="btn-forest" data-action="new-garden">${icon('plus-lg')} Crear huerto</button>` : '')}
      ${all.length ? `
        <div class="stats-grid-4 mb-3">
          <div class="stat-mini-box"><span>Total huertos</span><strong>${all.length}</strong></div>
          <div class="stat-mini-box"><span>Validados activos</span><strong>${activeCount}</strong></div>
          <div class="stat-mini-box"><span>Pendientes / observados</span><strong>${pendingCount}</strong></div>
          <div class="stat-mini-box"><span>Cultivos registrados</span><strong>${totalCrops}</strong></div>
        </div>
        <div class="catalog-tools mb-4">
          <div class="search-box">
            ${icon('search')}
            <input id="searchGardens" placeholder="Buscar huerto, comunidad o ubicación..." aria-label="Buscar huerto" value="${e(state.gardenSearch || '')}">
          </div>
          <select class="form-select" id="gardenStatusFilter" aria-label="Filtrar por estado" style="width:auto">
            <option value="TODAS">Todos los estados</option>
            <option value="ACTIVO" ${state.gardenStatusFilter === 'ACTIVO' ? 'selected' : ''}>Activos</option>
            <option value="PENDIENTE" ${state.gardenStatusFilter === 'PENDIENTE' ? 'selected' : ''}>Pendientes</option>
            <option value="OBSERVADO" ${state.gardenStatusFilter === 'OBSERVADO' ? 'selected' : ''}>Observados</option>
          </select>
          <select class="form-select" id="gardenSoilFilter" aria-label="Filtrar por suelo" style="width:auto">
            <option value="TODAS">Todos los suelos</option>
            ${SOILS.map(s => `<option value="${s}" ${state.gardenSoilFilter === s ? 'selected' : ''}>Suelo ${e(cap(s))}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div id="gardensResults">${gardensResultsHtml()}</div>
    `;
  }

  function renderParcelCell(cell, crop, canManageCrops) {
    if (!crop) {
      return `
        <button type="button" class="garden-parcel is-empty" data-cell-id="${e(cell)}" data-row="${e(cell[0])}" data-col="${e(cell.slice(1))}" data-plant="" data-stage="" data-thermal="" data-occupancy="LIBRE" ${canManageCrops ? `data-action="new-crop" data-cell="${e(cell)}"` : 'disabled title="No tienes permiso para asociar plantas"'}>
          <span class="parcel-soil-layer" aria-hidden="true"></span>
          <span class="parcel-coord">${e(cell)}</span>
          <span class="parcel-empty-cta">${icon(canManageCrops ? 'plus-circle' : 'lock')} ${canManageCrops ? 'Sembrar' : 'Libre'}</span>
        </button>`;
    }

    const watering = crop.activities?.find(a => a.task === 'RIEGO');
    const plantImg = crop.plant.imageUrl;

    return `
      <button type="button" class="garden-parcel stage-${e(crop.stage)} thermal-${e(crop.plant.thermal)}" data-action="crop-detail" data-id="${e(crop.id)}" data-cell-id="${e(cell)}" data-row="${e(cell[0])}" data-col="${e(cell.slice(1))}" data-plant="${e(crop.plant.commonName)}" data-stage="${e(crop.stage)}" data-thermal="${e(crop.plant.thermal)}" data-occupancy="OCUPADA">
        <span class="parcel-soil-layer" aria-hidden="true"></span>
        <div class="parcel-top">
          <span class="parcel-coord">${e(cell)}</span>
          <span class="parcel-thermal-dot ${crop.plant.thermal === 'CALIENTE' ? 'hot' : 'cold'}" title="${crop.plant.thermal === 'CALIENTE' ? 'Planta cálida' : 'Planta fresca / fría'}"></span>
        </div>
        <div class="parcel-plant-layer" data-stage="${e(crop.stage)}" aria-hidden="true">
          <img class="parcel-sprout-img" src="/assets/plants/brote-inicial.svg" alt="">
          ${plantImg
            ? `<img class="parcel-plant-img" src="${e(plantImg)}" loading="lazy" alt="${e(crop.plant.commonName)}">`
            : `<span class="parcel-prep-chip">${icon('flower2')} ${e(cap(crop.stage))}</span>`}
        </div>
        <div class="parcel-signage">
          <h3>${e(crop.plant.commonName)}</h3>
          <div class="parcel-signage-meta">
            <span>${e(cap(crop.stage))}</span>
            <span>${icon('droplet-half')} ${watering ? shortDate(watering.createdAt) : 'Sin riego'}</span>
          </div>
        </div>
      </button>`;
  }

  function getFilteredGardenCells(garden) {
    const cropsMap = new Map(garden.crops.map(c => [c.cell.replace('-', ''), c]));
    const f = state.gridFilter;
    const q = (f.q || '').trim().toLowerCase();
    const list = [];
    for (let r = 0; r < garden.rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      for (let c = 1; c <= garden.cols; c++) {
        const cell = `${rowLetter}${c}`;
        const crop = cropsMap.get(cell) || null;
        const rowMatch = f.row === 'TODAS' || f.row === rowLetter;
        const colMatch = f.col === 'TODAS' || f.col === String(c);
        const plantMatch = f.plant === 'TODAS' || crop?.plant.commonName === f.plant;
        const stageMatch = f.stage === 'TODAS' || crop?.stage === f.stage;
        const thermalMatch = f.thermal === 'TODAS' || crop?.plant.thermal === f.thermal;
        const occMatch = f.occupancy === 'TODAS' || (f.occupancy === 'OCUPADA' ? Boolean(crop) : !crop);
        const qMatch = !q || (crop && (crop.plant.commonName.toLowerCase().includes(q) || crop.plant.scientific.toLowerCase().includes(q))) || cell.toLowerCase().includes(q);
        list.push({ cell, rowLetter, colNum: c, crop, visible: rowMatch && colMatch && plantMatch && stageMatch && thermalMatch && occMatch && qMatch });
      }
    }
    return list;
  }

  function renderGardenGridOrTable(garden, canManageCrops) {
    const items = getFilteredGardenCells(garden);
    const visibleItems = items.filter(x => x.visible);

    if (state.gridFilter.view === 'list') {
      return `
        <!-- Vista Desktop: Tabla compacta -->
        <div class="management-table-wrap table-responsive mt-3 d-none d-md-block">
          <table class="table table-sm table-hover align-middle mb-0 kp-parcel-table">
            <thead>
              <tr class="table-light">
                <th style="width: 80px;">Casilla</th>
                <th>Especie cultivada</th>
                <th style="width: 100px;">Cualidad</th>
                <th style="width: 120px;">Etapa</th>
                <th>Siembra / Técnica</th>
                <th>Último riego</th>
                <th style="width: 110px;" class="text-end">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${visibleItems.length ? visibleItems.map(item => {
                if (!item.crop) {
                  return `
                    <tr class="kp-row-empty">
                      <td><span class="badge bg-secondary font-monospace">${e(item.cell)}</span></td>
                      <td class="text-muted fst-italic">Disponible para siembra</td>
                      <td>—</td>
                      <td><span class="tag tag-neutral">Disponible</span></td>
                      <td>—</td>
                      <td>—</td>
                      <td class="text-end">${canManageCrops ? `<button type="button" class="btn btn-sm btn-outline-success py-1 px-2" data-action="new-crop" data-cell="${e(item.cell)}">${icon('plus-lg')} Sembrar</button>` : '<span class="small text-muted">Solo lectura</span>'}</td>
                    </tr>`;
                }
                const c = item.crop;
                const watering = c.activities?.find(a => a.task === 'RIEGO');
                return `
                  <tr class="kp-row-occupied">
                    <td><span class="badge bg-forest font-monospace">${e(item.cell)}</span></td>
                    <td>
                      <div class="management-plant-cell">
                        ${c.plant.imageUrl ? `<img src="${e(c.plant.imageUrl)}" alt="${e(c.plant.commonName)}">` : icon('flower2')}
                        <div><strong>${e(c.plant.commonName)}</strong><div class="small text-muted fst-italic">${e(c.plant.scientific)}</div></div>
                      </div>
                    </td>
                    <td><span class="tag ${c.plant.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${c.plant.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca'}</span></td>
                    <td><span class="tag tag-approved">${e(STAGE_LABELS[c.stage] || cap(c.stage))}</span></td>
                    <td><small class="d-block text-forest fw-medium">${e(cap(c.technique))}</small><small class="text-muted">${shortDate(c.createdAt)}</small></td>
                    <td><small class="d-block ${watering ? 'text-forest' : 'text-muted'}">${watering ? shortDate(watering.createdAt) : 'Sin registro'}</small><small class="text-muted">${watering?.irrigationType ? (IRRIGATION_LABELS[watering.irrigationType] || watering.irrigationType) : ''}</small></td>
                    <td class="text-end"><button type="button" class="btn btn-sm btn-outline-forest py-1 px-2" data-action="crop-detail" data-id="${e(c.id)}">Gestionar</button></td>
                  </tr>`;
              }).join('') : `<tr><td colspan="7" class="text-center p-4 text-muted">Ninguna casilla coincide con los filtros actuales.</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- Vista Mobile: Tarjetas estructuradas -->
        <div class="kp-parcel-mobile-cards d-md-none mt-3">
          ${visibleItems.length ? visibleItems.map(item => {
            if (!item.crop) {
              return `
                <div class="kp-parcel-card is-empty">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-secondary font-monospace">Casilla ${e(item.cell)}</span>
                    <span class="tag tag-neutral">Disponible</span>
                  </div>
                  <div class="small text-muted mt-2">Casilla lista para siembra comunitaria</div>
                  <div class="mt-2 text-end">
                    ${canManageCrops ? `<button type="button" class="btn btn-sm btn-outline-success" data-action="new-crop" data-cell="${e(item.cell)}">${icon('plus-lg')} Sembrar</button>` : '<span class="small text-muted">Solo lectura</span>'}
                  </div>
                </div>`;
            }
            const c = item.crop;
            const watering = c.activities?.find(a => a.task === 'RIEGO');
            return `
              <div class="kp-parcel-card is-occupied">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-forest font-monospace">Casilla ${e(item.cell)}</span>
                  <div class="d-flex gap-1">
                    <span class="tag ${c.plant.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${c.plant.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca'}</span>
                    <span class="tag tag-approved">${e(STAGE_LABELS[c.stage] || cap(c.stage))}</span>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  ${c.plant.imageUrl ? `<img src="${e(c.plant.imageUrl)}" alt="${e(c.plant.commonName)}" class="rounded-circle" style="width:36px;height:36px;object-fit:cover">` : icon('flower2', 'fs-3 text-success')}
                  <div>
                    <strong class="d-block text-forest">${e(c.plant.commonName)}</strong>
                    <small class="text-muted fst-italic">${e(c.plant.scientific)}</small>
                  </div>
                </div>
                <div class="small text-muted d-flex justify-content-between py-1 border-top border-bottom mb-2">
                  <span>Técnica: <strong>${e(cap(c.technique))}</strong></span>
                  <span>Riego: <strong>${watering ? shortDate(watering.createdAt) : 'Sin registro'}</strong></span>
                </div>
                <div class="text-end">
                  <button type="button" class="btn btn-sm btn-outline-forest" data-action="crop-detail" data-id="${e(c.id)}">Gestionar parcela</button>
                </div>
              </div>`;
          }).join('') : `<div class="p-4 text-center text-muted bg-paper rounded-3 border">Ninguna casilla coincide con los filtros actuales.</div>`}
        </div>`;
    }

    const rowLetters = Array.from({ length: garden.rows }, (_, i) => String.fromCharCode(65 + i));
    const colNumbers = Array.from({ length: garden.cols }, (_, i) => i + 1);
    const byCell = new Map(items.map(x => [x.cell, x]));

    return `
      <div class="garden-plot-shell arch-${e(garden.architecture)} ${garden.fence === 'SI' ? 'has-fence' : ''} mt-3">
        <div class="garden-plot-banner">
          <div>
            <strong>${e(ARCH_LABELS[garden.architecture] || cap(garden.architecture))}</strong> · Suelo ${e(cap(garden.soil))} · Cerramiento: ${garden.fence === 'SI' ? 'Sí' : 'No'}
          </div>
          <div class="garden-drip-bar">
            ${icon('droplet-fill')} Riego: ${e(cap(garden.irrigation))} · Abono: ${e(cap(garden.fertilizer))}
          </div>
        </div>
        <div class="garden-matrix-scroll">
          <div class="garden-matrix" id="gardenMatrix" data-zoom="${e(state.gridFilter.zoom || 'normal')}" style="--grid-cols:${garden.cols}">
            <div class="grid-corner-head" title="Fila / Columna">F/C</div>
            ${colNumbers.map(c => `<div class="grid-col-head">${c}</div>`).join('')}
            ${rowLetters.map(r => `
              <div class="grid-row-head">${r}</div>
              ${colNumbers.map(c => {
                const cell = `${r}${c}`;
                const item = byCell.get(cell);
                const html = renderParcelCell(cell, item?.crop, canManageCrops);
                return item?.visible ? html : html.replace('<button ', '<button hidden ');
              }).join('')}
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  function gardenPage() {
    const data = state.gardenDetail;
    if (!data) return empty('exclamation-circle', 'Huerto no disponible', 'No se ha podido abrir la ficha de este huerto.');
    const { garden: g, canManageCrops, canRegisterActivity, canEditGarden, canViewStats, isOwner } = data;
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const allItems = getFilteredGardenCells(g);
    const visibleCount = allItems.filter(x => x.visible).length;

    const headerActions = `
      ${canEditGarden ? `<button type="button" class="btn-outline-forest btn-sm-soft" data-action="edit-garden" data-id="${e(g.id)}">${icon('pencil-square')} Editar huerto</button>` : ''}
      ${isAdmin && g.status !== 'ACTIVO' ? `<button type="button" class="btn-forest btn-sm-soft" data-action="approve-garden" data-id="${e(g.id)}">${icon('check-lg')} Aprobar huerto</button>` : ''}
      ${isAdmin && g.status === 'PENDIENTE' ? `<button type="button" class="btn-outline-forest btn-sm-soft" data-action="observe-garden" data-id="${e(g.id)}">${icon('chat-left-text')} Observar</button>` : ''}
      ${status(g.status)}
    `;

    const selector = (key, title, values) => `
      <label>${title}
        <select class="form-select" data-grid-filter="${key}">
          ${values.map(([v, label]) => `<option value="${e(v)}" ${state.gridFilter[key] === v ? 'selected' : ''}>${e(label)}</option>`).join('')}
        </select>
      </label>`;
    const opts = values => [['TODAS', 'Todas'], ...values.map(x => [x, cap(x)])];

    const stats = state.gardenStats;
    const statsHtml = (canViewStats && stats) ? `
      <section class="mt-4">
        <div class="section-heading">
          <div>
            <p class="kicker">Métricas en tiempo real</p>
            <h2>Estadísticas del huerto</h2>
          </div>
          <span class="tag tag-approved">PRJ: ${fmt(stats.rankingScore)}</span>
        </div>
        <div class="stats-grid-4">
          <div class="stat-mini-box"><span>Ocupación de parcelas</span><strong>${stats.occupiedCells} / ${stats.totalCells} (${stats.occupancyPct}%)</strong></div>
          <div class="stat-mini-box"><span>Balance térmico</span><strong>${stats.thermal.CALIENTE} cálidas · ${stats.thermal.FRIA} frías</strong></div>
          <div class="stat-mini-box"><span>Apego lunar</span><strong>${stats.lunarCompliancePct}% (${stats.lunarOptimalCount}/${stats.totalActivities})</strong></div>
          <div class="stat-mini-box"><span>Puntos acreditados</span><strong>${fmt(stats.totalApprovedPoints)} pts</strong></div>
        </div>
      </section>` : '';

    const logItems = state.gardenActivities || [];

    return `
      <div class="garden-compact-header mb-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="link-inline" data-nav="huertos">${icon('arrow-left')} Huertos</button>
            <span class="text-muted">/</span>
            <span class="text-muted small">${e(g.community.name)}</span>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            ${headerActions}
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
          <div>
            <h1 class="garden-compact-title m-0">${e(g.name)}</h1>
            <div class="garden-meta-pills d-flex align-items-center gap-2 flex-wrap mt-1">
              <span class="badge bg-light text-dark border">${icon('geo-alt')} ${e(g.parish)}, ${e(g.province)}</span>
              <span class="badge bg-light text-dark border">${icon('grid-3x3')} ${g.rows} × ${g.cols} (${g.rows * g.cols} parcelas)</span>
              <span class="badge bg-light text-dark border">${icon('rulers')} ${fmt(g.area)} m²</span>
              <span class="badge bg-light text-dark border">${icon('droplet')} ${e(IRRIGATION_LABELS[g.irrigation]?.label || g.irrigation)}</span>
              <span class="badge bg-light text-dark border">${icon('layers')} Suelo ${e(cap(g.soil))}</span>
              ${!isOwner && !isAdmin && state.user ? `<span class="badge bg-success-subtle text-success border border-success-subtle">${icon('shield-check')} Colaborador</span>` : ''}
            </div>
          </div>
        </div>

        ${g.observations ? `<div class="demo-alert mt-2 py-1 px-3 small">${icon('chat-left-text')} <strong>Observación técnica:</strong> ${e(g.observations)}</div>` : ''}
      </div>

      <div class="garden-section">
        <div>
          <div class="panel">
            <div class="section-heading mt-0 mb-3">
              <div>
                <h2>Mapa de parcelas (${g.rows} × ${g.cols})</h2>
                <p>Selecciona una parcela libre para sembrar o una ocupada para consultar y registrar labores.</p>
              </div>
              <div class="d-flex gap-2 align-items-center">
                <div class="btn-group btn-group-sm" role="group" aria-label="Modo de visualización">
                  <button type="button" class="btn ${state.gridFilter.view === 'grid' ? 'btn-success' : 'btn-outline-secondary'}" data-action="grid-view" data-view="grid">${icon('grid-3x3-gap')} Vista de huerto</button>
                  <button type="button" class="btn ${state.gridFilter.view === 'list' ? 'btn-success' : 'btn-outline-secondary'}" data-action="grid-view" data-view="list">${icon('table')} Vista de gestión</button>
                </div>
              </div>
            </div>

            <div class="garden-filter-toolbar">
              <div class="garden-filter-heading">
                <strong>${icon('sliders')} Filtros y exploración</strong>
                <div class="d-flex align-items-center gap-2">
                  <span id="gridCount">${visibleCount} de ${allItems.length} parcelas visibles</span>
                  <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" data-action="reset-grid-filters" title="Limpiar filtros">Limpiar</button>
                </div>
              </div>
              <div class="garden-filter-fields">
                <label>Buscar planta o casilla
                  <input type="search" class="form-control form-control-sm" id="gridSearchInput" placeholder="Ej. A1, Ruda..." value="${e(state.gridFilter.q || '')}" style="height:36px;padding:6px 10px!important;">
                </label>
                ${selector('row', 'Fila', opts(Array.from({ length: g.rows }, (_, i) => String.fromCharCode(65 + i))))}
                ${selector('col', 'Columna', opts(Array.from({ length: g.cols }, (_, i) => String(i + 1))))}
                ${selector('plant', 'Planta', opts([...new Set(g.crops.map(c => c.plant.commonName))]))}
                ${selector('stage', 'Etapa', opts(['PREPARACION', 'SIEMBRA', 'CRECIMIENTO', 'COSECHA']))}
                ${selector('thermal', 'Cualidad térmica', opts(['CALIENTE', 'FRIA']))}
                ${selector('occupancy', 'Espacio', [['TODAS', 'Todos'], ['LIBRE', 'Libres'], ['OCUPADA', 'Ocupadas']])}
                <label>Escala visual
                  <select class="form-select" data-grid-filter="zoom">
                    <option value="compact" ${state.gridFilter.zoom === 'compact' ? 'selected' : ''}>Compacta</option>
                    <option value="normal" ${state.gridFilter.zoom === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="large" ${state.gridFilter.zoom === 'large' ? 'selected' : ''}>Amplia</option>
                  </select>
                </label>
              </div>
            </div>

            <div id="gardenGridMount">${renderGardenGridOrTable(g, canManageCrops)}</div>

            <div class="garden-legend-bar mt-3">
              <span><span class="tag tag-hot">Borde rojo</span> Planta cálida</span>
              <span><span class="tag tag-cold">Borde verde</span> Planta fresca/fría</span>
              <span><strong>Preparación:</strong> Solo tierra</span>
              <span><strong>Siembra:</strong> Brote</span>
              <span><strong>Crecimiento / Cosecha:</strong> Planta escalada sobre tierra fija</span>
            </div>
          </div>

          ${statsHtml}

          <div class="section-heading">
            <h2>Plantas recomendadas para suelo ${e(cap(g.soil))}</h2>
          </div>
          <div class="panel">
            <p class="card-copy">Compatibilidad agronómica basada en las fichas botánicas registradas en el catálogo.</p>
            <div class="d-flex gap-2 flex-wrap">
              ${state.plants.filter(p => p.soils.some(s => s.soil === g.soil)).map(p => `<button type="button" class="tag tag-neutral border-0" data-action="plant-detail" data-id="${e(p.id)}">${e(p.commonName)}</button>`).join('') || '<span class="tiny-note">No hay plantas registradas para este suelo aún.</span>'}
            </div>
          </div>
        </div>

        <aside class="garden-aside">
          <div class="panel">
            <p class="kicker">Ficha del terreno</p>
            <div class="mb-3 rounded-3 overflow-hidden" style="height:130px;border:1px solid var(--line)">
              <img src="${e(ARCH_IMAGES[g.architecture] || ARCH_IMAGES.TIERRA)}" alt="${e(ARCH_LABELS[g.architecture] || g.architecture)}" style="width:100%;height:100%;object-fit:cover;">
            </div>
            ${[
              ['Comunidad', g.community.name],
              ['Tipología', ARCH_LABELS[g.architecture] || cap(g.architecture)],
              ['Área', fmt(g.area) + ' m²'],
              ['Coordenadas', `${fmt(g.latitude)}, ${fmt(g.longitude)}`],
              ['Orientación', cap(g.orientation)],
              ['Cerramiento', g.fence === 'SI' ? 'Sí' : 'No'],
              ['Tipo de suelo', cap(g.soil)],
              ['Riego', cap(g.irrigation)],
              ['Abono', cap(g.fertilizer)]
            ].map(([a, b]) => `<div class="field-pair"><span>${e(a)}</span><span>${e(b)}</span></div>`).join('')}
          </div>
          <div class="panel">
            <p class="kicker">Bitácora del huerto</p>
            <h3 class="card-title" style="font-size:20px">Cada labor cuenta.</h3>
            <p class="card-copy">${canRegisterActivity ? 'Selecciona una parcela ocupada para registrar su labor con fotografía real.' : 'Consulta las labores registradas abajo.'}</p>
            <button type="button" class="btn-forest w-100" data-action="scroll-log">Ver bitácora del huerto ${icon('arrow-down')}</button>
          </div>
        </aside>
      </div>

      <section class="garden-log" id="garden-log">
        <div class="section-heading">
          <div>
            <p class="kicker">Historial del huerto</p>
            <h2>Bitácora de actividades</h2>
            <p>Labores y evidencias registradas en ${e(g.name)}.</p>
          </div>
          <span class="tag tag-neutral">${logItems.length} registros</span>
        </div>
        ${logItems.length
          ? `<div class="activities-list">${logItems.map(a => activityCard(a)).join('')}</div>`
          : `<div class="garden-log-empty">${icon('journal-richtext')}<div><strong>Aún no hay actividades en este huerto.</strong><span>Selecciona una planta del tablero para registrar su cuidado.</span></div></div>`}
      </section>`;
  }

  function activitiesPage() {
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const canValidateAny = a => (isAdmin || (a.crop.garden.community.ownerId === state.user?.id && a.volunteerId !== state.user?.id)) && a.status === 'PENDIENTE';
    const pendingToReview = state.activities.filter(canValidateAny);

    let list = state.activities;
    if (state.activityTab === 'POR_VALIDAR') list = pendingToReview;
    else if (state.activityTab === 'PENDIENTE') list = state.activities.filter(a => a.status === 'PENDIENTE');
    else if (state.activityTab === 'APROBADA') list = state.activities.filter(a => a.status === 'APROBADA');
    else if (state.activityTab === 'RECHAZADA') list = state.activities.filter(a => a.status === 'RECHAZADA');

    const isValidationView = state.activityTab === 'POR_VALIDAR';

    return `
      ${pageHead('El ciclo', 'Bitácora agrícola y validaciones', 'Línea temporal de labores reales en campo con respaldo fotográfico y bandeja de revisión.')}
      <div class="dashboard-hero" style="min-height:auto;padding:20px 24px;margin-bottom:18px">
        <div>
          <p class="kicker mb-1">Orientación lunar andina</p>
          <h2 class="mb-1" style="font-size:22px">${e(state.moon?.name || 'Reloj lunar')} · ${e(state.moon?.subtitle || '')}</h2>
          <p class="mb-0">${e(state.moon?.advice || '')} · Las labores alineadas con la fase lunar reciben bonificación ×1.25.</p>
        </div>
        ${icon('moon-stars', 'fs-1 opacity-50')}
      </div>
      <div class="d-flex flex-wrap gap-2 mb-4">
        ${[
          ['TODAS', `Todas (${state.activities.length})`],
          ['POR_VALIDAR', `Bandeja de validación (${pendingToReview.length})`],
          ['PENDIENTE', 'Pendientes'],
          ['APROBADA', 'Aprobadas'],
          ['RECHAZADA', 'Rechazadas']
        ].map(([k, lbl]) => `<button type="button" class="btn btn-sm ${state.activityTab === k ? 'btn-success' : 'btn-outline-secondary'}" data-action="activity-tab" data-tab="${k}">${e(lbl)}</button>`).join('')}
      </div>
      ${list.length
        ? (isValidationView
          ? `<div class="kp-validation-list">${list.map(a => activityCard(a, true)).join('')}</div>`
          : `<div class="kp-timeline">${list.map(a => activityCard(a, false)).join('')}</div>`)
        : empty('journal-richtext', 'Sin registros en esta vista', 'Abre un huerto, selecciona un cultivo y registra una labor agrícola con fotografía.', `<button type="button" class="btn-forest" data-nav="huertos">Ir a mis huertos ${icon('arrow-right')}</button>`)}
    `;
  }

  function activityCard(a, isValidationMode = false) {
    const isGlobalAdmin = state.user?.role === 'ADMINISTRADOR';
    const isCommunityOwner = state.user?.id === a.crop.garden.community.ownerId || state.user?.id === a.crop.garden.community.leaderId;
    const isSelf = a.volunteerId === state.user?.id;
    const allowReview = (isGlobalAdmin || (isCommunityOwner && !isSelf)) && a.status === 'PENDIENTE';
    const allowEdit = isSelf && a.status === 'PENDIENTE';
    const photoSrc = `/uploads/${e(a.imageName)}`;
    const taskTitle = `${TASK_LABELS[a.task] || cap(a.task)} · ${a.crop.plant.commonName}`;

    if (isValidationMode) {
      return `
        <article class="kp-validation-tray">
          <button type="button" class="kp-validation-photo-btn" data-action="photo-zoom" data-src="${photoSrc}" data-title="${e(taskTitle)}" data-caption="${e(a.note)}" title="Ampliar fotografía">
            <img src="${photoSrc}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="Evidencia de ${e(taskTitle)}" loading="lazy">
            <span>${icon('zoom-in')} Ampliar</span>
          </button>
          <div class="kp-validation-body">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <div class="d-flex gap-2 flex-wrap mb-1">
                  ${status(a.status)}
                  ${a.lunarOptimal ? '<span class="tag tag-approved">Fase lunar ×1,25</span>' : ''}
                  ${a.crop.cell ? `<span class="tag tag-neutral">Casilla ${e(a.crop.cell)}</span>` : ''}
                </div>
                <h3 class="card-title mb-1" style="font-size:18px">${e(taskTitle)}</h3>
              </div>
              <span class="tiny-note">${icon('calendar3')} ${shortDate(a.createdAt)}</span>
            </div>
            <p class="small mb-2">${e(a.note)}</p>
            ${kvGrid([
              ['Responsable', a.volunteer.name],
              ['Huerto', a.crop.garden.name],
              ['Comunidad', a.crop.garden.community?.name || 'Comunidad'],
              ['Fase lunar', cap(a.phase)]
            ])}
          </div>
          <div class="kp-validation-actions">
            ${allowReview ? `
              <button type="button" class="btn btn-success btn-sm" data-action="approve-activity" data-id="${e(a.id)}">${icon('check-lg')} Aprobar y acreditar</button>
              <button type="button" class="btn btn-outline-danger btn-sm" data-action="reject-activity" data-id="${e(a.id)}">${icon('x-lg')} Rechazar con nota</button>
            ` : '<span class="tiny-note">Revisión completada o bloqueada por autovalidación.</span>'}
          </div>
        </article>`;
    }

    const dotClass = a.status === 'APROBADA' ? 'approved' : a.status === 'RECHAZADA' ? 'rejected' : 'pending';
    return `
      <article class="kp-timeline-item">
        <span class="kp-timeline-dot ${dotClass}" aria-hidden="true"></span>
        <div class="kp-timeline-card">
          <button type="button" class="kp-timeline-thumb" data-action="photo-zoom" data-src="${photoSrc}" data-title="${e(taskTitle)}" data-caption="${e(a.note)}" title="Ampliar fotografía">
            <img src="${photoSrc}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="Evidencia de ${e(a.task)}" loading="lazy">
          </button>
          <div class="activity-content">
            <div class="d-flex gap-2 align-items-center flex-wrap mb-1">
              ${status(a.status)}
              ${a.lunarOptimal ? '<span class="tag tag-approved">Fase lunar ×1,25</span>' : ''}
              ${a.crop.cell ? `<span class="tag tag-neutral">Casilla ${e(a.crop.cell)}</span>` : ''}
              ${a.pointsAwarded ? `<span class="tag tag-approved">${icon('stars')} +${fmt(a.pointsAwarded)} pts</span>` : ''}
            </div>
            <h3>${e(taskTitle)}</h3>
            <p>${e(a.note)}</p>
            <div class="activity-meta">
              <span>${icon('person')} ${e(a.volunteer.name)}</span>
              <span>${icon('calendar3')} ${shortDate(a.createdAt)}</span>
              <span>${icon('grid')} ${e(a.crop.garden.name)}</span>
            </div>
            ${a.reviewNote ? `<p class="mt-2 mb-0 small text-danger"><strong>Observación:</strong> ${e(a.reviewNote)}</p>` : ''}
          </div>
          <div class="activity-actions">
            ${allowReview ? `
              <button type="button" class="btn btn-sm btn-success" data-action="approve-activity" data-id="${e(a.id)}">${icon('check-lg')} Aprobar</button>
              <button type="button" class="btn btn-sm btn-outline-danger" data-action="reject-activity" data-id="${e(a.id)}">${icon('x-lg')} Rechazar</button>
            ` : ''}
            ${allowEdit ? `
              <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-activity" data-id="${e(a.id)}" data-task="${e(a.task)}" data-note="${e(a.note)}">${icon('pencil')} Editar</button>
            ` : ''}
          </div>
        </div>
      </article>`;
  }

  function rankingResultsHtml() {
    const all = state.rank || [];
    const topScore = Math.max(...all.map(r => Number(r.score) || 0), 1);
    const rq = (state.rankSearch || '').trim().toLowerCase();
    const filtered = all.filter(r =>
      (state.rankTypeFilter === 'TODAS' || r.type === state.rankTypeFilter) &&
      (!rq || r.community.toLowerCase().includes(rq) || r.name.toLowerCase().includes(rq))
    );
    return rankingRows(filtered, topScore);
  }

  function rankingPage() {
    return `
      ${state.user
        ? pageHead('La motivación', 'Ranking comunitario justo', 'Indicador proporcional que normaliza el puntaje real según los cultivos activos.')
        : `<section class="public-content public-section">${pageHead('La motivación', 'Ranking comunitario justo', 'Clasificación pública basada exclusivamente en huertos activos y evidencias aprobadas.')}`
      }
      <div class="panel">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3 pb-3 border-bottom">
          <div>
            <h2 class="mb-1" style="font-family:Georgia,serif;font-size:22px;color:var(--forest)">Clasificación de huertos activos</h2>
            <p class="small text-muted mb-0">Fórmula: Puntos validados acumulados (bono lunar ×1.25 incluido) ÷ cultivos activos.</p>
          </div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input type="search" id="rankSearchInput" class="form-control form-control-sm" placeholder="Buscar comunidad o huerto..." value="${e(state.rankSearch || '')}" style="width:210px">
            <select id="rankTypeFilter" class="form-select form-select-sm" style="width:auto">
              <option value="TODAS">Todos los tipos</option>
              ${Object.entries(COMMUNITY_TYPE_LABELS).map(([k, lbl]) => `<option value="${k}" ${state.rankTypeFilter === k ? 'selected' : ''}>${e(lbl)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="rankingResults">${rankingResultsHtml()}</div>
      </div>
      ${!state.user ? '</section>' : ''}`;
  }

  function adminPage() {
    const users = state.adminUsers || [];
    const logs = state.auditLogs || [];
    const pendingGardens = (state.gardens || []).filter(g => g.status !== 'ACTIVO');
    const pendingActivities = (state.activities || []).filter(a => a.status === 'PENDIENTE');

    return `
      ${pageHead('Gobernanza', 'Panel de Administración', 'Validación de huertos, revisión de evidencias, control de usuarios y registro de auditoría.')}

      <!-- Validación de Huertos -->
      <div class="panel mb-5">
        <div class="section-heading mt-0 mb-3">
          <div>
            <h2>${icon('patch-check')} Validación técnica de huertos</h2>
            <p>Aprueba u observa huertos en estado Pendiente u Observado para habilitarlos en el Ranking Público.</p>
          </div>
          <span class="tag tag-pending">${pendingGardens.length} por revisar</span>
        </div>
        ${pendingGardens.length ? `
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 kp-responsive-table">
              <thead><tr class="table-light"><th>Huerto</th><th>Comunidad</th><th>Terreno</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                ${pendingGardens.map(g => `
                  <tr>
                    <td data-label="Huerto"><div><strong>${e(g.name)}</strong><div class="small text-muted">${e(g.parish)}, ${e(g.province)}</div></div></td>
                    <td data-label="Comunidad">${e(g.community.name)}</td>
                    <td data-label="Terreno"><small>${fmt(g.area)} m² · ${e(cap(g.soil))} · ${g.rows}×${g.cols}</small></td>
                    <td data-label="Estado">${status(g.status)}</td>
                    <td data-label="Acciones">
                      <div class="d-flex flex-wrap gap-1 justify-content-end">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="open-garden" data-id="${e(g.id)}">Ver</button>
                        <button type="button" class="btn btn-sm btn-success" data-action="approve-garden" data-id="${e(g.id)}">${icon('check-lg')} Aprobar</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="observe-garden" data-id="${e(g.id)}">Observar</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<div class="p-3 bg-light rounded-3 text-muted small">Todos los huertos registrados han sido validados.</div>'}
      </div>

      <!-- Evidencias Pendientes -->
      <div class="panel mb-5">
        <div class="section-heading mt-0 mb-3">
          <div>
            <h2>${icon('camera')} Evidencias pendientes de validación</h2>
            <p>Supervisión global de actividades fotográficas enviadas por las comunidades.</p>
          </div>
          <span class="tag tag-pending">${pendingActivities.length} pendientes</span>
        </div>
        ${pendingActivities.length
          ? `<div class="kp-validation-list">${pendingActivities.slice(0, 10).map(a => activityCard(a, true)).join('')}</div>`
          : '<div class="p-3 bg-light rounded-3 text-muted small">No hay evidencias pendientes de revisión.</div>'}
      </div>

      <!-- Usuarios -->
      <div class="panel mb-5">
        <div class="section-heading mt-0 mb-3">
          <div>
            <h2>${icon('people-fill')} Usuarios Registrados</h2>
            <p>Control de cuentas globales, suspensión y niveles de experiencia.</p>
          </div>
          <span class="tag tag-neutral">${users.length} usuarios</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 kp-responsive-table">
            <thead>
              <tr class="table-light">
                <th>Usuario</th>
                <th>Rol Global</th>
                <th>Nivel</th>
                <th>Puntos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td data-label="Usuario"><div><strong>${e(u.name)}</strong><div class="small text-muted">${e(u.email)}</div></div></td>
                  <td data-label="Rol"><span class="badge ${u.role === 'ADMINISTRADOR' ? 'bg-primary' : 'bg-secondary'}">${e(ROLES[u.role] || cap(u.role))}</span></td>
                  <td data-label="Nivel"><span class="tag tag-approved">${e(LEVELS[u.level] || cap(u.level))}</span></td>
                  <td data-label="Puntos">${fmt(u.points)} pts</td>
                  <td data-label="Estado">${u.suspended ? '<span class="badge bg-danger">Suspendido</span>' : '<span class="badge bg-success">Activo</span>'}</td>
                  <td data-label="Acciones">
                    ${u.id !== state.user?.id ? `
                      <button type="button" class="btn btn-sm ${u.suspended ? 'btn-outline-success' : 'btn-outline-danger'}" data-action="toggle-suspend" data-id="${e(u.id)}" data-suspended="${u.suspended}">
                        ${u.suspended ? icon('unlock') + ' Reactivar' : icon('lock') + ' Suspender'}
                      </button>
                    ` : '<span class="text-muted small">Mi cuenta</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Auditoría -->
      <div class="panel">
        <div class="section-heading mt-0 mb-3">
          <div>
            <h2>${icon('shield-check')} Registro de auditoría</h2>
            <p>Historial cronológico de acciones administrativas y de seguridad.</p>
          </div>
          <span class="tag tag-neutral">${logs.length} eventos</span>
        </div>
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-sm table-striped align-middle mb-0 kp-responsive-table" style="font-size: 12px;">
            <thead><tr class="table-light"><th>Fecha</th><th>Evento</th><th>Usuario</th><th>Resumen</th></tr></thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td data-label="Fecha" class="text-nowrap">${shortDate(l.createdAt)}</td>
                  <td data-label="Evento"><strong>${e(humanizeAuditAction(l.action))}</strong></td>
                  <td data-label="Usuario">${e(l.user?.name || l.user?.email || 'Sistema')}</td>
                  <td data-label="Resumen"><small class="text-muted text-break">${e(humanizeAuditDetails(l.details))}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- MISIONES Y RETOS (V2) ---
  function challengesPage() {
    const challenges = state.challenges || [];
    const isAdmin = state.user?.role === 'ADMINISTRADOR';

    return `
      <section class="section-heading">
        <div>
          <p class="kicker">Misiones comunitarias</p>
          <h1>${icon('trophy')} Misiones y Retos Agroecológicos</h1>
          <p class="mb-0">Cumple objetivos de siembra, cuidado y cosecha oportuna para avanzar de Aprendiz a Oficial y Maestro.</p>
        </div>
        ${isAdmin ? `<button type="button" class="btn btn-forest btn-sm" data-action="new-challenge">${icon('plus-lg')} Crear nuevo reto</button>` : ''}
      </section>

      <div class="row g-3 mt-2">
        ${challenges.length ? challenges.map(c => {
          const pct = Math.min(100, Math.round((c.progress / c.targetCount) * 100));
          return `
            <div class="col-md-6 col-lg-4">
              <div class="card h-100 p-3 kp-challenge-card border rounded-3 shadow-sm d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-forest">${e(c.category)}</span>
                    <span class="badge bg-success-subtle text-success fw-bold">+${fmt(c.pointsReward)} pts</span>
                  </div>
                  <h3 class="card-title mb-1" style="font-size:16px">${e(c.title)}</h3>
                  <p class="small text-muted mb-3">${e(c.description)}</p>
                </div>
                <div>
                  <div class="d-flex justify-content-between align-items-center small mb-1">
                    <span>Progreso: <strong>${c.progress} / ${c.targetCount}</strong></span>
                    <span class="fw-bold">${pct}%</span>
                  </div>
                  <div class="progress mb-3" style="height:8px">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  ${c.rewardClaimed ? `
                    <div class="p-2 text-center rounded bg-success-subtle text-success small fw-medium">
                      ${icon('check-circle-fill')} Recompensa acreditada
                    </div>
                  ` : c.completed ? `
                    <button type="button" class="btn btn-success btn-sm w-100 fw-bold" data-action="claim-challenge" data-id="${e(c.id)}">
                      ${icon('gift')} Reclamar ${fmt(c.pointsReward)} puntos
                    </button>
                  ` : `
                    <div class="p-2 text-center rounded bg-light border text-muted small">
                      ${icon('hourglass-split')} En curso
                    </div>
                  `}
                </div>
              </div>
            </div>`;
        }).join('') : '<div class="col-12"><div class="p-5 text-center text-muted bg-paper border rounded-3">No hay retos activos en este momento.</div></div>'}
      </div>
    `;
  }

  // --- FORO COMUNITARIO / LA ASAMBLEA (V2) ---
  function forumPage() {
    const cats = state.forumCategories || [];
    const posts = state.forumPosts || [];
    const activeCat = state.forumCategoryFilter || 'TODAS';

    const filtered = activeCat === 'TODAS' ? posts : posts.filter(p => p.categoryId === activeCat || p.category?.slug === activeCat);

    return `
      <section class="section-heading">
        <div>
          <p class="kicker">Espacio comunitario de consulta</p>
          <h1>${icon('chat-dots')} La Asamblea Comunitaria</h1>
          <p class="mb-0">Comparte conocimientos, plantea dudas sobre cultivos andinos y dialoga con la comunidad.</p>
        </div>
        <button type="button" class="btn btn-forest btn-sm" data-action="new-forum-post">${icon('pencil-square')} Nueva publicación</button>
      </section>

      <!-- Barra de categorías -->
      <div class="d-flex gap-2 flex-wrap mt-3 mb-3 pb-2 border-bottom">
        <button type="button" class="btn btn-sm ${activeCat === 'TODAS' ? 'btn-forest' : 'btn-outline-forest'}" data-action="filter-forum-cat" data-cat="TODAS">Todas</button>
        ${cats.map(c => `
          <button type="button" class="btn btn-sm ${activeCat === c.id || activeCat === c.slug ? 'btn-forest' : 'btn-outline-forest'}" data-action="filter-forum-cat" data-cat="${e(c.id)}">
            ${c.icon ? icon(c.icon) + ' ' : ''}${e(c.name)} (${c._count?.posts || 0})
          </button>
        `).join('')}
      </div>

      <!-- Listado de publicaciones -->
      <div class="d-grid gap-3">
        ${filtered.length ? filtered.map(p => `
          <div class="card p-3 border rounded-3 kp-forum-card" style="cursor:pointer" data-action="view-forum-post" data-id="${e(p.id)}">
            <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
              <div class="d-flex align-items-center gap-2">
                <span class="avatar-circle" style="width:32px;height:32px;font-size:12px">${e(initial(p.author.name))}</span>
                <div>
                  <strong class="d-block" style="font-size:13.5px">${e(p.author.name)}</strong>
                  <span class="tiny-note text-muted">${e(LEVELS[p.author.level] || p.author.level)} · ${shortDate(p.createdAt)}</span>
                </div>
              </div>
              <span class="badge bg-forest">${e(p.category.name)}</span>
            </div>
            <h3 class="card-title mb-1" style="font-size:16px">${e(p.title)}</h3>
            <p class="small text-muted mb-2 text-break" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${e(p.content)}</p>
            <div class="d-flex justify-content-between align-items-center tiny-note text-muted pt-2 border-top">
              <span>${icon('chat-left-text')} ${p._count?.comments || 0} comentarios</span>
              <span>${icon('eye')} ${p.views || 0} vistas</span>
            </div>
          </div>
        `).join('') : '<div class="p-5 text-center text-muted bg-paper border rounded-3">No hay publicaciones en esta categoría aún. Sé el primero en iniciar la conversación.</div>'}
      </div>
    `;
  }

  // --- BODEGA COMUNITARIA / EL RESGUARDO (V2) ---
  function warehousePage() {
    const cid = state.warehouseCommunityId;
    const comm = (state.communities || []).find(c => c.id === cid) || (state.ownedCommunities || []).find(c => c.id === cid);
    const items = state.warehouseItems || [];
    const movements = state.warehouseMovements || [];
    const batches = state.warehouseBatches || [];
    const currentTab = state.warehouseTab || 'items';

    return `
      <section class="section-heading">
        <div>
          <p class="kicker">Gestión de insumos y postcosecha</p>
          <h1>${icon('box-seam')} El Resguardo — Bodega Comunitaria</h1>
          <p class="mb-0">${e(comm?.name || 'Comunidad')} · Trazabilidad de herramientas, semillas, abonos y secado postcosecha.</p>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-forest btn-sm" data-action="new-drying-batch" data-cid="${e(cid)}">${icon('sun')} Nuevo lote de secado</button>
          <button type="button" class="btn btn-forest btn-sm" data-action="new-warehouse-item" data-cid="${e(cid)}">${icon('plus-lg')} Nuevo insumo</button>
        </div>
      </section>

      <!-- Pestañas de Bodega -->
      <ul class="nav nav-pills mt-3 mb-3 gap-2">
        <li class="nav-item">
          <button type="button" class="btn btn-sm ${currentTab === 'items' ? 'btn-forest' : 'btn-outline-forest'}" data-action="switch-warehouse-tab" data-tab="items">${icon('boxes')} Insumos en stock (${items.length})</button>
        </li>
        <li class="nav-item">
          <button type="button" class="btn btn-sm ${currentTab === 'batches' ? 'btn-forest' : 'btn-outline-forest'}" data-action="switch-warehouse-tab" data-tab="batches">${icon('thermometer-sun')} Lotes de secado (${batches.length})</button>
        </li>
        <li class="nav-item">
          <button type="button" class="btn btn-sm ${currentTab === 'movements' ? 'btn-forest' : 'btn-outline-forest'}" data-action="switch-warehouse-tab" data-tab="movements">${icon('clock-history')} Movimientos auditados (${movements.length})</button>
        </li>
      </ul>

      ${currentTab === 'items' ? `
        <!-- Cuadrícula de Insumos -->
        <div class="row g-3">
          ${items.length ? items.map(it => {
            const isLow = it.quantity <= it.minQuantity;
            return `
              <div class="col-md-6 col-lg-4">
                <div class="card p-3 border rounded-3 h-100 d-flex flex-column justify-content-between kp-inventory-card">
                  <div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="badge bg-forest">${e(INVENTORY_CATEGORIES[it.category] || it.category)}</span>
                      ${isLow ? '<span class="badge bg-danger">Stock bajo</span>' : '<span class="badge bg-success">Abastecido</span>'}
                    </div>
                    <h3 class="card-title mb-1" style="font-size:16px">${e(it.name)}</h3>
                    <div class="display-6 fw-bold text-forest mb-2" style="font-size:24px">${fmt(it.quantity)} <small class="text-muted fs-6">${e(it.unit)}</small></div>
                    ${it.location ? `<div class="tiny-note text-muted mb-1">${icon('geo-alt')} Ubicación: ${e(it.location)}</div>` : ''}
                    <div class="tiny-note text-muted">Mínimo de alerta: ${fmt(it.minQuantity)} ${e(it.unit)}</div>
                    ${it.description ? `<p class="small text-muted mt-2 mb-0">${e(it.description)}</p>` : ''}
                  </div>
                  <div class="mt-3 pt-2 border-top text-end">
                    <button type="button" class="btn btn-sm btn-outline-forest" data-action="open-item-movement" data-id="${e(it.id)}" data-name="${e(it.name)}" data-unit="${e(it.unit)}" data-qty="${it.quantity}">
                      ${icon('arrow-left-right')} Registrar movimiento
                    </button>
                  </div>
                </div>
              </div>`;
          }).join('') : '<div class="col-12"><div class="p-5 text-center text-muted bg-paper border rounded-3">Aún no hay insumos registrados en esta comunidad.</div></div>'}
        </div>
      ` : currentTab === 'batches' ? `
        <!-- Lotes de Secado -->
        <div class="row g-3">
          ${batches.length ? batches.map(b => `
            <div class="col-md-6 col-lg-4">
              <div class="card p-3 border rounded-3 h-100 d-flex flex-column justify-content-between kp-drying-card">
                <div>
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge bg-secondary font-monospace">${e(b.lotNumber)}</span>
                    <span class="tag ${b.status === 'FINALIZADO' ? 'tag-approved' : b.status === 'DESCARTADO' ? 'tag-hot' : 'tag-neutral'}">${e(b.status)}</span>
                  </div>
                  <h3 class="card-title mb-1" style="font-size:16px">${e(b.plant.commonName)}</h3>
                  <p class="small fst-italic text-muted mb-2">${e(b.plant.scientific)}</p>
                  <div class="small mb-1">Cosecha: <strong>${shortDate(b.harvestDate)}</strong></div>
                  <div class="small mb-1">Peso fresco inicial: <strong>${fmt(b.initialWeightGrams)} g</strong></div>
                  ${b.dryWeightGrams ? `<div class="small mb-1 text-forest">Peso seco final: <strong>${fmt(b.dryWeightGrams)} g</strong></div>` : ''}
                  <div class="tiny-note text-muted mt-2">Condiciones: ${e(b.conditions || 'Sombra y ventilación')}</div>
                </div>
                <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center gap-2">
                  ${b.status === 'EN_SECADO' ? `
                    <button type="button" class="btn btn-sm btn-outline-success" data-action="finish-drying-batch" data-id="${e(b.id)}">
                      ${icon('check2-circle')} Finalizar secado
                    </button>
                  ` : '<span></span>'}
                  <button type="button" class="btn btn-sm btn-forest" data-action="view-trace-label" data-id="${e(b.id)}" data-cid="${e(cid)}">
                    ${icon('qr-code')} Etiqueta 100g
                  </button>
                </div>
              </div>
            </div>
          `).join('') : '<div class="col-12"><div class="p-5 text-center text-muted bg-paper border rounded-3">No hay lotes de secado postcosecha registrados.</div></div>'}
        </div>
      ` : `
        <!-- Tabla de Movimientos Auditados -->
        <div class="table-responsive bg-paper rounded-3 border">
          <table class="table table-sm table-striped align-middle mb-0 kp-responsive-table">
            <thead>
              <tr class="table-light">
                <th>Fecha</th>
                <th>Insumo</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Saldo final</th>
                <th>Motivo / Labor</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              ${movements.length ? movements.map(m => `
                <tr>
                  <td data-label="Fecha" class="text-nowrap">${shortDate(m.createdAt)}</td>
                  <td data-label="Insumo"><strong>${e(m.item.name)}</strong></td>
                  <td data-label="Tipo"><span class="badge ${m.type === 'ENTRADA' ? 'bg-success' : m.type === 'SALIDA' ? 'bg-warning text-dark' : 'bg-info text-dark'}">${e(m.type)}</span></td>
                  <td data-label="Cantidad">${m.type === 'SALIDA' ? '-' : '+'}${fmt(m.quantity)} ${e(m.item.unit)}</td>
                  <td data-label="Saldo final"><strong>${fmt(m.balanceAfter)} ${e(m.item.unit)}</strong></td>
                  <td data-label="Motivo"><small>${e(m.reason)}</small></td>
                  <td data-label="Responsable"><small>${e(m.responsibleUser.name)}</small></td>
                </tr>
              `).join('') : '<tr><td colspan="7" class="text-center p-4 text-muted">No se registran movimientos aún.</td></tr>'}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  async function render() {
    const [fromHash, id] = (location.hash.replace(/^#/, '') || (state.user ? 'resumen' : 'inicio')).split('/');
    const valid = navItems().map(x => x[0]);
    const screen = (['huerto', 'bodega'].includes(fromHash) || valid.includes(fromHash)) ? fromHash : (state.user ? 'resumen' : 'inicio');

    state.screen = screen;
    state.gardenId = screen === 'huerto' ? id : null;
    state.warehouseCommunityId = screen === 'bodega' ? (id || state.warehouseCommunityId) : null;

    if (!state.user && ['comunidades', 'huertos', 'actividades', 'resumen', 'administracion', 'retos', 'bodega'].includes(screen)) {
      location.hash = '#inicio';
      return;
    }

    if (!state.moon) {
      const mData = await request('/api/reloj-lunar/actual');
      state.moon = mData.moon;
      state.moonPhases = mData.phases || [];
      state.moonUpcoming = mData.upcoming || [];
    }

    if (state.user) {
      const invData = await request('/api/invitaciones/pendientes');
      state.pendingInvitations = invData.invitations || [];
    }

    if (['inicio', 'plantas', 'huerto', 'huertos'].includes(screen)) {
      state.plants = (await request('/api/plantas?limit=200')).plants;
    }
    if (screen === 'inicio') {
      state.rank = (await request('/api/ranking')).ranking;
    }
    if (screen === 'resumen') {
      const [d, g, a] = await Promise.all([
        request('/api/dashboard'),
        request('/api/huertos'),
        request('/api/actividades').catch(() => ({ activities: [] }))
      ]);
      state.dashboard = d;
      state.gardens = g.gardens || [];
      state.activities = a.activities || [];
    }
    if (screen === 'comunidades' || screen === 'huertos') {
      const [c, g] = await Promise.all([request('/api/comunidades'), request('/api/huertos')]);
      state.communities = c.communities || [];
      state.ownedCommunities = c.owned || [];
      state.sharedCommunities = c.shared || [];
      state.gardens = g.gardens || [];
    }
    if (screen === 'huerto') {
      const [detail, activities] = await Promise.all([
        request(`/api/huertos/${encodeURIComponent(id)}/virtual-grid`),
        request(`/api/actividades?gardenId=${encodeURIComponent(id)}`).catch(() => ({ activities: [] }))
      ]);
      state.gardenDetail = detail;
      state.gardenActivities = activities.activities || [];
      if (detail.canViewStats) {
        state.gardenStats = (await request(`/api/huertos/${encodeURIComponent(id)}/estadisticas`).catch(() => ({ stats: null }))).stats;
      } else {
        state.gardenStats = null;
      }
    }
    if (screen === 'actividades') {
      const [a, g] = await Promise.all([request('/api/actividades'), request('/api/huertos')]);
      state.activities = a.activities;
      state.gardens = g.gardens;
    }
    if (screen === 'ranking') {
      state.rank = (await request('/api/ranking')).ranking;
    }
    if (screen === 'administracion') {
      const [u, l, g, a] = await Promise.all([
        request('/api/admin/usuarios'),
        request('/api/admin/auditoria'),
        request('/api/huertos'),
        request('/api/actividades?status=PENDIENTE')
      ]);
      state.adminUsers = u.users;
      state.auditLogs = l.logs;
      state.gardens = g.gardens;
      state.activities = a.activities;
    }
    if (screen === 'retos') {
      const r = await request('/api/retos');
      state.challenges = r.challenges || [];
    }
    if (screen === 'asamblea') {
      const [cats, p] = await Promise.all([
        request('/api/foro/categorias'),
        request('/api/foro/publicaciones')
      ]);
      state.forumCategories = cats.categories || [];
      state.forumPosts = p.posts || [];
    }
    if (screen === 'bodega') {
      const commRes = await request('/api/comunidades');
      state.communities = commRes.communities || [];
      state.ownedCommunities = commRes.owned || [];
      state.sharedCommunities = commRes.shared || [];
      const allComms = [...state.ownedCommunities, ...state.sharedCommunities, ...state.communities];
      const targetCid = id || allComms[0]?.id;
      state.warehouseCommunityId = targetCid;
      if (targetCid) {
        const [itemsRes, movsRes, secadosRes] = await Promise.all([
          request(`/api/comunidades/${encodeURIComponent(targetCid)}/bodega/items`),
          request(`/api/comunidades/${encodeURIComponent(targetCid)}/bodega/movimientos`),
          request(`/api/comunidades/${encodeURIComponent(targetCid)}/bodega/secados`)
        ]);
        state.warehouseItems = itemsRes.items || [];
        state.warehouseMovements = movsRes.movements || [];
        state.warehouseBatches = secadosRes.batches || [];
      } else {
        state.warehouseItems = [];
        state.warehouseMovements = [];
        state.warehouseBatches = [];
      }
    }

    const content = {
      inicio: landing,
      resumen: dashboard,
      comunidades: communitiesPage,
      plantas: catalogPage,
      huertos: gardensPage,
      huerto: gardenPage,
      actividades: activitiesPage,
      ranking: rankingPage,
      administracion: adminPage,
      retos: challengesPage,
      asamblea: forumPage,
      bodega: warehousePage
    }[screen]();

    const prevScreen = state.activeRenderedScreen;
    state.activeRenderedScreen = screen;

    const doSwap = () => {
      resetScrollLocks();
      if (window.KawsapachaMotion) window.KawsapachaMotion.killTriggers();
      app.innerHTML = frame(content);
      const titleMap = {
        resumen: 'Resumen',
        comunidades: 'Comunidades',
        plantas: 'Catálogo botánico',
        huertos: 'Huertos',
        huerto: 'Huerto virtual',
        actividades: 'Bitácora',
        ranking: 'Ranking',
        inicio: 'Tierra & Comunidad',
        administracion: 'Administración',
        retos: 'Misiones y retos',
        asamblea: 'La Asamblea',
        bodega: 'El Resguardo'
      };
      document.title = `${titleMap[screen] || 'Kawsapacha'} · Kawsapacha`;
      if (prevScreen && prevScreen !== screen) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    if (window.KawsapachaMotion) {
      await window.KawsapachaMotion.transition(doSwap);
      window.KawsapachaMotion.initPage(screen);
    } else {
      doSwap();
    }
  }

  function resetScrollLocks() {
    const appModal = $('#appModal');
    if (appModal) {
      const dialog = appModal.querySelector('.modal-dialog');
      if (dialog) dialog.classList.remove('modal-wizard');
    }
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.documentElement.style.removeProperty('overflow');
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  }

  const appModalEl = $('#appModal');
  if (appModalEl) {
    appModalEl.addEventListener('hidden.bs.modal', resetScrollLocks);
  }

  function mostrarModal(title, html, opts = false) {
    const cfg = typeof opts === 'boolean' ? { wide: opts } : (opts || {});
    const dialog = $('#appModal .modal-dialog');
    dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl', 'modal-wizard');
    if (cfg.size === 'sm') dialog.classList.add('modal-sm');
    else if (cfg.size === 'lg' || cfg.wide) dialog.classList.add('modal-lg');
    else if (cfg.size === 'wizard' || cfg.wizard) dialog.classList.add('modal-wizard');

    $('#modalInner').innerHTML = `
      <div class="modal-header">
        <div class="modal-title-group">
          <h2 class="modal-title">${e(title)}</h2>
          ${cfg.subtitle ? `<span class="modal-subtitle-pill">${e(cfg.subtitle)}</span>` : ''}
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">${html}</div>
      ${cfg.footerHtml ? `<div class="modal-footer">${cfg.footerHtml}</div>` : ''}`;
    bootstrap.Modal.getOrCreateInstance($('#appModal')).show();
  }
  const showModal = mostrarModal;

  function cerrarModal() {
    const el = $('#appModal');
    const inst = el ? bootstrap.Modal.getInstance(el) : null;
    if (inst) inst.hide();
    resetScrollLocks();
  }
  const closeModal = cerrarModal;

  const waveLabel = (label, required = false) => `<label class="wave-label">${[...String(label)].map((char, index) => `<span style="--index:${index}">${char === ' ' ? '&nbsp;' : e(char)}</span>`).join('')}${required ? '<b aria-hidden="true"> *</b>' : ''}</label>`;
  const field = (label, name, type = 'text', extra = '') => {
    const required = /\brequired\b/.test(extra);
    const cleanExtra = extra.replace(/\splaceholder=(?:"[^"]*"|'[^']*')/g, '');
    return `<div class="wave-field"><input class="form-control wave-input" id="f_${e(name)}" name="${e(name)}" type="${e(type)}" placeholder=" " ${cleanExtra}><span class="wave-bar" aria-hidden="true"></span>${waveLabel(label, required)}<span class="field-message" aria-live="polite"></span></div>`;
  };
  const select = (label, name, values, selected = '', idAttr = '') => `
    <div class="select-field">
      <label class="field-label" for="${e(idAttr || 'f_' + name)}">${e(label)}</label>
      <select class="form-select" id="${e(idAttr || 'f_' + name)}" name="${e(name)}">
        ${values.map(x => {
          const [v, t] = Array.isArray(x) ? x : [x, cap(x)];
          return `<option value="${e(v)}" ${v === selected ? 'selected' : ''}>${e(t)}</option>`;
        }).join('')}
      </select>
    </div>`;

  const modalFooterBtns = (formId, text = 'Guardar cambios', btnClass = 'btn-success') => `
    <button class="btn btn-outline-secondary btn-sm px-3" type="button" data-bs-dismiss="modal">Cancelar</button>
    <button class="btn ${btnClass} btn-sm px-3" type="submit" form="${e(formId)}">${e(text)} ${icon('arrow-right')}</button>`;

  const form = (key, fields, button = 'Guardar cambios', sizeOrWide = false, title = '', subtitle = '') => {
    const formId = `modalForm_${key.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const size = typeof sizeOrWide === 'string' ? sizeOrWide : (sizeOrWide ? 'lg' : 'md');
    showModal(
      title || 'Completar datos',
      `<form id="${e(formId)}" data-form="${e(key)}">${fields}</form>`,
      { size, subtitle, footerHtml: modalFooterBtns(formId, button) }
    );
  };

  function showSuccessCheck(message, callback) {
    closeModal();
    if (message) toast(message);
    if (callback) callback();
  }

  function abrirAsistentePorPasos(cfg) {
    const dialog = $('#appModal .modal-dialog');
    dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
    dialog.classList.add('modal-wizard');

    const formId = `modalForm_${cfg.key.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const totalPasos = cfg.steps.length;
    let pasoActual = 1;
    const modalIcon = cfg.icon || 'flower2';

    const modalInner = $('#modalInner');
    modalInner.innerHTML = `
      <div class="kp-modal-card kp-wizard-shell">
        <header class="kp-modal-header kp-wizard-header">
          <div class="d-flex align-items-center gap-3">
            <span class="kp-modal-icon-badge">${icon(modalIcon)}</span>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h3 class="kp-modal-title modal-title mb-0" id="wizardStepTitle">${e(cfg.title)}</h3>
                <span class="kp-wizard-step-tag" id="wizardStepTag">Paso 1 de ${totalPasos}</span>
              </div>
              <small class="kp-modal-subtitle text-muted d-block" id="wizardStepSubtitle">${e(cfg.steps[0].subtitle || cfg.subtitle || '')}</small>
            </div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </header>

        <nav class="kp-horizontal-stepper" aria-label="Progreso del asistente">
          ${cfg.steps.map((s, idx) => `
            <div class="kp-hstep-item kp-wizard-step-node ${idx === 0 ? 'active' : ''}" data-wizard-node="${idx + 1}" role="tab" aria-selected="${idx === 0 ? 'true' : 'false'}" aria-current="${idx === 0 ? 'step' : 'false'}">
              <span class="kp-hstep-badge kp-wizard-step-badge">${idx + 1}</span>
              <div class="kp-hstep-info">
                <span class="kp-hstep-num">Paso ${idx + 1}</span>
                <span class="kp-hstep-label kp-step-label">${e(s.title)}</span>
              </div>
              ${idx < totalPasos - 1 ? '<div class="kp-hstep-line" aria-hidden="true"></div>' : ''}
            </div>
          `).join('')}
        </nav>

        <form id="${formId}" data-form="${e(cfg.key)}" class="kp-modal-form d-flex flex-column flex-grow-1 overflow-hidden m-0" novalidate>
          ${cfg.extraHiddenHtml || ''}
          <div class="kp-modal-body kp-wizard-body" id="wizardBodyScroll">
            ${cfg.steps.map((s, idx) => `
              <div class="kp-wizard-step ${idx === 0 ? 'active' : ''}" data-wizard-step="${idx + 1}" style="${idx === 0 ? '' : 'display:none'}">
                ${s.html}
              </div>
            `).join('')}
          </div>

          <footer class="kp-modal-footer kp-wizard-footer">
            <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cancelar</button>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline-forest btn-sm px-3" id="wizardPrevBtn" style="display:none">
                ${icon('arrow-left')} Atrás
              </button>
              <button type="button" class="btn btn-forest btn-sm px-4" id="wizardNextBtn">
                Continuar ${icon('arrow-right')}
              </button>
              <button type="submit" class="btn btn-success btn-sm px-4" id="wizardSubmitBtn" style="display:none">
                ${e(cfg.submitLabel || 'Guardar cambios')} ${icon('check-circle')}
              </button>
            </div>
          </footer>
        </form>
      </div>`;

    bootstrap.Modal.getOrCreateInstance($('#appModal')).show();

    const formEl = $(`#${formId}`);
    const botonSiguiente = $('#wizardNextBtn');
    const botonAnterior = $('#wizardPrevBtn');
    const botonEnviar = $('#wizardSubmitBtn');
    const stepTag = $('#wizardStepTag');
    const stepTitle = $('#wizardStepTitle');
    const stepSubtitle = $('#wizardStepSubtitle');
    const scrollBody = $('#wizardBodyScroll');

    function actualizarPasoUI(nuevoPaso) {
      const pasoSiguienteObj = cfg.steps[nuevoPaso - 1];

      const elementoActual = formEl.querySelector(`.kp-wizard-step[data-wizard-step="${pasoActual}"]`);
      const elementoSiguiente = formEl.querySelector(`.kp-wizard-step[data-wizard-step="${nuevoPaso}"]`);
      if (elementoActual) {
        elementoActual.classList.remove('active');
        elementoActual.style.display = 'none';
      }
      if (elementoSiguiente) {
        elementoSiguiente.style.display = 'block';
        setTimeout(() => elementoSiguiente.classList.add('active'), 10);
      }

      pasoActual = nuevoPaso;

      $$('.kp-wizard-step-node').forEach(node => {
        const stepNum = parseInt(node.dataset.wizardNode, 10);
        node.classList.remove('active', 'completed');
        const badge = node.querySelector('.kp-wizard-step-badge');
        if (stepNum < pasoActual) {
          node.classList.add('completed');
          node.setAttribute('aria-current', 'false');
          if (badge) badge.innerHTML = icon('check');
        } else if (stepNum === pasoActual) {
          node.classList.add('active');
          node.setAttribute('aria-current', 'step');
          if (badge) badge.textContent = stepNum;
        } else {
          node.setAttribute('aria-current', 'false');
          if (badge) badge.textContent = stepNum;
        }
      });

      if (stepTag) stepTag.textContent = `Paso ${pasoActual} de ${totalPasos}`;
      if (stepTitle) stepTitle.textContent = pasoSiguienteObj.title;
      if (stepSubtitle) stepSubtitle.textContent = pasoSiguienteObj.subtitle || '';

      if (botonAnterior) botonAnterior.style.display = pasoActual > 1 ? 'inline-flex' : 'none';
      if (pasoActual === totalPasos) {
        if (botonSiguiente) botonSiguiente.style.display = 'none';
        if (botonEnviar) botonEnviar.style.display = 'inline-flex';
      } else {
        if (botonSiguiente) botonSiguiente.style.display = 'inline-flex';
        if (botonEnviar) botonEnviar.style.display = 'none';
      }

      if (scrollBody) scrollBody.scrollTop = 0;

      if (pasoSiguienteObj.onEnter) {
        pasoSiguienteObj.onEnter(elementoSiguiente, formEl);
      }
    }

    if (botonSiguiente) {
      botonSiguiente.addEventListener('click', () => {
        const elementoActual = formEl.querySelector(`.kp-wizard-step[data-wizard-step="${pasoActual}"]`);
        if (elementoActual) {
          const inputs = elementoActual.querySelectorAll('input, select, textarea');
          for (const inp of inputs) {
            if (!inp.checkValidity()) {
              inp.reportValidity();
              inp.focus();
              return;
            }
          }
        }
        const pasoActualObj = cfg.steps[pasoActual - 1];
        if (pasoActualObj.validate && !pasoActualObj.validate(elementoActual, formEl)) {
          return;
        }
        if (pasoActual < totalPasos) {
          actualizarPasoUI(pasoActual + 1);
        }
      });
    }

    if (botonAnterior) {
      botonAnterior.addEventListener('click', () => {
        if (pasoActual > 1) {
          actualizarPasoUI(pasoActual - 1);
        }
      });
    }

    formEl.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && ev.target.tagName !== 'TEXTAREA') {
        if (pasoActual < totalPasos) {
          ev.preventDefault();
          if (botonSiguiente) botonSiguiente.click();
        }
      }
    });

    if (cfg.onInit) {
      cfg.onInit($('#appModal'), formEl);
    }

    if (cfg.steps[0].onEnter) {
      const firstEl = formEl.querySelector('.kp-wizard-step[data-wizard-step="1"]');
      cfg.steps[0].onEnter(firstEl, formEl);
    }
  }
  const openWizardModal = abrirAsistentePorPasos;

  function confirmActionModal({ title, message, confirmLabel = 'Confirmar', onConfirm }) {
    showModal(
      title,
      `<div class="confirm-modal-body">
         <div class="confirm-icon-wrap">${icon('exclamation-triangle')}</div>
         <p class="mb-0 small">${e(message)}</p>
       </div>`,
      {
        size: 'sm',
        footerHtml: `
          <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-danger btn-sm px-3" id="confirmModalActionBtn">${e(confirmLabel)}</button>`
      }
    );
    setTimeout(() => {
      const btn = $('#confirmModalActionBtn');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerHTML = `${icon('hourglass-split')} Procesando...`;
        try {
          await onConfirm();
        } catch (err) {
          toast(err.message, false);
          btn.disabled = false;
          btn.textContent = confirmLabel;
        }
      });
    }, 20);
  }

  function authModal(mode) {
    const reg = mode === 'register';
    const formId = reg ? 'modalForm_register' : 'modalForm_login';
    const content = `
      <div class="d-flex gap-2 mb-3">
        <button type="button" class="btn-auth-toggle ${reg ? '' : 'active'}" data-action="auth-login">Iniciar sesión</button>
        <button type="button" class="btn-auth-toggle ${reg ? 'active' : ''}" data-action="auth-register">Crear cuenta</button>
      </div>
      <p class="modal-intro mb-3">${reg ? 'Toda cuenta inicia con rol Usuario y nivel Aprendiz.' : 'Accede al espacio de tu comunidad.'}</p>
      <form id="${formId}" data-form="${reg ? 'register' : 'login'}">
        <div class="d-grid gap-2">
          ${reg ? `${field('Nombre completo', 'name', 'text', 'required autocomplete="name"')}` : ''}
          ${field('Correo electrónico', 'email', 'email', 'required autocomplete="email"')}
          ${field('Contraseña', 'password', 'password', `required minlength="${reg ? 8 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"`)}
          ${reg ? `
            <div class="form-grid">
              ${field('Fecha de nacimiento', 'birthDate', 'date', 'required')}
              ${select('Género', 'gender', [['', 'Seleccionar'], ['FEMENINO', 'Femenino'], ['MASCULINO', 'Masculino'], ['OTRO', 'Otro'], ['PREFIERO_NO_DECIR', 'Prefiero no indicar']])}
            </div>
            ${field('Talentos o conocimientos ancestrales', 'talents', 'text', '')}
          ` : ''}
        </div>
      </form>`;
    showModal(
      reg ? 'Crear una cuenta' : 'Bienvenido de nuevo',
      content,
      { size: reg ? 'md' : 'sm', footerHtml: modalFooterBtns(formId, reg ? 'Crear cuenta' : 'Ingresar') }
    );
  }

  function profileModal() {
    const u = state.user;
    if (!u) return;
    const birthStr = u.birthDate ? String(u.birthDate).slice(0, 10) : '';
    form(
      'profile',
      `<div class="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 bg-light">
         <span class="avatar-circle" style="width:48px;height:48px;font-size:16px">${e(initial(u.name))}</span>
         <div>
           <strong>${e(u.name)}</strong>
           <div class="small text-muted">${e(u.email)} · ${e(ROLES[u.role] || u.role)} · ${e(LEVELS[u.level] || u.level)} (${fmt(u.points)} pts)</div>
         </div>
       </div>
       <div class="form-grid">
         ${field('Nombre completo', 'name', 'text', `required value="${e(u.name)}"`)}
         ${field('Fecha de nacimiento', 'birthDate', 'date', `value="${e(birthStr)}"`)}
         ${select('Género', 'gender', [['', 'Seleccionar'], ['FEMENINO', 'Femenino'], ['MASCULINO', 'Masculino'], ['OTRO', 'Otro'], ['PREFIERO_NO_DECIR', 'Prefiero no indicar']], u.gender || '')}
         ${field('Talentos o conocimientos', 'talents', 'text', `value="${e(u.talents || '')}"`)}
       </div>
       <div class="mt-3 p-3 rounded-3 bg-light border">
         <h4 class="mb-1" style="font-size:14px">${icon('award')} Saberes tradicionales y certificación</h4>
         <p class="tiny-note text-muted mb-2">Declara tus habilidades en cultivo, suelo y plantas medicinales para obtener acreditación comunitaria (+25 pts).</p>
         <div class="d-flex gap-2 flex-wrap">
           <button type="button" class="btn btn-outline-forest btn-sm" data-action="open-talents">${icon('award')} Mis saberes ancestrales</button>
           ${(u.role === 'ADMINISTRADOR' || u.level === 'MAESTRO') ? `<button type="button" class="btn btn-outline-primary btn-sm" data-action="open-talents-review">${icon('check-circle')} Certificar talentos pendientes</button>` : ''}
         </div>
       </div>
       <section class="form-section">
         <h3>Cambiar contraseña (opcional)</h3>
         <div class="form-grid">
           ${field('Contraseña actual', 'currentPassword', 'password', 'autocomplete="current-password"')}
           ${field('Nueva contraseña (mín. 8)', 'newPassword', 'password', 'minlength="8" autocomplete="new-password"')}
         </div>
       </section>`,
      'Actualizar perfil',
      true,
      'Mi perfil'
    );
  }

  function communityModal(id = null) {
    const existing = id ? (state.communities.find(x => x.id === id) || state.ownedCommunities.find(x => x.id === id)) : null;

    openWizardModal({
      key: 'community',
      icon: 'people',
      title: existing ? 'Editar comunidad' : 'Nueva comunidad',
      subtitle: existing ? existing.name : 'Propiedad y custodia comunitaria',
      submitLabel: existing ? 'Guardar cambios' : 'Crear comunidad',
      extraHiddenHtml: `<input type="hidden" name="id" value="${e(existing?.id || '')}">`,
      steps: [
        {
          stepId: 'identity',
          title: 'Identidad comunitaria',
          subtitle: 'Nombre y tipo de organización',
          html: `
            <p class="modal-intro mb-3">${existing ? 'Actualiza los datos de tu comunidad.' : 'Quien crea la comunidad mantiene la propiedad exclusiva y control total de permisos.'}</p>
            <div class="form-grid">
              ${field('Nombre de la comunidad', 'name', 'text', `required maxlength="100" value="${e(existing?.name || '')}"`)}
              ${select('Tipo de comunidad', 'type', ['INDIVIDUAL', 'FAMILIAR', 'CONDOMINIO', 'BARRIAL'], existing?.type || 'FAMILIAR')}
            </div>
            <div class="p-2 bg-paper border rounded-3 small text-muted mt-3">
              ${icon('shield-check')} <strong>Modelo de custodia:</strong> Las comunidades agrupan huertos y cultivos bajo un único custodio legal.
            </div>`
        },
        {
          stepId: 'contact',
          title: 'Contacto y territorio',
          subtitle: 'Teléfono y descripción referencial',
          html: `
            <div class="mb-3">
              ${field('Teléfono de contacto', 'phone', 'tel', `value="${e(existing?.phone || '')}"`)}
            </div>
            <div class="mb-2">
              <label class="field-label" for="f_comm_desc">Descripción o territorio referencial (opcional)</label>
              <textarea id="f_comm_desc" name="description" class="form-control" rows="3" maxlength="400" placeholder="Propósito, territorio o ubicación referencial...">${e(existing?.description || '')}</textarea>
            </div>`
        },
        {
          stepId: 'review',
          title: 'Revisión y confirmación',
          subtitle: 'Verifica los datos antes de registrar',
          html: `
            <div class="p-3 bg-light border rounded-3 mb-3">
              <h6 class="fw-bold mb-2 text-forest">${icon('building')} Resumen de la comunidad</h6>
              <div class="d-grid gap-2 small">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Nombre:</span>
                  <strong id="w_comm_rev_name">—</strong>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Tipo:</span>
                  <strong id="w_comm_rev_type">—</strong>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Teléfono:</span>
                  <span id="w_comm_rev_phone">—</span>
                </div>
                <div>
                  <span class="text-muted d-block mb-1">Descripción:</span>
                  <p class="mb-0 text-muted fst-italic" id="w_comm_rev_desc" style="font-size:12px;">—</p>
                </div>
              </div>
            </div>
            <div class="p-2 bg-paper border rounded-3 small text-muted">
              ${icon('shield-check')} <strong>Custodia garantizada:</strong> Como propietario, podrás registrar huertos, invitar colaboradores y administrar cosechas.
            </div>`,
          onEnter: (stepEl, formEl) => {
            const name = formEl.querySelector('input[name="name"]')?.value || '—';
            const type = formEl.querySelector('select[name="type"]')?.value || '—';
            const phone = formEl.querySelector('input[name="phone"]')?.value || 'No especificado';
            const desc = formEl.querySelector('textarea[name="description"]')?.value || 'Sin descripción adicional';
            const nEl = $('#w_comm_rev_name');
            const tEl = $('#w_comm_rev_type');
            const pEl = $('#w_comm_rev_phone');
            const dEl = $('#w_comm_rev_desc');
            if (nEl) nEl.textContent = name;
            if (tEl) tEl.textContent = cap(type);
            if (pEl) pEl.textContent = phone;
            if (dEl) dEl.textContent = desc;
          }
        }
      ]
    });
  }

  function inviteModal(communityId) {
    const c = state.communities.find(x => x.id === communityId) || state.ownedCommunities.find(x => x.id === communityId);
    const categories = {};
    for (const p of Object.values(PERM_METADATA)) {
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    }

    openWizardModal({
      key: 'invite-member',
      icon: 'person-plus',
      title: 'Invitar integrante',
      subtitle: c?.name || 'Comunidad',
      submitLabel: 'Enviar invitación',
      extraHiddenHtml: `
        <input type="hidden" name="communityId" value="${e(communityId)}">
        <input type="hidden" name="preset" id="selectedPreset" value="AGRICULTURAL_COLLABORATOR">`,
      steps: [
        {
          stepId: 'email',
          title: 'Identificación del colaborador',
          subtitle: 'Ingresa el correo electrónico del invitado',
          html: `
            <p class="modal-intro mb-3">Invita a un colaborador a <strong>${e(c?.name || 'la comunidad')}</strong>. Conservará su rol Usuario.</p>
            <div class="mb-3">
              ${field('Correo electrónico del invitado', 'email', 'email', 'required placeholder="colaborador@ejemplo.com"')}
            </div>
            <div class="p-2 bg-paper border rounded-3 small text-muted">
              ${icon('shield-lock')} <strong>Control de seguridad:</strong> Ningún invitado podrá editar permisos ni transferir la propiedad comunitaria.
            </div>`
        },
        {
          stepId: 'permissions',
          title: 'Perfil y matriz de permisos',
          subtitle: 'Elige un perfil predefinido o personaliza',
          html: `
            <div class="mb-3">
              <label class="form-label fw-bold small text-uppercase text-muted">Perfil predefinido</label>
              <div class="d-flex flex-wrap gap-2 mb-2" id="presetButtons">
                <button type="button" class="btn btn-sm btn-outline-success active" data-preset="AGRICULTURAL_COLLABORATOR">${icon('flower1')} Colaborador agrícola</button>
                <button type="button" class="btn btn-sm btn-outline-success" data-preset="READ_ONLY">${icon('eye')} Solo lectura</button>
                <button type="button" class="btn btn-sm btn-outline-success" data-preset="ADVANCED_COLLABORATOR">${icon('gear')} Colaborador avanzado</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-preset="CUSTOM">${icon('sliders')} Personalizado</button>
              </div>
              <p class="small text-muted mb-0" id="presetDesc">Permite registrar labores agrícolas diarias, subir fotos y editar actividades propias pendientes.</p>
            </div>
            <div class="card bg-light border-0 p-3" style="max-height: 240px; overflow-y: auto;">
              <h6 class="fw-bold mb-2">${icon('shield-check')} Matriz de 11 Permisos Granulares</h6>
              <div class="row g-2" id="permissionsChecklist">
                ${Object.entries(categories).map(([catName, perms]) => `
                  <div class="col-md-6">
                    <span class="badge bg-secondary-subtle text-secondary mb-1">${e(catName)}</span>
                    <div class="d-grid gap-2">
                      ${perms.map(p => `
                        <div class="form-check">
                          <input class="form-check-input perm-checkbox" type="checkbox" name="permissions" value="${e(p.id)}" id="perm_${e(p.id)}"
                            ${PRESET_PROFILES.AGRICULTURAL_COLLABORATOR.permissions.includes(p.id) ? 'checked' : ''}>
                          <label class="form-check-label" for="perm_${e(p.id)}">
                            <strong>${e(p.name)}</strong>
                            <div class="tiny-note text-muted" style="font-size:11px; line-height:1.2;">${e(p.desc)}</div>
                          </label>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>`
        },
        {
          stepId: 'review',
          title: 'Revisión y envío',
          subtitle: 'Confirma el despacho de la invitación',
          html: `
            <div class="p-3 bg-light border rounded-3 mb-3">
              <h6 class="fw-bold mb-2 text-forest">${icon('send')} Datos del despacho</h6>
              <div class="d-grid gap-2 small">
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Destinatario:</span>
                  <strong id="w_inv_email">—</strong>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Perfil asignado:</span>
                  <strong id="w_inv_preset">—</strong>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Permisos concedidos:</span>
                  <span class="badge bg-forest" id="w_inv_perm_count">0 permisos</span>
                </div>
              </div>
            </div>
            <p class="small text-muted mb-0">Al confirmar, el sistema emitirá la invitación y registrará la acción en la bitácora de auditoría.</p>`,
          onEnter: (stepEl, formEl) => {
            const email = formEl.querySelector('input[name="email"]')?.value || '—';
            const preset = formEl.querySelector('#selectedPreset')?.value || 'AGRICULTURAL_COLLABORATOR';
            const checkedPerms = formEl.querySelectorAll('input.perm-checkbox:checked').length;
            const emEl = $('#w_inv_email');
            const prEl = $('#w_inv_preset');
            const cntEl = $('#w_inv_perm_count');
            if (emEl) emEl.textContent = email;
            if (prEl) prEl.textContent = PRESET_PROFILES[preset]?.name || cap(preset);
            if (cntEl) cntEl.textContent = `${checkedPerms} de 11 permisos`;
          }
        }
      ],
      onInit: (modalEl, formEl) => {
        const presetBtns = formEl.querySelectorAll('#presetButtons button');
        const checkboxes = formEl.querySelectorAll('.perm-checkbox');
        const descEl = formEl.querySelector('#presetDesc');
        const inputPreset = formEl.querySelector('#selectedPreset');

        presetBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const pKey = btn.dataset.preset;
            if (inputPreset) inputPreset.value = pKey;
            if (descEl) descEl.textContent = PRESET_PROFILES[pKey]?.desc || '';
            if (pKey !== 'CUSTOM') {
              const allowed = PRESET_PROFILES[pKey]?.permissions || [];
              checkboxes.forEach(cb => { cb.checked = allowed.includes(cb.value); });
            }
          });
        });

        checkboxes.forEach(cb => {
          cb.addEventListener('change', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            const customBtn = formEl.querySelector('#presetButtons button[data-preset="CUSTOM"]');
            if (customBtn) customBtn.classList.add('active');
            if (inputPreset) inputPreset.value = 'CUSTOM';
            if (descEl) descEl.textContent = 'Selección manual de permisos.';
          });
        });
      }
    });
  }

  async function membersModal(communityId) {
    const c = state.communities.find(x => x.id === communityId) || state.ownedCommunities.find(x => x.id === communityId);
    showModal('Integrantes de ' + (c?.name || 'la comunidad'), '<div class="text-center p-4"><div class="spinner-border text-success" role="status"></div><p class="mt-2 text-muted">Cargando integrantes...</p></div>', true);

    try {
      const membersData = await request(`/api/comunidades/${encodeURIComponent(communityId)}/miembros`);
      const canManage = membersData.canManage;
      let invitations = [];
      if (canManage) {
        const invData = await request(`/api/comunidades/${encodeURIComponent(communityId)}/invitaciones`);
        invitations = invData.invitations || [];
      }
      const members = membersData.members || [];

      const html = `
        <div class="mb-3">
          <ul class="nav nav-tabs" id="membersTab" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="active-members-tab" data-bs-toggle="tab" data-bs-target="#active-members" type="button">
                ${icon('people-fill')} Integrantes Activos (${members.length})
              </button>
            </li>
            ${canManage ? `
              <li class="nav-item">
                <button class="nav-link" id="pending-invites-tab" data-bs-toggle="tab" data-bs-target="#pending-invites" type="button">
                  ${icon('envelope-open')} Invitaciones Pendientes (${invitations.filter(i => i.status === 'PENDIENTE').length})
                </button>
              </li>
            ` : ''}
          </ul>
          <div class="tab-content pt-3">
            <div class="tab-pane fade show active" id="active-members">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <p class="text-muted small mb-0">Integrantes y permisos asignados en esta comunidad.</p>
                ${canManage ? `<button type="button" class="btn btn-sm btn-success" data-action="invite-member" data-id="${e(communityId)}">${icon('person-plus')} Nueva invitación</button>` : ''}
              </div>
              <div class="list-group">
                ${members.map(m => `
                  <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-3 py-3">
                    <div>
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <strong>${e(m.name)}</strong>
                        ${m.isOwner ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Propietario</span>' : '<span class="badge bg-light text-dark border">Colaborador</span>'}
                        <span class="badge bg-info-subtle text-info border border-info-subtle">${e(LEVELS[m.level] || m.level)}</span>
                      </div>
                      <div class="text-muted small">${e(m.email)} · Unido el ${shortDate(m.joinedAt)}</div>
                      <div class="d-flex flex-wrap gap-1 mt-2">
                        ${m.isOwner ? '<span class="badge bg-success text-white" style="font-size: 11px;">Control Total (Propietario)</span>' : (m.permissions?.length ? m.permissions.map(p => `<span class="badge bg-light text-dark border" style="font-size: 10px;">${e(PERM_METADATA[p]?.name || p)}</span>`).join('') : '<span class="badge bg-danger-subtle text-danger" style="font-size: 10px;">Sin permisos</span>')}
                      </div>
                    </div>
                    ${canManage && !m.isOwner ? `
                      <div class="d-flex gap-2">
                        <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit-member-permissions" data-cid="${e(communityId)}" data-mid="${e(m.id)}" data-name="${e(m.name)}" data-perms="${e(JSON.stringify(m.permissions || []))}">${icon('pencil')} Permisos</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-member" data-cid="${e(communityId)}" data-mid="${e(m.id)}" data-name="${e(m.name)}">${icon('person-x')}</button>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ${canManage ? `
              <div class="tab-pane fade" id="pending-invites">
                <div class="list-group">
                  ${invitations.filter(i => i.status === 'PENDIENTE').length ? invitations.filter(i => i.status === 'PENDIENTE').map(inv => `
                    <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-3 py-3">
                      <div>
                        <strong>${e(inv.invitedEmail)}</strong>
                        <div class="text-muted small">Enviada el ${shortDate(inv.createdAt)}</div>
                        <div class="d-flex flex-wrap gap-1 mt-1">${inv.permissions.map(p => `<span class="badge bg-light text-dark border" style="font-size: 10px;">${e(PERM_METADATA[p]?.name || p)}</span>`).join('')}</div>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger" data-action="cancel-invitation" data-cid="${e(communityId)}" data-invid="${e(inv.id)}">${icon('x-circle')} Cancelar</button>
                    </div>
                  `).join('') : '<div class="text-center p-3 text-muted">No hay invitaciones pendientes.</div>'}
                </div>
              </div>
            ` : ''}
          </div>
        </div>`;
      showModal('Integrantes y permisos · ' + (c?.name || 'Comunidad'), html, true);
    } catch (err) {
      toast(err.message, false);
      closeModal();
    }
  }

  function editMemberPermissionsModal(communityId, memberId, memberName, currentPermissions) {
    const categories = {};
    for (const p of Object.values(PERM_METADATA)) {
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    }
    const formId = 'modalForm_editPerms';
    const html = `
      <form id="${formId}" data-form="update-member-permissions">
        <input type="hidden" name="communityId" value="${e(communityId)}">
        <input type="hidden" name="memberId" value="${e(memberId)}">
        <p class="modal-intro mb-3">Modificando permisos granulares asignados a <strong>${e(memberName)}</strong>.</p>
        <div class="card bg-light border-0 p-3">
          <div class="row g-2">
            ${Object.entries(categories).map(([catName, perms]) => `
              <div class="col-md-6">
                <span class="badge bg-secondary-subtle text-secondary mb-1">${e(catName)}</span>
                <div class="d-grid gap-2">
                  ${perms.map(p => `
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" name="permissions" value="${e(p.id)}" id="editperm_${e(p.id)}" ${currentPermissions.includes(p.id) ? 'checked' : ''}>
                      <label class="form-check-label" for="editperm_${e(p.id)}"><strong>${e(p.name)}</strong><div class="tiny-note text-muted" style="font-size:11px;">${e(p.desc)}</div></label>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </form>`;
    showModal('Permisos del integrante', html, {
      size: 'lg',
      subtitle: memberName,
      footerHtml: modalFooterBtns(formId, 'Guardar permisos')
    });
  }

  function pendingInvitationsModal() {
    const items = state.pendingInvitations || [];
    if (!items.length) {
      toast('No tienes invitaciones pendientes.');
      return;
    }
    const html = `
      <p class="modal-intro">Has recibido invitaciones para colaborar en las siguientes comunidades. Revisa los permisos otorgados y responde:</p>
      <div class="list-group">
        ${items.map(inv => `
          <div class="list-group-item p-3 mb-2 rounded border">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div><h5 class="mb-1 text-success fw-bold">${e(inv.community.name)}</h5><span class="badge bg-light text-dark border">${e(cap(inv.community.type))}</span></div>
              <small class="text-muted">${shortDate(inv.createdAt)}</small>
            </div>
            <p class="small text-muted mb-2">Invitado por: <strong>${e(inv.sender.name)}</strong> (${e(inv.sender.email)})</p>
            <div class="mb-3">
              <span class="fw-semibold small d-block mb-1">Permisos asignados:</span>
              <div class="d-flex flex-wrap gap-1">${inv.permissions.map(p => `<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:11px;">${icon('check')} ${e(PERM_METADATA[p]?.name || p)}</span>`).join('')}</div>
            </div>
            <div class="d-flex gap-2 justify-content-end pt-2 border-top">
              <button type="button" class="btn btn-sm btn-outline-danger" data-action="respond-invitation" data-id="${e(inv.id)}" data-response="RECHAZAR">${icon('x-circle')} Rechazar</button>
              <button type="button" class="btn btn-sm btn-success" data-action="respond-invitation" data-id="${e(inv.id)}" data-response="ACEPTAR">${icon('check-circle')} Aceptar invitación</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    showModal('Invitaciones pendientes', html, true);
  }

  function soilRecommendationBadges(soil) {
    const matches = state.plants.filter(p => p.soils?.some(s => s.soil === soil));
    if (!matches.length) return '<span class="small text-muted">No hay especies asociadas a este suelo en el catálogo aún.</span>';
    return matches.map(p => `<span class="tag ${p.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${e(p.commonName)}</span>`).join('');
  }

  function gardenModal(gardenId = null) {
    const existing = gardenId ? state.gardenDetail?.garden : null;
    const available = (state.user.role === 'ADMINISTRADOR')
      ? state.communities
      : [...state.ownedCommunities, ...state.sharedCommunities.filter(c => c.myPermissions?.includes('CREATE_GARDENS'))];

    if (!existing && !available.length) {
      toast('Primero crea una comunidad o solicita el permiso CREATE_GARDENS.', false);
      go('comunidades');
      return;
    }

    const defaultSoil = existing?.soil || 'MARGOSO';
    const initRows = existing?.rows ?? 3;
    const initCols = existing?.cols ?? 4;
    const occupiedCells = new Set((existing?.crops || []).map(c => c.cell.replace('-', '')));

    openWizardModal({
      key: 'garden',
      icon: 'grid-3x3',
      title: existing ? 'Editar configuración del huerto' : 'Nuevo huerto medicinal',
      subtitle: existing ? existing.community.name : 'Configuración agronómica y cuadrícula 2D',
      submitLabel: existing ? 'Guardar cambios' : 'Crear huerto',
      extraHiddenHtml: `<input type="hidden" name="id" value="${e(existing?.id || '')}">`,
      steps: [
        {
          stepId: 'identity',
          title: 'Identidad y comunidad',
          subtitle: 'Comunidad custodia y nombre del huerto',
          html: `
            <div class="mb-3">
              ${existing ? `<div class="select-field"><label class="field-label">Comunidad custodia</label><input class="form-control" value="${e(existing.community.name)}" disabled></div>` : select('Comunidad custodia', 'communityId', available.map(c => [c.id, c.name]))}
            </div>
            <div class="mb-3">
              ${field('Nombre del huerto', 'name', 'text', `required maxlength="100" value="${e(existing?.name || '')}"`)}
            </div>
            <div class="p-2 bg-paper border rounded-3 small text-muted">
              ${icon('info-circle')} Solo las comunidades donde poseas permiso de administración o creación de huertos están habilitadas.
            </div>`
        },
        {
          stepId: 'location',
          title: 'Ubicación y dimensiones',
          subtitle: 'Territorio, coordenadas y extensión física',
          html: `
            <div class="form-grid mb-2">
              ${field('Provincia', 'province', 'text', `required value="${e(existing?.province || '')}"`)}
              ${field('Parroquia', 'parish', 'text', `required value="${e(existing?.parish || '')}"`)}
              ${field('Latitud (Ecuador: -5.5 a 2.1)', 'latitude', 'number', `step="0.0001" min="-5.5" max="2.1" value="${e(existing?.latitude ?? '-0.1807')}"`)}
              ${field('Longitud (Ecuador: -92.5 a -74.5)', 'longitude', 'number', `step="0.0001" min="-92.5" max="-74.5" value="${e(existing?.longitude ?? '-78.4678')}"`)}
            </div>
            <div class="mt-2">
              ${field('Área real del huerto (1 a 400 m²)', 'area', 'number', `min="1" max="400" step="0.1" id="f_garden_area" required value="${e(existing?.area ?? '')}"`)}
            </div>`
        },
        {
          stepId: 'conditions',
          title: 'Condiciones agronómicas',
          subtitle: 'Suelo, tipología, cerramiento y riego',
          html: `
            <div class="form-grid">
              ${select('Tipología del huerto', 'architecture', [['TIERRA', 'En tierra / surcos'], ['VERTICAL', 'Huerto vertical'], ['PISO', 'En recipientes / piso'], ['COLGANTE', 'Huerto colgante']], existing?.architecture || 'TIERRA')}
              ${select('Orientación solar', 'orientation', ['NORTE', 'SUR', 'ESTE', 'OESTE'], existing?.orientation || 'NORTE')}
              ${select('Cerramiento protector', 'fence', [['SI', 'Sí cuenta con cerca'], ['NO', 'Sin cerramiento']], existing?.fence || 'NO')}
              ${select('Tipo de suelo', 'soil', SOILS, defaultSoil, 'gardenSoilSelect')}
              ${select('Sistema de riego', 'irrigation', [
                ['RIO', 'Río (Superficial por gravedad o bombeo)'],
                ['CANAL', 'Canal o acequia comunitaria'],
                ['GOTEO', 'Goteo (Localizado por mangueras)'],
                ['AGUA_POTABLE', 'Agua potable (Red pública o doméstica)'],
                ['MANUAL', 'Manual (Regadera)'],
                ['ASPERSION', 'Aspersión giratoria']
              ], existing?.irrigation || 'GOTEO')}
              ${select('Tipo de abono', 'fertilizer', ['COMPOST', 'HUMUS', 'ORGANICO', 'NINGUNO'], existing?.fertilizer || 'COMPOST')}
            </div>
            <div class="mt-2 p-2 rounded-3 bg-light border d-flex flex-wrap align-items-center gap-2">
              <span class="tiny-note fw-bold">${icon('flower2')} Especies compatibles con este suelo:</span>
              <div class="d-flex flex-wrap gap-1" id="gardenSoilPreview">${soilRecommendationBadges(defaultSoil)}</div>
            </div>`
        },
        {
          stepId: 'grid',
          title: 'Organización de cuadrícula 2D',
          subtitle: 'Filas (A–T) y Columnas (1–20) del tablero',
          html: `
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <span class="small fw-bold">Dimensiones del tablero</span>
              <span class="tag tag-approved" id="gardenGridCountBadge">${initRows} × ${initCols} = ${initRows * initCols} casillas</span>
            </div>
            <p class="tiny-note mb-2">Define filas y columnas (hasta 160 casillas) para garantizar legibilidad en pantallas táctiles y escritorio.</p>
            <div class="kp-grid-configurator">
              <div class="kp-grid-controls">
                <div class="kp-stepper-box">
                  <label class="field-label" for="gardenRowsInput">Filas (A–T, máx. 20)</label>
                  <div class="kp-stepper">
                    <button type="button" class="kp-step-btn" data-step-target="gardenRowsInput" data-delta="-1" aria-label="Disminuir filas">−</button>
                    <input type="number" id="gardenRowsInput" name="rows" class="form-control text-center" min="1" max="20" required value="${e(initRows)}">
                    <button type="button" class="kp-step-btn" data-step-target="gardenRowsInput" data-delta="1" aria-label="Aumentar filas">+</button>
                  </div>
                </div>
                <div class="kp-stepper-box">
                  <label class="field-label" for="gardenColsInput">Columnas (1–20)</label>
                  <div class="kp-stepper">
                    <button type="button" class="kp-step-btn" data-step-target="gardenColsInput" data-delta="-1" aria-label="Disminuir columnas">−</button>
                    <input type="number" id="gardenColsInput" name="cols" class="form-control text-center" min="1" max="20" required value="${e(initCols)}">
                    <button type="button" class="kp-step-btn" data-step-target="gardenColsInput" data-delta="1" aria-label="Aumentar columnas">+</button>
                  </div>
                </div>
              </div>
              <div class="kp-grid-preview-wrap">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <strong class="small">Previsualización del tablero</strong>
                  <span class="tiny-note" id="gardenCellAreaHint">~${existing?.area ? fmt(existing.area / (initRows * initCols)) : '—'} m²/casilla</span>
                </div>
                <div id="gardenGridPreview" class="kp-mini-grid"></div>
              </div>
            </div>
            <div id="gardenGridWarning" class="alert alert-danger py-2 px-3 small mt-2 mb-0 d-none" role="alert"></div>`
        },
        {
          stepId: 'review',
          title: 'Revisión y notas',
          subtitle: 'Resumen agronómico y confirmación',
          html: `
            <div class="p-3 bg-light border rounded-3 mb-3">
              <h6 class="fw-bold mb-2 text-forest">${icon('check-circle')} Resumen agronómico del huerto</h6>
              <div class="row g-2 small">
                <div class="col-6"><span class="text-muted">Huerto:</span> <strong id="w_grd_name">—</strong></div>
                <div class="col-6"><span class="text-muted">Área:</span> <strong id="w_grd_area">—</strong></div>
                <div class="col-6"><span class="text-muted">Ubicación:</span> <span id="w_grd_loc">—</span></div>
                <div class="col-6"><span class="text-muted">Riego:</span> <strong id="w_grd_irrig">—</strong></div>
                <div class="col-6"><span class="text-muted">Suelo:</span> <span id="w_grd_soil">—</span></div>
                <div class="col-6"><span class="text-muted">Tablero:</span> <strong id="w_grd_grid">—</strong></div>
              </div>
            </div>
            <div>
              <label class="field-label" for="f_garden_desc">Notas o bitácora inicial del huerto (opcional)</label>
              <textarea id="f_garden_desc" name="description" class="form-control" rows="2" maxlength="400" placeholder="Observaciones sobre fuentes de agua, vientos o acceso...">${e(existing?.description || '')}</textarea>
            </div>`,
          onEnter: (stepEl, formEl) => {
            const name = formEl.querySelector('input[name="name"]')?.value || '—';
            const area = formEl.querySelector('input[name="area"]')?.value || '—';
            const prov = formEl.querySelector('input[name="province"]')?.value || '';
            const parish = formEl.querySelector('input[name="parish"]')?.value || '';
            const irrig = formEl.querySelector('select[name="irrigation"]')?.value || 'GOTEO';
            const soil = formEl.querySelector('select[name="soil"]')?.value || 'MARGOSO';
            const r = formEl.querySelector('input[name="rows"]')?.value || '3';
            const c = formEl.querySelector('input[name="cols"]')?.value || '4';

            const gnEl = $('#w_grd_name');
            const gaEl = $('#w_grd_area');
            const glEl = $('#w_grd_loc');
            const giEl = $('#w_grd_irrig');
            const gsEl = $('#w_grd_soil');
            const ggEl = $('#w_grd_grid');
            if (gnEl) gnEl.textContent = name;
            if (gaEl) gaEl.textContent = `${area} m²`;
            if (glEl) glEl.textContent = `${parish}, ${prov}`;
            if (giEl) giEl.textContent = IRRIGATION_LABELS[irrig]?.label || irrig;
            if (gsEl) gsEl.textContent = cap(soil);
            if (ggEl) ggEl.textContent = `${r} filas × ${c} cols (${r * c} casillas)`;
          }
        }
      ],
      onInit: (modalEl, formEl) => {
        const sel = formEl.querySelector('#gardenSoilSelect');
        const box = formEl.querySelector('#gardenSoilPreview');
        if (sel && box) {
          sel.addEventListener('change', () => {
            box.innerHTML = soilRecommendationBadges(sel.value);
          });
        }

        const rInput = formEl.querySelector('#gardenRowsInput');
        const cInput = formEl.querySelector('#gardenColsInput');
        const areaInput = formEl.querySelector('#f_garden_area') || formEl.querySelector('input[name="area"]');
        const previewEl = formEl.querySelector('#gardenGridPreview');
        const badgeEl = formEl.querySelector('#gardenGridCountBadge');
        const hintEl = formEl.querySelector('#gardenCellAreaHint');
        const warnEl = formEl.querySelector('#gardenGridWarning');
        const submitBtn = formEl.querySelector('#wizardSubmitBtn');

        const renderPreview = () => {
          if (!rInput || !cInput || !previewEl) return;
          const r = Math.max(1, Math.min(20, parseInt(rInput.value || '1', 10) || 1));
          const c = Math.max(1, Math.min(20, parseInt(cInput.value || '1', 10) || 1));
          const total = r * c;
          if (badgeEl) badgeEl.textContent = `${r} × ${c} = ${total} casillas`;
          const areaVal = Number(areaInput?.value || 0);
          if (hintEl) hintEl.textContent = areaVal > 0 ? `~${fmt(areaVal / total)} m² / casilla` : `${String.fromCharCode(64 + r)}${c} última casilla`;

          const affected = [];
          for (const coord of occupiedCells) {
            const rIdx = coord.charCodeAt(0) - 64;
            const cIdx = Number(coord.slice(1));
            if (rIdx > r || cIdx > c) affected.push(coord);
          }

          let warnMsg = '';
          if (total > 160) {
            warnMsg = `La cuadrícula (${r} × ${c} = ${total}) supera el máximo operativo de 160 casillas.`;
          } else if (affected.length) {
            warnMsg = `No puedes reducir debajo de estos cultivos activos: ${affected.join(', ')}.`;
          }
          if (warnEl) {
            warnEl.textContent = warnMsg;
            warnEl.classList.toggle('d-none', !warnMsg);
          }
          if (submitBtn) submitBtn.disabled = Boolean(warnMsg);

          const maxShowRows = Math.min(r, 8);
          const maxShowCols = Math.min(c, 10);
          previewEl.style.setProperty('--preview-cols', maxShowCols);
          const cellsHtml = [];
          for (let ri = 0; ri < maxShowRows; ri++) {
            const rowL = String.fromCharCode(65 + ri);
            for (let ci = 1; ci <= maxShowCols; ci++) {
              const code = `${rowL}${ci}`;
              const isOcc = occupiedCells.has(code);
              cellsHtml.push(`<span class="kp-mini-cell ${isOcc ? 'occupied' : ''}" title="${code}${isOcc ? ' (ocupada)' : ''}">${code}</span>`);
            }
          }
          previewEl.innerHTML = cellsHtml.join('') + (r > maxShowRows || c > maxShowCols ? `<div class="kp-mini-ellipsis">Vista compacta (${r}×${c} = ${total} casillas hasta ${String.fromCharCode(64 + r)}${c})</div>` : '');
        };

        formEl.querySelectorAll('.kp-step-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const inp = formEl.querySelector(`#${btn.dataset.stepTarget}`);
            if (!inp) return;
            const next = Math.max(Number(inp.min), Math.min(Number(inp.max), (Number(inp.value) || 1) + Number(btn.dataset.delta)));
            inp.value = next;
            renderPreview();
          });
        });
        rInput?.addEventListener('input', renderPreview);
        cInput?.addEventListener('input', renderPreview);
        areaInput?.addEventListener('input', renderPreview);
        renderPreview();
      }
    });
  }

  function cropModal(cell) {
    const g = state.gardenDetail.garden;
    if (!state.plants.length) {
      toast('El catálogo aún no tiene plantas registradas.', false);
      return;
    }
    const recommended = state.plants.filter(p => p.soils.some(s => s.soil === g.soil));
    const rest = state.plants.filter(p => !recommended.some(r => r.id === p.id));
    const orderedPlants = [...recommended, ...rest];
    let plantaSeleccionada = orderedPlants[0];

    const renderCompactPlant = (p) => {
      if (!p) return '';
      const thumb = plantThumb(p);
      const isCompat = p.soils?.some(s => s.soil === g.soil);
      return `
        <div class="kp-selected-plant-thumb ${p.thermal === 'CALIENTE' ? 'hot' : ''}">
          ${thumb ? `<img src="${e(thumb)}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="${e(p.commonName)}">` : icon('flower2')}
        </div>
        <div class="kp-selected-plant-info">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <strong>${e(p.commonName)}</strong>
            <span class="tag ${p.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${p.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca'}</span>
            ${isCompat ? `<span class="tag tag-approved">Compatible con ${e(cap(g.soil))}</span>` : ''}
          </div>
          <div class="tiny-note fst-italic">${e(p.scientific)}</div>
          <div class="tiny-note">${icon('layers')} Suelos: ${e(p.soils?.map(s => cap(s.soil)).join(', ') || 'General')}</div>
        </div>`;
    };

    openWizardModal({
      key: 'crop',
      icon: 'flower1',
      title: 'Asociar planta a casilla',
      subtitle: `Casilla ${cell} · ${g.name}`,
      submitLabel: 'Guardar cultivo',
      extraHiddenHtml: `
        <input type="hidden" name="gardenId" value="${e(g.id)}">
        <input type="hidden" name="cell" value="${e(cell)}">
        <input type="hidden" name="plantId" id="selectedCropPlantId" value="${e(plantaSeleccionada.id)}">`,
      steps: [
        {
          stepId: 'select-plant',
          title: 'Selección de especie botánica',
          subtitle: 'Elige la planta del catálogo medicinal',
          html: `
            <div class="kp-parcel-context-bar mb-2">
              <span>${icon('geo-alt')} Parcela <strong>${e(cell)}</strong></span>
              <span>${icon('layers')} Suelo <strong>${e(cap(g.soil))}</strong></span>
              <span>${e(g.name)}</span>
            </div>

            <div class="kp-selected-plant-strip mb-2" id="cropPlantPreview">
              ${renderCompactPlant(selectedPlant)}
            </div>

            <div class="kp-plant-picker mb-2">
              <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
                <label class="field-label mb-0" for="cropPlantSearch">Especies disponibles (${orderedPlants.length})</label>
                <input type="search" id="cropPlantSearch" class="form-control form-control-sm kp-picker-search" placeholder="Filtrar planta...">
              </div>
              <div class="kp-plant-picker-list" id="cropPlantPickerList" role="listbox" aria-label="Especies medicinales" style="max-height: 190px;">
                ${orderedPlants.map((p, idx) => {
                  const thumb = plantThumb(p);
                  const compat = p.soils?.some(s => s.soil === g.soil);
                  return `
                    <button type="button" class="kp-picker-option ${idx === 0 ? 'selected' : ''}" data-pick-plant="${e(p.id)}" data-search-text="${e((p.commonName + ' ' + p.scientific + ' ' + (p.soils || []).map(s => s.soil).join(' ')).toLowerCase())}" role="option" aria-selected="${idx === 0 ? 'true' : 'false'}">
                      <span class="kp-opt-thumb">${thumb ? `<img src="${e(thumb)}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="">` : icon('flower2')}</span>
                      <span class="kp-opt-text">
                        <strong>${e(p.commonName)}</strong>
                        <small>${e(p.scientific)}</small>
                      </span>
                      <span class="kp-opt-badges">
                        ${compat ? '<span class="tag tag-approved">Suelo OK</span>' : ''}
                        <span class="parcel-thermal-dot ${p.thermal === 'CALIENTE' ? 'hot' : 'cold'}"></span>
                      </span>
                    </button>`;
                }).join('')}
              </div>
            </div>`
        },
        {
          stepId: 'technique',
          title: 'Manejo agronómico y técnicas',
          subtitle: 'Técnica de siembra y forma de propagación',
          html: `
            <div class="form-grid mb-3">
              ${select('Técnica de siembra', 'technique', ['SURCOS', 'TERRAZAS', 'CAMELLONES', 'RECIPIENTES'])}
              ${select('Forma de propagación', 'propagation', ['SEMILLAS', 'ESTACAS', 'ESQUEJES', 'PLANTULAS'])}
            </div>
            <div>
              <label class="field-label" for="f_crop_notes">Notas de parcela (opcional)</label>
              <input id="f_crop_notes" name="notes" type="text" class="form-control" maxlength="300" placeholder="Observaciones breves de siembra...">
            </div>`
        },
        {
          stepId: 'review',
          title: 'Revisión y siembra',
          subtitle: 'Confirma la asociación del cultivo',
          html: `
            <div class="p-3 bg-light border rounded-3 mb-3">
              <h6 class="fw-bold mb-2 text-forest">${icon('flower2')} Resumen de siembra</h6>
              <div class="d-grid gap-2 small">
                <div class="d-flex justify-content-between"><span class="text-muted">Planta:</span> <strong id="w_crop_pname">—</strong></div>
                <div class="d-flex justify-content-between"><span class="text-muted">Parcela:</span> <strong id="w_crop_cell">${e(cell)}</strong></div>
                <div class="d-flex justify-content-between"><span class="text-muted">Técnica:</span> <span id="w_crop_tech">—</span></div>
                <div class="d-flex justify-content-between"><span class="text-muted">Propagación:</span> <span id="w_crop_prop">—</span></div>
              </div>
            </div>
            <div class="p-2 bg-paper border rounded-3 small">
              <strong class="text-forest">${icon('moon-stars')} Calendario lunar:</strong>
              <span>Siembra recomendada en luna creciente para potenciar el vigor y desarrollo vegetativo.</span>
            </div>`,
          onEnter: (stepEl, formEl) => {
            const pId = formEl.querySelector('#selectedCropPlantId')?.value;
            const p = state.plants.find(x => x.id === pId) || plantaSeleccionada;
            const tech = formEl.querySelector('select[name="technique"]')?.value || '—';
            const prop = formEl.querySelector('select[name="propagation"]')?.value || '—';
            const pnEl = $('#w_crop_pname');
            const ptEl = $('#w_crop_tech');
            const ppEl = $('#w_crop_prop');
            if (pnEl) pnEl.textContent = `${p.commonName} (${p.scientific})`;
            if (ptEl) ptEl.textContent = cap(tech);
            if (ppEl) ppEl.textContent = cap(prop);
          }
        }
      ],
      onInit: (modalEl, formEl) => {
        const hiddenId = formEl.querySelector('#selectedCropPlantId');
        const box = formEl.querySelector('#cropPlantPreview');
        const list = formEl.querySelector('#cropPlantPickerList');
        const searchInp = formEl.querySelector('#cropPlantSearch');

        if (list && hiddenId && box) {
          list.addEventListener('click', ev => {
            const opt = ev.target.closest('[data-pick-plant]');
            if (!opt) return;
            const p = state.plants.find(x => x.id === opt.dataset.pickPlant);
            if (!p) return;
            plantaSeleccionada = p;
            hiddenId.value = p.id;
            list.querySelectorAll('.kp-picker-option').forEach(b => {
              const active = b === opt;
              b.classList.toggle('selected', active);
              b.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            box.innerHTML = renderCompactPlant(p);
          });
        }
        if (searchInp && list) {
          searchInp.addEventListener('input', () => {
            const q = searchInp.value.trim().toLowerCase();
            list.querySelectorAll('.kp-picker-option').forEach(opt => {
              opt.hidden = Boolean(q && !opt.dataset.searchText.includes(q));
            });
          });
        }
      }
    });
  }

  function cropDetailModal(id) {
    const c = state.gardenDetail.garden.crops.find(x => x.id === id);
    if (!c) return;
    const g = state.gardenDetail.garden;
    const { canRegisterActivity, canUploadEvidence, canManageCrops, isOwner } = state.gardenDetail;
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const canLog = isAdmin || isOwner || (canRegisterActivity && canUploadEvidence);
    const canEditCrop = isAdmin || isOwner || canManageCrops;
    const watering = c.activities?.find(a => a.task === 'RIEGO');
    const approvedActivities = (c.activities || []).filter(a => a.status === 'APROBADA');
    const allActivities = c.activities || [];

    const footerActions = `
      <div class="d-flex justify-content-between align-items-center w-100 gap-2 flex-wrap">
        <div>
          ${canEditCrop && approvedActivities.length === 0 ? `<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-crop" data-id="${e(c.id)}" data-gid="${e(c.gardenId)}">${icon('trash')} Liberar casilla</button>` : ''}
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>
          ${canLog ? `<button type="button" class="btn btn-sm btn-success px-3" data-action="new-activity" data-id="${e(c.id)}">${icon('camera')} Registrar actividad</button>` : ''}
        </div>
      </div>`;

    showModal(
      c.plant.commonName,
      `<!-- 1. HÉROE BOTÁNICO -->
       <div class="plant-detail-hero ${c.plant.thermal === 'CALIENTE' ? 'hot' : ''}">
         <div class="plant-detail-img-wrap">
           ${c.plant.imageUrl ? `<img src="${e(c.plant.imageUrl)}" alt="${e(c.plant.commonName)}" style="cursor:pointer" data-action="photo-zoom" data-src="${e(c.plant.imageUrl)}" data-title="${e(c.plant.commonName)}">` : icon('flower2', 'fs-1')}
         </div>
         <div>
           <div class="d-flex gap-2 flex-wrap mb-2">
             <span class="tag tag-neutral fw-bold">Casilla ${e(c.cell)}</span>
             <span class="tag ${c.plant.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${c.plant.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca / fría'}</span>
             <span class="tag tag-approved">${e(STAGE_LABELS[c.stage] || cap(c.stage))}</span>
           </div>
           <h3 class="card-title mb-1">${e(c.plant.commonName)}</h3>
           <p class="small fst-italic text-muted mb-0">${e(c.plant.scientific)}${c.plant.family ? ` · Familia ${e(c.plant.family)}` : ''}</p>
         </div>
       </div>

       <!-- 2. INFORMACIÓN DE LA PARCELA -->
       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">${icon('geo-alt')} Ubicación y contexto físico</h3>
         ${kvGrid([
           ['Huerto medicinal', g.name],
           ['Ubicación comunitaria', `${g.parish}, ${g.province}`],
           ['Suelo y arquitectura', `Suelo ${cap(g.soil)} · ${ARCH_LABELS[g.architecture] || cap(g.architecture)}`],
           ['Orientación y cerramiento', `Orientación ${cap(g.orientation)} · Cerca: ${g.fence === 'SI' ? 'Sí' : 'No'}`]
         ])}
       </div>

       <!-- 3. DATOS AGRÍCOLAS DEL CULTIVO -->
       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">${icon('flower1')} Datos agronómicos</h3>
         ${kvGrid([
           ['Fecha de siembra', shortDate(c.createdAt)],
           ['Técnica aplicada', cap(c.technique)],
           ['Método de propagación', cap(c.propagation)],
           ['Evidencias aprobadas', `${approvedActivities.length} de ${allActivities.length}`],
           ...(c.notes ? [['Observaciones agronómicas', c.notes]] : [])
         ])}
       </div>

       <!-- 4. SEGUIMIENTO HÍDRICO Y RIEGO -->
       <div class="kp-detail-section mt-3 kp-hydric-section">
         <h3 class="kp-detail-heading">${icon('droplet-fill')} Seguimiento hídrico y riego</h3>
         <div class="kp-hydric-card p-3 rounded-3 border">
           <div class="row g-2">
             <div class="col-sm-6">
               <span class="tiny-note text-muted d-block">Tipo de riego configurado</span>
               <strong class="text-forest">${icon('water')} ${IRRIGATION_LABELS[g.irrigation] || g.irrigation || 'Goteo'}</strong>
             </div>
             <div class="col-sm-6">
               <span class="tiny-note text-muted d-block">Último riego registrado</span>
               <strong class="${watering ? 'text-forest' : 'text-muted'}">${watering ? shortDate(watering.createdAt) : 'Pendiente de primer riego'}</strong>
             </div>
             ${watering ? `
               <div class="col-sm-6 mt-2">
                 <span class="tiny-note text-muted d-block">Método aplicado</span>
                 <span class="tag tag-neutral">${IRRIGATION_LABELS[watering.irrigationType] || watering.irrigationType || 'Goteo'}</span>
               </div>
               <div class="col-sm-6 mt-2">
                 <span class="tiny-note text-muted d-block">Fase lunar / Responsable</span>
                 <small>${watering.phase || 'Luna propicia'} · ${e(watering.volunteer?.name || 'Comunidad')}</small>
               </div>
               ${watering.note ? `<div class="col-12 mt-1"><small class="text-muted fst-italic">"${e(watering.note)}"</small></div>` : ''}
             ` : ''}
           </div>
           ${canLog ? `
             <div class="mt-3 pt-2 border-top text-end">
               <button type="button" class="btn btn-sm btn-outline-forest" data-action="new-activity" data-id="${e(c.id)}" data-default-task="RIEGO">
                 ${icon('droplet-half')} Registrar riego directo
               </button>
             </div>` : ''}
         </div>
       </div>

       <!-- 5. HISTORIAL DE ACTIVIDADES Y EVIDENCIAS CON ZOOM -->
       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">${icon('journal-bookmark')} Historial de labores y evidencias (${allActivities.length})</h3>
         ${allActivities.length ? `
           <div class="d-grid gap-2">
             ${allActivities.slice(0, 6).map(a => `
               <div class="approved-media p-2 border rounded-3 align-items-center">
                 <button type="button" class="kp-validation-photo-btn kp-mini-photo" data-action="photo-zoom" data-src="/uploads/${e(a.imageName)}" data-title="${e(TASK_LABELS[a.task] || cap(a.task))} · ${e(c.cell)}" data-caption="${e(a.note || '')}" aria-label="Ampliar fotografía">
                   <img src="/uploads/${e(a.imageName)}" alt="Evidencia de ${e(TASK_LABELS[a.task] || cap(a.task))}">
                 </button>
                 <div class="flex-grow-1 min-w-0">
                   <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                     <strong style="font-size:12.5px">${e(TASK_LABELS[a.task] || cap(a.task))}</strong>
                     ${status(a.status)}
                   </div>
                   <span class="tiny-note d-block">${shortDate(a.createdAt)}${a.volunteer ? ` · ${e(a.volunteer.name)}` : ''}</span>
                   ${a.task === 'COSECHA' && (a.harvestPart || a.harvestQuantity) ? `<span class="badge bg-success-subtle text-success small d-inline-block my-1">${icon('basket')} Cosecha: ${e(a.harvestPart || '')}${a.harvestQuantity ? ` (${a.harvestQuantity} ${a.harvestUnit || 'g'})` : ''}</span>` : ''}
                   ${a.task === 'RIEGO' && a.irrigationType ? `<span class="badge bg-info-subtle text-info small d-inline-block my-1">${icon('droplet')} ${IRRIGATION_LABELS[a.irrigationType] || a.irrigationType}</span>` : ''}
                   ${a.note ? `<span class="tiny-note d-block text-break">${e(a.note)}</span>` : ''}
                 </div>
               </div>
             `).join('')}
           </div>
         ` : '<p class="tiny-note mb-0">Aún no se registran labores en esta parcela. Registra la primera evidencia para acreditar su cuidado.</p>'}
       </div>

       ${(!canLog && canRegisterActivity) ? '<div class="kp-inline-notice mt-3">Tienes permiso para registrar actividades, pero requieres <strong>UPLOAD_EVIDENCE</strong> para adjuntar fotografía.</div>' : ''}`,
      { size: 'lg', subtitle: `Parcela ${c.cell} · ${g.name}`, footerHtml: footerActions }
    );
  }

  function plantDetailModal(id) {
    const p = state.plants.find(x => x.id === id);
    if (!p) return;
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const soilTags = p.soils?.length
      ? p.soils.map(s => `<span class="tag tag-neutral">${e(cap(s.soil))}</span>`).join('')
      : '<span class="tiny-note">Pendiente de definición agronómica.</span>';
    const footerActions = `
      <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>
      ${isAdmin ? `<button type="button" class="btn btn-sm btn-success px-3" data-action="edit-plant" data-id="${e(p.id)}">${icon('pencil')} Editar ficha</button>` : ''}`;

    showModal(
      p.commonName,
      `<div class="plant-detail-hero ${p.thermal === 'CALIENTE' ? 'hot' : ''}">
         <div class="plant-detail-img-wrap">
           ${p.imageUrl ? `<img src="${e(p.imageUrl)}" alt="${e(p.commonName)}">` : icon('flower2', 'fs-1')}
         </div>
         <div>
           <div class="d-flex gap-2 flex-wrap mb-2">
             <span class="tag ${p.thermal === 'CALIENTE' ? 'tag-hot' : 'tag-cold'}">${p.thermal === 'CALIENTE' ? 'Cálida' : 'Fresca / fría'}</span>
             <span class="tag tag-neutral">Ciclo ${e(cap(p.cycle))}</span>
             <span class="tag ${p.verified ? 'tag-approved' : 'tag-demo'}">${p.verified ? 'Validada' : 'Pendiente de validación'}</span>
           </div>
           <h3 class="card-title mb-1">${e(p.commonName)}</h3>
           <p class="fst-italic text-muted mb-0">${e(p.scientific)}${p.family ? ` · Familia ${e(p.family)}` : ''}</p>
         </div>
       </div>

       <div class="kp-detail-section">
         <h3 class="kp-detail-heading">Características de cultivo</h3>
         ${kvGrid([
           ['Cualidad térmica', p.thermal === 'CALIENTE' ? 'Planta cálida' : 'Planta fresca / fría'],
           ['Ciclo de desarrollo', cap(p.cycle)],
           ['Piso altitudinal', `${p.minAltitude ?? 0} – ${p.maxAltitude ?? '?'} m s. n. m.`],
           ['Estado editorial', p.verified ? 'Información botánica validada' : 'En revisión científica']
         ])}
       </div>

       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">Compatibilidad de suelo</h3>
         <div class="d-flex flex-wrap gap-2">${soilTags}</div>
       </div>

       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">Usos y precauciones</h3>
         ${!p.verified ? '<p class="tiny-note mb-2">Los usos terapéuticos y dosis aún se encuentran en proceso de validación etnobotánica.</p>' : ''}
         <div class="kp-two-col-info">
           <div class="kp-info-box">
             <small>Usos tradicionales</small>
             <p class="mb-0">${e(p.uses || 'Información tradicional pendiente de registro.')}</p>
           </div>
           <div class="kp-info-box">
             <small>Precauciones y contraindicaciones</small>
             <p class="mb-0">${e(p.cautions || 'Consultar con especialista o maestro antes de uso terapéutico.')}</p>
           </div>
         </div>
       </div>

       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">${icon('basket')} Recolección y cosecha (Norma MSP 2017)</h3>
         ${kvGrid([
           ['Parte recolectada', p.harvestPart || 'Hojas y sumidades'],
           ['Momento y etapa', p.harvestStage || 'Floración plena, en horas de la mañana'],
           ['Condiciones climáticas', p.harvestConditions || 'Día seco, sin rocío ni lluvia'],
           ['Técnica de recolección', p.harvestTechnique || 'Corte limpio sin desgarrar la planta'],
           ['Conservación postcosecha', p.harvestConservation || 'Secado a la sombra en lugar ventilado'],
           ['Precauciones de corte', p.harvestCautions || 'No recolectar en horas de alta radiación solar']
         ])}
       </div>

       ${(p.botanicalNotes || p.imageAttribution || p.imageLicense) ? `
         <div class="kp-detail-section mt-3">
           <h3 class="kp-detail-heading">Información complementaria</h3>
           ${p.botanicalNotes ? `<p class="small mb-2">${e(p.botanicalNotes)}</p>` : ''}
           ${(p.imageAttribution || p.imageLicense) ? `
             <div class="kp-credit-bar">
               <strong>Crédito fotográfico:</strong> ${e(p.imageAttribution || 'Archivo Kawsapacha')} · Licencia: ${e(p.imageLicense || 'Uso educativo')}
               ${p.imageSource ? ` · <a href="${e(p.imageSource)}" target="_blank" rel="noopener">Fuente original</a>` : ''}
             </div>` : ''}
         </div>` : ''}`,
      { size: 'lg', subtitle: p.family ? `Familia ${p.family}` : 'Ficha botánica', footerHtml: footerActions }
    );
  }

  function communityDetailModal(id) {
    const allComms = [...(state.ownedCommunities || []), ...(state.sharedCommunities || []), ...(state.communities || [])];
    const c = allComms.find(x => x.id === id);
    if (!c) return;
    const isOwner = c.ownerId === state.user?.id;
    const isAdmin = state.user?.role === 'ADMINISTRADOR';
    const canManage = isOwner || isAdmin;
    const membersList = c.members || [];
    const associatedGardens = (state.gardens || []).filter(g => g.communityId === c.id || g.community?.id === c.id);
    const ownerName = c.owner?.name || c.leader?.name || 'Responsable comunitario';
    const ownerContact = c.phone || c.owner?.email || 'No registrado';
    const gardensCount = associatedGardens.length || c._count?.gardens || 0;

    const footerActions = `
      <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>
      <button type="button" class="btn btn-sm btn-outline-success" data-action="${canManage ? 'manage-members' : 'view-members'}" data-id="${e(c.id)}">${icon('people')} ${canManage ? 'Gestionar equipo' : 'Ver equipo'}</button>
      ${canManage ? `<button type="button" class="btn btn-sm btn-success px-3" data-action="edit-community" data-id="${e(c.id)}">${icon('pencil')} Editar comunidad</button>` : ''}`;

    showModal(
      c.name,
      `<div class="kp-detail-section">
         <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-2">
           <div>
             <span class="tag ${isOwner ? 'tag-approved' : 'tag-neutral'}">${isOwner ? 'Propietario' : 'Colaborador'}</span>
             <span class="tag tag-neutral">${e(COMMUNITY_TYPE_LABELS[c.type] || cap(c.type))}</span>
           </div>
           <span class="tiny-note">Creada el ${shortDate(c.createdAt)}</span>
         </div>
         ${c.description ? `<p class="small mb-2">${e(c.description)}</p>` : ''}
         <div class="stats-grid-4">
           <div class="stat-mini-box"><span>Integrantes</span><strong>${membersList.length}</strong></div>
           <div class="stat-mini-box"><span>Huertos</span><strong>${gardensCount}</strong></div>
           <div class="stat-mini-box"><span>Tipo</span><strong style="font-size:15px">${e(COMMUNITY_TYPE_LABELS[c.type] || cap(c.type))}</strong></div>
           <div class="stat-mini-box"><span>Estado</span><strong style="font-size:15px">${isOwner ? 'Propia' : 'Activa'}</strong></div>
         </div>
       </div>

       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">Responsable de la comunidad</h3>
         <div class="d-flex align-items-center gap-3">
           <span class="avatar-circle">${e(initial(ownerName))}</span>
           <div class="min-w-0">
             <strong class="d-block">${e(ownerName)}</strong>
             <span class="tiny-note">${icon('telephone')} ${e(ownerContact)}</span>
           </div>
         </div>
       </div>

       <div class="kp-detail-section mt-3">
         <h3 class="kp-detail-heading">Huertos asociados (${gardensCount})</h3>
         ${associatedGardens.length ? `
           <div class="d-grid gap-2">
             ${associatedGardens.map(g => `
               <div class="kp-mini-garden-row">
                 <div class="min-w-0">
                   <strong class="d-block text-truncate">${e(g.name)}</strong>
                   <span class="tiny-note">${e(ARCH_LABELS[g.architecture] || cap(g.architecture))} · Suelo ${e(cap(g.soil))} · ${g.rows}×${g.cols} parcelas</span>
                 </div>
                 <div class="d-flex align-items-center gap-2">
                   ${status(g.status)}
                   <button type="button" class="btn btn-sm btn-success" data-action="open-garden" data-id="${e(g.id)}" data-bs-dismiss="modal">Abrir 2D</button>
                 </div>
               </div>
             `).join('')}
           </div>
         ` : `<p class="tiny-note mb-0">Esta comunidad aún no tiene huertos vinculados visibles en tu lista.</p>`}
       </div>

       ${membersList.length ? `
         <div class="kp-detail-section mt-3">
           <h3 class="kp-detail-heading">Integrantes (${membersList.length})</h3>
           <div class="d-flex flex-wrap gap-2">
             ${membersList.slice(0, 8).map(m => `<span class="tag tag-neutral">${e(m.user?.name || m.name || 'Integrante')}</span>`).join('')}
             ${membersList.length > 8 ? `<span class="tiny-note">+${membersList.length - 8} más</span>` : ''}
           </div>
         </div>` : ''}`,
      { size: 'lg', subtitle: COMMUNITY_TYPE_LABELS[c.type] || cap(c.type), footerHtml: footerActions }
    );
  }

  function photoLightboxModal(src, title = 'Evidencia fotográfica', caption = '') {
    if (!src) return;
    showModal(
      title || 'Evidencia fotográfica',
      `<div class="kp-lightbox-wrap">
         <img src="${e(src)}" alt="${e(title || 'Evidencia fotográfica')}">
       </div>
       ${caption ? `<p class="small text-muted mt-2 mb-0">${e(caption)}</p>` : ''}`,
      {
        size: 'lg',
        subtitle: 'Inspección visual',
        footerHtml: '<button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>'
      }
    );
  }

  // --- MODALES V2: TALENTOS, RETOS, FORO Y BODEGA ---
  async function talentsModal() {
    const data = await request('/api/talentos/mis-talentos');
    const talents = data.talents || [];

    const listHtml = talents.length ? talents.map(t => `
      <div class="card p-3 mb-2 kp-talent-card border rounded-3 bg-paper">
        <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div>
            <span class="badge bg-forest mb-1">${e(TALENT_CATEGORIES[t.category] || t.category)}</span>
            <h4 class="mb-1" style="font-size:15px">${e(t.name)}</h4>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="tag ${t.status === 'VALIDADO' ? 'tag-approved' : t.status === 'RECHAZADO' ? 'tag-hot' : 'tag-neutral'}">${e(TALENT_STATUS_LABELS[t.status] || t.status)}</span>
            ${t.status === 'PENDIENTE' ? `<button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" data-action="delete-talent" data-id="${e(t.id)}" title="Eliminar">${icon('trash')}</button>` : ''}
          </div>
        </div>
        <p class="small text-muted mb-1">${e(t.description)}</p>
        <div class="tiny-note text-muted"><strong>Trayectoria:</strong> ${e(t.experience)}</div>
        ${t.evidenceUrl ? `<div class="tiny-note mt-1"><a href="${e(t.evidenceUrl)}" target="_blank" rel="noopener">${icon('link-45deg')} Enlace de evidencia / respaldo</a></div>` : ''}
        ${t.reviewNote ? `<div class="p-2 rounded bg-light border mt-2 small"><strong>Observación de revisión:</strong> ${e(t.reviewNote)}</div>` : ''}
      </div>
    `).join('') : '<p class="text-muted small p-3 text-center bg-paper border rounded-3">Aún no has registrado saberes ancestrales.</p>';

    const declareFormHtml = `
      <form id="talentDeclareForm" class="mt-4 pt-3 border-top" data-form="declare-talent">
        <h4 class="mb-2" style="font-size:16px">${icon('award')} Declarar nuevo saber o talento</h4>
        <div class="mb-2">
          ${field('Nombre del saber o talento', 'name', 'text', 'required maxlength="120" placeholder="Ej.: Propagación de plantas medicinales por esquejes"')}
        </div>
        <div class="mb-2">
          ${select('Categoría del saber', 'category', Object.entries(TALENT_CATEGORIES))}
        </div>
        <div class="mb-2">
          <label class="field-label" for="f_talent_desc">Descripción del saber y aplicación práctica</label>
          <textarea id="f_talent_desc" name="description" class="form-control" rows="2" required maxlength="800" placeholder="Describe cómo aplicas este conocimiento tradicional..."></textarea>
        </div>
        <div class="mb-2">
          ${field('Años de práctica o trayectoria', 'experience', 'text', 'required maxlength="500" placeholder="Ej.: 8 años cultivando plantas en huertos comunitarios"')}
        </div>
        <div class="mb-2">
          ${field('Enlace de evidencia (opcional: fotos, certificados, videos)', 'evidenceUrl', 'url', 'maxlength="300" placeholder="https://..."')}
        </div>
        <div class="text-end mt-3">
          <button type="submit" class="btn btn-sm btn-success px-3">${icon('check-circle')} Declarar saber para certificación</button>
        </div>
      </form>
    `;

    showModal(
      'Mis saberes y talentos ancestrales',
      `<div class="mb-3">
         <p class="small text-muted mb-3">Registra tus conocimientos agroecológicos andinos. Los usuarios con nivel Maestro o Administradores evaluarán y certificarán tus saberes (+25 pts de sabiduría).</p>
         ${listHtml}
         ${declareFormHtml}
       </div>`,
      { size: 'lg', subtitle: 'Reconocimiento de sabiduría', footerHtml: '<button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>' }
    );
  }

  async function talentsReviewModal() {
    const data = await request('/api/talentos/pendientes');
    const talents = data.talents || [];

    const listHtml = talents.length ? talents.map(t => `
      <div class="card p-3 mb-3 kp-talent-card border rounded-3 bg-paper">
        <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="avatar-circle" style="width:28px;height:28px;font-size:11px">${e(initial(t.user.name))}</span>
              <strong>${e(t.user.name)}</strong>
              <span class="tag tag-neutral">${e(LEVELS[t.user.level] || t.user.level)} (${fmt(t.user.points)} pts)</span>
            </div>
            <span class="badge bg-forest mb-1">${e(TALENT_CATEGORIES[t.category] || t.category)}</span>
            <h4 class="mb-1" style="font-size:15px">${e(t.name)}</h4>
          </div>
          <span class="tag tag-neutral">En revisión</span>
        </div>
        <p class="small text-muted mb-1">${e(t.description)}</p>
        <div class="tiny-note text-muted mb-2"><strong>Experiencia:</strong> ${e(t.experience)}</div>
        ${t.evidenceUrl ? `<div class="tiny-note mb-2"><a href="${e(t.evidenceUrl)}" target="_blank" rel="noopener">${icon('link-45deg')} Ver respaldo</a></div>` : ''}
        <div class="d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="reject-talent" data-id="${e(t.id)}">${icon('x-circle')} Rechazar</button>
          <button type="button" class="btn btn-sm btn-success" data-action="certify-talent" data-id="${e(t.id)}">${icon('check-circle')} Certificar (+25 pts)</button>
        </div>
      </div>
    `).join('') : '<p class="text-muted small p-4 text-center bg-paper border rounded-3">No hay talentos pendientes de certificación en este momento.</p>';

    showModal(
      'Bandeja de certificación de talentos',
      `<p class="small text-muted mb-3">Como Administrador o Maestro, puedes certificar la trayectoria tradicional de los miembros de la comunidad.</p>
       ${listHtml}`,
      { size: 'lg', subtitle: 'Evaluación comunitaria', footerHtml: '<button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>' }
    );
  }

  function newChallengeModal() {
    form(
      'new-challenge',
      `<div class="mb-3">
         ${field('Título del reto', 'title', 'text', 'required maxlength="120" placeholder="Ej.: Maestro del Riego"')}
       </div>
       <div class="mb-3">
         <label class="field-label" for="f_ch_desc">Descripción del objetivo</label>
         <textarea id="f_ch_desc" name="description" class="form-control" rows="2" required maxlength="500" placeholder="Explica qué debe cumplir el participante..."></textarea>
       </div>
       <div class="row g-2 mb-3">
         <div class="col-6">
           ${select('Categoría', 'category', ['ACTIVIDADES', 'RIEGO', 'COSECHA', 'CUIDADO', 'COMUNIDAD'])}
         </div>
         <div class="col-6">
           ${select('Tipo de meta', 'targetType', [
             ['ACTIVITIES_APPROVED', 'Labores aprobadas'],
             ['CROPS_PLANTED', 'Cultivos sembrados'],
             ['IRRIGATION_LOGGED', 'Riegos registrados'],
             ['HARVEST_LOGGED', 'Cosechas registradas']
           ])}
         </div>
       </div>
       <div class="row g-2 mb-3">
         <div class="col-6">
           ${field('Meta (cantidad)', 'targetCount', 'number', 'min="1" max="1000" value="3" required')}
         </div>
         <div class="col-6">
           ${field('Recompensa (puntos)', 'pointsReward', 'number', 'min="1" max="500" value="15" required')}
         </div>
       </div>`,
      'Crear reto comunitario',
      'md',
      'Nuevo reto agroecológico'
    );
  }

  function forumPostModal() {
    const cats = state.forumCategories || [];
    form(
      'forum-post',
      `<div class="mb-3">
         ${field('Título de la publicación', 'title', 'text', 'required maxlength="150" placeholder="Ej.: Experiencia controlando pulgones con infusión de ruda"')}
       </div>
       <div class="mb-3">
         ${select('Categoría de diálogo', 'categoryId', cats.map(c => [c.id, c.name]))}
       </div>
       <div class="mb-3">
         <label class="field-label" for="f_post_content">Contenido</label>
         <textarea id="f_post_content" name="content" class="form-control" rows="5" required maxlength="3000" placeholder="Comparte tu experiencia, observación o pregunta detallada..."></textarea>
       </div>`,
      'Publicar en la Asamblea',
      'md',
      'Nueva publicación comunitaria'
    );
  }

  async function forumPostDetailModal(postId) {
    const data = await request(`/api/foro/publicaciones/${encodeURIComponent(postId)}`);
    const p = data.post;
    const isAuthor = p.authorId === state.user?.id;
    const isAdmin = state.user?.role === 'ADMINISTRADOR';

    const commentsHtml = p.comments?.length ? p.comments.map(c => `
      <div class="p-2 mb-2 rounded border bg-paper kp-comment-item">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="d-flex align-items-center gap-2">
            <span class="avatar-circle" style="width:24px;height:24px;font-size:10px">${e(initial(c.author.name))}</span>
            <strong style="font-size:12px">${e(c.author.name)}</strong>
            <span class="tiny-note text-muted">(${e(LEVELS[c.author.level] || c.author.level)})</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="tiny-note text-muted">${shortDate(c.createdAt)}</span>
            ${(c.authorId === state.user?.id || isAdmin) ? `<button type="button" class="btn btn-sm btn-link text-danger p-0" data-action="delete-forum-comment" data-id="${e(c.id)}" data-pid="${e(p.id)}" title="Eliminar">${icon('trash')}</button>` : ''}
          </div>
        </div>
        <p class="small mb-0 text-break">${e(c.content)}</p>
      </div>
    `).join('') : '<p class="small text-muted text-center p-3">Aún no hay comentarios. Inicia el diálogo abajo.</p>';

    const html = `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
          <span class="badge bg-forest">${e(p.category.name)}</span>
          <span class="tiny-note text-muted">${shortDate(p.createdAt)}</span>
        </div>
        <h3 class="mb-2" style="font-size:18px">${e(p.title)}</h3>
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="avatar-circle" style="width:28px;height:28px;font-size:11px">${e(initial(p.author.name))}</span>
          <span class="small">Por <strong>${e(p.author.name)}</strong> · ${e(LEVELS[p.author.level] || p.author.level)}</span>
        </div>
        <div class="p-3 rounded bg-light border mb-4 text-break" style="font-size:14px;white-space:pre-wrap">${e(p.content)}</div>

        <h4 class="mb-2" style="font-size:15px">${icon('chat-left-dots')} Respuestas y aportes (${p.comments?.length || 0})</h4>
        <div class="mb-3">${commentsHtml}</div>

        <form id="forumCommentForm" data-form="forum-comment" class="pt-2 border-top">
          <input type="hidden" name="postId" value="${e(p.id)}">
          <label class="field-label" for="f_comment_content">Tu aporte o respuesta</label>
          <textarea id="f_comment_content" name="content" class="form-control mb-2" rows="2" required maxlength="1500" placeholder="Escribe un comentario constructivo..."></textarea>
          <div class="text-end">
            <button type="submit" class="btn btn-sm btn-forest">${icon('send')} Enviar comentario</button>
          </div>
        </form>
      </div>
    `;

    const footerHtml = `
      <div class="d-flex justify-content-between w-100 align-items-center">
        <div>
          ${(isAuthor || isAdmin) ? `<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-forum-post" data-id="${e(p.id)}">${icon('trash')} Eliminar publicación</button>` : ''}
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary px-3" data-bs-dismiss="modal">Cerrar</button>
      </div>
    `;

    showModal(p.title, html, { size: 'lg', subtitle: 'La Asamblea Comunitaria', footerHtml });
  }

  function warehouseItemModal(cid) {
    form(
      'warehouse-item',
      `<input type="hidden" name="communityId" value="${e(cid)}">
       <div class="mb-3">
         ${field('Nombre del insumo', 'name', 'text', 'required maxlength="120" placeholder="Ej.: Azadón andino, Semillas de Manzanilla, Compost maduro"')}
       </div>
       <div class="mb-3">
         ${select('Categoría de insumo', 'category', Object.entries(INVENTORY_CATEGORIES))}
       </div>
       <div class="row g-2 mb-3">
         <div class="col-6">
           ${field('Cantidad inicial', 'quantity', 'number', 'min="0" step="0.1" value="0" required')}
         </div>
         <div class="col-6">
           ${field('Unidad de medida', 'unit', 'text', 'required placeholder="Ej.: unidades, kg, sobres, litros"')}
         </div>
       </div>
       <div class="mb-3">
         ${field('Stock mínimo de alerta', 'minQuantity', 'number', 'min="0" step="0.1" value="5" required')}
       </div>
       <div class="mb-3">
         ${field('Ubicación física en bodega', 'location', 'text', 'placeholder="Ej.: Estantería A, Gaveta 3"')}
       </div>
       <div class="mb-3">
         <label class="field-label" for="f_item_desc">Descripción u origen</label>
         <textarea id="f_item_desc" name="description" class="form-control" rows="2" maxlength="400" placeholder="Ej.: Donación comunitaria o producción local..."></textarea>
       </div>`,
      'Guardar insumo',
      'md',
      'Nuevo insumo en El Resguardo'
    );
  }

  function warehouseMovementModal(itemId, itemName, unit, currentQty) {
    const cid = state.warehouseCommunityId;
    form(
      'warehouse-movement',
      `<input type="hidden" name="communityId" value="${e(cid)}">
       <input type="hidden" name="itemId" value="${e(itemId)}">
       <div class="p-2 mb-3 rounded bg-light border">
         <span class="tiny-note text-muted d-block">Insumo</span>
         <strong>${e(itemName)}</strong> · Stock disponible actual: <strong class="text-forest">${fmt(currentQty)} ${e(unit)}</strong>
       </div>
       <div class="mb-3">
         ${select('Tipo de movimiento', 'type', [['ENTRADA', 'Entrada / Adquisición / Cosecha'], ['SALIDA', 'Salida / Uso en huerto / Distribución'], ['AJUSTE', 'Ajuste por conteo físico']], 'SALIDA')}
       </div>
       <div class="mb-3">
         ${field(`Cantidad a registrar (${e(unit)})`, 'quantity', 'number', 'min="0.01" step="0.01" required')}
       </div>
       <div class="mb-3">
         ${field('Motivo o labor asociada', 'reason', 'text', 'required maxlength="300" placeholder="Ej.: Aplicación en parcelas A1-A4 o siembra comunitaria"')}
       </div>`,
      'Registrar movimiento',
      'md',
      'Movimiento de inventario'
    );
  }

  function dryingBatchModal(cid) {
    form(
      'drying-batch',
      `<input type="hidden" name="communityId" value="${e(cid)}">
       <div class="mb-3">
         ${select('Especie botánica recolectada', 'plantId', state.plants.map(p => [p.id, `${p.commonName} (${p.scientific})`]))}
       </div>
       <div class="row g-2 mb-3">
         <div class="col-6">
           ${field('Fecha de recolección', 'harvestDate', 'date', `value="${new Date().toISOString().slice(0, 10)}" required`)}
         </div>
         <div class="col-6">
           ${field('Peso fresco inicial (g)', 'initialWeightGrams', 'number', 'min="1" step="1" required placeholder="Ej.: 1200"')}
         </div>
       </div>
       <div class="mb-3">
         ${field('Condiciones de secado', 'conditions', 'text', 'value="Sombra, ventilación natural andina, 18-22°C" required')}
       </div>
       <div class="mb-3">
         <label class="field-label" for="f_dry_notes">Notas del lote</label>
         <textarea id="f_dry_notes" name="notes" class="form-control" rows="2" maxlength="400" placeholder="Ej.: Recolección matutina sin rocío, sumidades seleccionadas..."></textarea>
       </div>`,
      'Crear lote de secado',
      'md',
      'Registro de secado postcosecha'
    );
  }

  function finishDryingBatchModal(id) {
    form(
      'finish-drying',
      `<input type="hidden" name="id" value="${e(id)}">
       <div class="mb-3">
         ${field('Peso seco final obtenido (g)', 'dryWeightGrams', 'number', 'min="0.1" step="0.1" required placeholder="Ej.: 240.5"')}
       </div>
       <div class="mb-3">
         <label class="field-label" for="f_finish_notes">Observaciones finales de calidad</label>
         <textarea id="f_finish_notes" name="notes" class="form-control" rows="2" maxlength="400" placeholder="Ej.: Aroma intenso, coloración verde oliva óptima, listo para fraccionamiento en 100g."></textarea>
       </div>`,
      'Finalizar secado y archivar',
      'sm',
      'Finalizar proceso de secado'
    );
  }

  async function traceabilityLabelModal(batchId, cid) {
    const data = await request(`/api/comunidades/${encodeURIComponent(cid)}/bodega/secados/${encodeURIComponent(batchId)}/etiqueta`);
    const l = data.label;

    const html = `
      <div class="kp-trace-label-100g p-4 border rounded-3 bg-white text-dark shadow-sm" style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #17281e;">
        <div class="text-center border-bottom pb-2 mb-3">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #2d5a3e; font-weight: bold;">Kawsapacha · Tierra & Comunidad</div>
          <h2 style="font-size: 22px; margin: 4px 0 2px 0; color: #173d31;">${e(l.product)}</h2>
          <div style="font-size: 13px; font-style: italic; color: #555;">${e(l.scientific)}</div>
          <div style="font-size: 11px; color: #666; margin-top: 2px;">Parte: ${e(l.harvestPart)}</div>
        </div>

        <div class="row g-2 mb-3" style="font-size: 12px;">
          <div class="col-6">
            <span style="color:#777; display:block; font-size:10px; text-transform:uppercase;">Número de Lote</span>
            <strong style="font-family:monospace; font-size:13px;">${e(l.lotNumber)}</strong>
          </div>
          <div class="col-6 text-end">
            <span style="color:#777; display:block; font-size:10px; text-transform:uppercase;">Contenido Neto</span>
            <strong style="font-size:15px; color:#173d31;">${e(l.netWeight)}</strong>
          </div>
          <div class="col-6">
            <span style="color:#777; display:block; font-size:10px; text-transform:uppercase;">Fecha Cosecha</span>
            <strong>${e(l.harvestDate)}</strong>
          </div>
          <div class="col-6 text-end">
            <span style="color:#777; display:block; font-size:10px; text-transform:uppercase;">Envasado / Secado</span>
            <strong>${e(l.packingDate)}</strong>
          </div>
          <div class="col-6">
            <span style="color:#777; display:block; font-size:10px; text-transform:uppercase;">Consumo Preferente</span>
            <strong>${e(l.expiryDate)}</strong>
          </div>
          <div class="col-6 text-end">
            <span style="color:#777; display:block; font-size:10px; text-transform:uppercase;">Origen</span>
            <strong>${e(l.parish)}, ${e(l.province)}</strong>
          </div>
        </div>

        <div class="p-2 rounded bg-light border mb-3" style="font-size: 11px; line-height: 1.4;">
          <strong>Conservación:</strong> ${e(l.conditions)}<br>
          <strong>Comunidad custodia:</strong> ${e(l.communityName)}<br>
          <strong>Responsable técnico:</strong> ${e(l.responsible)}
        </div>

        <div class="text-center pt-2 border-top" style="font-size: 10px; color: #666;">
          <div>${e(l.standard)}</div>
          <div style="font-family:monospace; font-size:9px; color:#999; margin-top:2px;">${e(l.qrPayload)}</div>
        </div>
      </div>
    `;

    showModal(
      `Etiqueta de trazabilidad · ${l.product} 100g`,
      html,
      {
        size: 'md',
        subtitle: `Lote ${l.lotNumber}`,
        footerHtml: `
          <button type="button" class="btn btn-outline-secondary btn-sm px-3" data-bs-dismiss="modal">Cerrar</button>
          <button type="button" class="btn btn-forest btn-sm px-3" data-action="print-label">${icon('printer')} Imprimir etiqueta</button>
        `
      }
    );
  }

  function activityModal(cropId, defaultTask = null) {
    const c = state.gardenDetail?.garden.crops.find(x => x.id === cropId);
    const gardenIrrigation = state.gardenDetail?.garden.irrigation || 'GOTEO';
    const initTask = defaultTask || 'RIEGO';

    openWizardModal({
      key: 'activity',
      icon: 'droplet',
      title: 'Registrar labor agrícola',
      subtitle: `${c?.plant.commonName || 'Cultivo'} · Casilla ${c?.cell || ''}`,
      submitLabel: 'Enviar evidencia',
      extraHiddenHtml: `<input type="hidden" name="cropId" value="${e(cropId)}">`,
      steps: [
        {
          stepId: 'task-select',
          title: 'Labor agrícola y parámetros',
          subtitle: 'Tipo de labor y especificaciones agronómicas',
          html: `
            <div class="kp-parcel-context-bar mb-3">
              <span>${icon('flower2')} <strong>${e(c?.plant.commonName || 'Cultivo')}</strong></span>
              <span>${icon('geo-alt')} Casilla <strong>${e(c?.cell || '')}</strong></span>
            </div>
            <div class="d-grid gap-3">
              ${select('Labor agrícola', 'task', ['PREPARACION', 'SIEMBRA', 'RIEGO', 'CUIDADO', 'COSECHA'], initTask)}

              <div id="irrigationWrap" style="${initTask === 'RIEGO' ? '' : 'display:none'}">
                ${select('Tipo de riego aplicado', 'irrigationType', [
                  ['RIO', 'Río (Superficial por gravedad o bombeo)'],
                  ['CANAL', 'Canal o acequia comunitaria'],
                  ['GOTEO', 'Goteo (Localizado por mangueras)'],
                  ['AGUA_POTABLE', 'Agua potable (Red pública o doméstica)'],
                  ['MANUAL', 'Manual (Regadera)'],
                  ['ASPERSION', 'Aspersión giratoria']
                ], gardenIrrigation)}
                <div class="tiny-note text-muted mt-1">${icon('info-circle')} El riego responde a la necesidad hídrica de la planta y la disponibilidad de agua en el huerto.</div>
              </div>

              <div id="harvestWrap" style="${initTask === 'COSECHA' ? '' : 'display:none'}">
                <div class="mb-2">
                  <label class="field-label" for="f_harvestPart">Parte recolectada</label>
                  <input type="text" id="f_harvestPart" name="harvestPart" class="form-control" placeholder="Ej.: Hojas tiernas, sumidades floridas, raíz fresca" value="${e(c?.plant.harvestPart || '')}">
                </div>
                <div class="row g-2">
                  <div class="col-7">
                    <label class="field-label" for="f_harvestQuantity">Cantidad recolectada</label>
                    <input type="number" id="f_harvestQuantity" name="harvestQuantity" class="form-control" step="0.1" min="0.1" placeholder="Ej.: 250">
                  </div>
                  <div class="col-5">
                    ${select('Unidad', 'harvestUnit', [['g', 'Gramos (g)'], ['kg', 'Kilogramos (kg)'], ['lb', 'Libras (lb)'], ['atados', 'Atados'], ['unidades', 'Unidades']], 'g')}
                  </div>
                </div>
                <div class="p-2 rounded-3 bg-light border small mt-2">
                  <strong class="text-forest">${icon('moon-stars')} Consejo lunar MSP 2017:</strong>
                  <span>Partes aéreas en luna creciente/llena; raíces y semillas en luna menguante.</span>
                </div>
              </div>
            </div>`
        },
        {
          stepId: 'notes',
          title: 'Bitácora y observaciones',
          subtitle: 'Describe detalladamente la labor realizada',
          html: `
            <div class="mb-3">
              <label class="field-label" for="activityNote">Descripción de la labor (requerido)</label>
              <textarea id="activityNote" class="form-control" name="note" rows="4" required maxlength="600" placeholder="Ej.: Riego matutino por goteo o deshierbe cuidadoso de malezas alrededor de la raíz..."></textarea>
            </div>
            <div class="p-2 bg-paper border rounded-3 small text-muted">
              ${icon('info-circle')} Especifica herramientas empleadas, estado del follaje o condiciones climáticas del momento.
            </div>`
        },
        {
          stepId: 'photo',
          title: 'Evidencia fotográfica y envío',
          subtitle: 'Adjunta una fotografía real de la labor',
          html: `
            <div class="mb-3">
              <label class="field-label" for="activityPhoto">Fotografía real de evidencia (JPG/PNG, máx. 5 MB)</label>
              <input class="form-control" id="activityPhoto" name="photo" type="file" accept="image/png,image/jpeg" capture="environment" required>
              <div id="activityPhotoPreview" class="mt-2 d-none text-center p-2 bg-light border rounded-3">
                <img src="" alt="Vista previa de evidencia" class="modal-photo-preview border rounded-3" style="max-height: 190px; object-fit: contain;">
              </div>
            </div>
            <div class="p-2 bg-light border rounded-3 small text-muted">
              ${icon('shield-check')} La evidencia quedará en estado <strong>Pendiente</strong> hasta la certificación técnica de un administrador o maestro.
            </div>`
        }
      ],
      onInit: (modalEl, formEl) => {
        const taskSelect = formEl.querySelector('#f_task');
        if (taskSelect) {
          taskSelect.addEventListener('change', () => {
            const t = taskSelect.value;
            const irr = formEl.querySelector('#irrigationWrap');
            const har = formEl.querySelector('#harvestWrap');
            if (irr) irr.style.display = t === 'RIEGO' ? '' : 'none';
            if (har) har.style.display = t === 'COSECHA' ? '' : 'none';
          });
        }
        const inp = formEl.querySelector('#activityPhoto');
        const wrap = formEl.querySelector('#activityPhotoPreview');
        const img = wrap?.querySelector('img');
        if (inp && wrap && img) {
          inp.addEventListener('change', () => {
            const f = inp.files?.[0];
            if (!f) {
              wrap.classList.add('d-none');
              return;
            }
            const url = window.URL?.createObjectURL(f);
            if (url) {
              img.src = url;
              wrap.classList.remove('d-none');
            }
          });
        }
      }
    });
  }

  function editActivityModal(id, task, note) {
    form(
      'edit-activity',
      `<input type="hidden" name="id" value="${e(id)}">
       <p class="modal-intro mb-3">Corrige los datos de tu actividad pendiente antes de ser revisada.</p>
       <div class="d-grid gap-3">
         ${select('Labor agrícola', 'task', ['PREPARACION', 'SIEMBRA', 'RIEGO', 'CUIDADO', 'COSECHA'], task)}
         <div>
           <label class="field-label" for="editActivityNote">Descripción de la labor</label>
           <textarea id="editActivityNote" class="form-control" name="note" rows="3" required maxlength="600">${e(note)}</textarea>
         </div>
       </div>`,
      'Guardar corrección',
      'sm',
      'Editar actividad pendiente'
    );
  }

  function plantModal(id) {
    const p = state.plants.find(x => x.id === id);
    const editing = Boolean(p);
    const initImg = p?.imageUrl || '';
    const initThumb = p?.imageThumbUrl || initImg;

    openWizardModal({
      key: 'plant',
      icon: 'flower2',
      title: editing ? 'Editar ficha botánica' : 'Nueva planta del catálogo',
      subtitle: p?.commonName || 'Registro de especie medicinal andina',
      submitLabel: editing ? 'Guardar cambios' : 'Registrar planta',
      extraHiddenHtml: `
        <input type="hidden" name="id" value="${e(id || '')}">
        <input type="hidden" name="imageThumbUrl" id="f_plant_imageThumbUrl" value="${e(p?.imageThumbUrl || '')}">`,
      steps: [
        {
          stepId: 'taxonomy',
          title: 'Identificación botánica',
          subtitle: 'Taxonomía, nombres y cualidad térmica',
          html: `
            <div class="form-grid">
              ${field('Nombre común', 'commonName', 'text', `required value="${e(p?.commonName || '')}"`)}
              ${field('Nombre científico', 'scientific', 'text', `required value="${e(p?.scientific || '')}"`)}
              ${field('Familia botánica', 'family', 'text', `value="${e(p?.family || '')}"`)}
              ${select('Cualidad térmica', 'thermal', ['FRIA', 'CALIENTE'], p?.thermal || 'FRIA')}
              ${select('Ciclo', 'cycle', ['CORTO', 'LARGO'], p?.cycle || 'CORTO')}
              ${field('Altitud mínima (m)', 'minAltitude', 'number', `value="${e(p?.minAltitude ?? '')}"`)}
              ${field('Altitud máxima (m)', 'maxAltitude', 'number', `value="${e(p?.maxAltitude ?? '')}"`)}
            </div>
            <div class="mt-3">
              <label class="field-label">Suelos compatibles</label>
              <div class="d-flex gap-3 flex-wrap">
                ${SOILS.map(s => `<label class="form-check-label small"><input class="form-check-input me-1" type="checkbox" name="soils" value="${s}" ${p?.soils.some(x => x.soil === s) ? 'checked' : ''}> ${e(cap(s))}</label>`).join('')}
              </div>
            </div>`
        },
        {
          stepId: 'uses-harvest',
          title: 'Usos tradicionales y cosecha',
          subtitle: 'Propiedades y Norma Técnica MSP 2017',
          html: `
            <div class="form-grid mb-2">
              <div>
                <label class="field-label">Usos medicinales tradicionales</label>
                <textarea name="uses" class="form-control" rows="2" placeholder="Propiedades curativas andinas...">${e(p?.uses || '')}</textarea>
              </div>
              <div>
                <label class="field-label">Precauciones y contraindicaciones</label>
                <textarea name="cautions" class="form-control" rows="2" placeholder="Advertencias o restricciones de consumo...">${e(p?.cautions || '')}</textarea>
              </div>
            </div>
            <div class="form-grid mb-2">
              ${field('Parte recolectada (MSP 2017)', 'harvestPart', 'text', `placeholder="Ej.: Lígulas y cabezuelas florales abiertas" value="${e(p?.harvestPart || '')}"`)}
              ${field('Etapa / momento propicio', 'harvestStage', 'text', `placeholder="Ej.: Floración abierta temprana" value="${e(p?.harvestStage || '')}"`)}
            </div>
            <div>
              <label class="field-label">Notas agrícolas y botánicas</label>
              <textarea name="botanicalNotes" class="form-control" rows="2" placeholder="Observaciones de cultivo...">${e(p?.botanicalNotes || '')}</textarea>
            </div>`
        },
        {
          stepId: 'photo',
          title: 'Fotografía botánica y verificación',
          subtitle: 'Imagen real para identificación de la especie',
          html: `
            <div class="kp-dropzone mb-3" id="plantPhotoDropzone">
              <input type="file" id="plantPhotoFileInput" accept="image/png,image/jpeg,image/webp" class="visually-hidden">
              <div class="kp-dropzone-preview" id="plantPhotoPreviewBox">
                ${initThumb
                  ? `<img src="${e(initThumb)}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="Vista previa">`
                  : `<span class="kp-dropzone-empty-icon">${icon('cloud-arrow-up')}</span>`}
              </div>
              <div class="kp-dropzone-body">
                <strong class="d-block small">Fotografía botánica real (JPG, PNG, WebP · máx. 6 MB)</strong>
                <span class="tiny-note d-block mb-2" id="plantPhotoMeta">${initImg ? `Imagen activa: ${e(initImg)}` : 'Arrastra aquí tu fotografía o selecciónala desde tu equipo / cámara.'}</span>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                  <button type="button" class="btn btn-sm btn-success" id="plantPhotoPickBtn">${icon('upload')} ${initImg ? 'Reemplazar imagen' : 'Seleccionar fotografía'}</button>
                  <button type="button" class="btn btn-sm btn-outline-danger ${initImg ? '' : 'd-none'}" id="plantPhotoRemoveBtn">${icon('trash')} Quitar</button>
                  <label class="form-check-label tiny-note ms-1">
                    <input type="checkbox" class="form-check-input me-1" id="plantPhotoRemoveBg"> Suavizar fondo claro
                  </label>
                </div>
                <div class="progress mt-2 d-none" id="plantUploadProgressWrap" style="height:7px">
                  <div class="progress-bar bg-success" id="plantUploadProgressBar" role="progressbar" style="width:0%"></div>
                </div>
                <div class="small text-danger mt-1 d-none" id="plantUploadError"></div>
              </div>
            </div>

            <div class="form-grid mb-2">
              ${select('O elegir recorte local', 'localImagePreset', LOCAL_PLANT_ASSETS, isLocalCutout(initImg) ? initImg : '', 'localPlantAssetSelect')}
              ${field('Ruta /uploads/..., /assets/... o URL', 'imageUrl', 'text', `value="${e(initImg)}"`)}
            </div>
            <div class="form-grid mb-2">
              ${field('Autor de la fotografía', 'imageAttribution', 'text', `value="${e(p?.imageAttribution || '')}"`)}
              ${field('Licencia de la imagen', 'imageLicense', 'text', `value="${e(p?.imageLicense || '')}"`)}
            </div>
            <div class="mt-2">
              <label class="form-check-label">
                <input type="checkbox" class="form-check-input me-1" name="verified" ${p?.verified ? 'checked' : ''}> Marcar ficha como validada oficialmente
              </label>
            </div>`
        }
      ],
      onInit: (modalEl, formEl) => {
        const preset = formEl.querySelector('#localPlantAssetSelect');
        const urlInput = formEl.querySelector('#f_imageUrl');
        const thumbInput = formEl.querySelector('#f_plant_imageThumbUrl');
        const dropzone = formEl.querySelector('#plantPhotoDropzone');
        const fileInput = formEl.querySelector('#plantPhotoFileInput');
        const pickBtn = formEl.querySelector('#plantPhotoPickBtn');
        const removeBtn = formEl.querySelector('#plantPhotoRemoveBtn');
        const previewBox = formEl.querySelector('#plantPhotoPreviewBox');
        const metaEl = formEl.querySelector('#plantPhotoMeta');
        const progWrap = formEl.querySelector('#plantUploadProgressWrap');
        const progBar = formEl.querySelector('#plantUploadProgressBar');
        const errEl = formEl.querySelector('#plantUploadError');
        const removeBgChk = formEl.querySelector('#plantPhotoRemoveBg');

        const setPreview = (src, labelText) => {
          if (!previewBox) return;
          previewBox.innerHTML = src
            ? `<img src="${e(src)}" data-fallback-src="/assets/plants/planta-fallback.svg" alt="Vista previa">`
            : `<span class="kp-dropzone-empty-icon">${icon('cloud-arrow-up')}</span>`;
          if (metaEl && labelText) metaEl.textContent = labelText;
          if (removeBtn) removeBtn.classList.toggle('d-none', !src);
          if (pickBtn) pickBtn.innerHTML = `${icon('upload')} ${src ? 'Reemplazar imagen' : 'Seleccionar fotografía'}`;
        };

        const uploadPlantFile = (file) => {
          if (!file) return;
          if (errEl) errEl.classList.add('d-none');
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            if (errEl) {
              errEl.textContent = 'Formato no válido. Usa JPG, PNG o WebP.';
              errEl.classList.remove('d-none');
            }
            return;
          }
          if (file.size > 6 * 1024 * 1024) {
            if (errEl) {
              errEl.textContent = 'La fotografía supera el límite de 6 MB.';
              errEl.classList.remove('d-none');
            }
            return;
          }

          const localBlob = window.URL?.createObjectURL(file);
          if (localBlob) setPreview(localBlob, `Subiendo ${file.name}...`);
          if (progWrap && progBar) {
            progWrap.classList.remove('d-none');
            progBar.style.width = '8%';
          }

          const fd = new FormData();
          fd.append('image', file);
          if (removeBgChk?.checked) fd.append('removeLightBg', 'true');

          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/plantas/imagen', true);
          xhr.withCredentials = true;
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable && progBar) {
              const pct = Math.max(10, Math.min(96, Math.round((ev.loaded / ev.total) * 100)));
              progBar.style.width = `${pct}%`;
            }
          };
          xhr.onload = () => {
            if (localBlob) window.URL?.revokeObjectURL(localBlob);
            if (progWrap) progWrap.classList.add('d-none');
            let json = {};
            try { json = JSON.parse(xhr.responseText); } catch {}
            if (xhr.status >= 200 && xhr.status < 300 && json.imageUrl) {
              if (urlInput) urlInput.value = json.imageUrl;
              if (thumbInput) thumbInput.value = json.imageThumbUrl || json.imageUrl;
              if (preset) preset.value = '';
              setPreview(json.imageThumbUrl || json.imageUrl, `Lista: ${json.width}×${json.height}px (${Math.round((json.size || 0) / 1024)} KB)`);
              toast('Fotografía botánica optimizada y guardada.');
            } else {
              setPreview(urlInput?.value || '', 'Error al subir fotografía.');
              if (errEl) {
                errEl.textContent = json.error || 'No se pudo procesar la fotografía en el servidor.';
                errEl.classList.remove('d-none');
              }
            }
          };
          xhr.onerror = () => {
            if (localBlob) window.URL?.revokeObjectURL(localBlob);
            if (progWrap) progWrap.classList.add('d-none');
            if (errEl) {
              errEl.textContent = 'Error de conexión al subir la fotografía.';
              errEl.classList.remove('d-none');
            }
          };
          xhr.send(fd);
        };

        pickBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', () => uploadPlantFile(fileInput.files?.[0]));
        removeBtn?.addEventListener('click', () => {
          if (urlInput) urlInput.value = '';
          if (thumbInput) thumbInput.value = '';
          if (preset) preset.value = '';
          if (fileInput) fileInput.value = '';
          setPreview('', 'Imagen retirada. Arrastra una fotografía o selecciona un archivo.');
        });

        if (dropzone) {
          ['dragenter', 'dragover'].forEach(evt => {
            dropzone.addEventListener(evt, ev => {
              ev.preventDefault();
              dropzone.classList.add('is-dragover');
            });
          });
          ['dragleave', 'drop'].forEach(evt => {
            dropzone.addEventListener(evt, ev => {
              ev.preventDefault();
              dropzone.classList.remove('is-dragover');
            });
          });
          dropzone.addEventListener('drop', ev => {
            const f = ev.dataTransfer?.files?.[0];
            if (f) uploadPlantFile(f);
          });
        }

        if (preset && urlInput) {
          preset.addEventListener('change', () => {
            if (preset.value) {
              urlInput.value = preset.value;
              if (thumbInput) thumbInput.value = '';
              setPreview(preset.value, `Recurso seleccionado: ${preset.value}`);
            }
          });
        }
        urlInput?.addEventListener('change', () => {
          if (thumbInput) thumbInput.value = '';
          setPreview(urlInput.value.trim(), urlInput.value.trim() ? `Origen: ${urlInput.value.trim()}` : 'Sin imagen asignada.');
        });
      }
    });
  }

  function reviewModal(id, type) {
    form(
      type,
      `<input type="hidden" name="id" value="${e(id)}">
       <p class="modal-intro mb-3">Detalla el motivo técnico para registrar la corrección requerida en la bitácora.</p>
       <div>
         <label class="field-label" for="reviewReasonInput">Observación técnica</label>
         <textarea id="reviewReasonInput" name="reason" class="form-control" required maxlength="500" rows="3" placeholder="Explica qué aspecto requiere corrección..."></textarea>
       </div>`,
      'Registrar observación',
      'sm',
      type === 'observe-garden' ? 'Observar huerto' : 'Rechazar evidencia'
    );
  }

  async function creditsModal() {
    if (!state.attributions) {
      state.attributions = await fetch('/assets/ATTRIBUTION.json').then(r => r.json()).catch(() => ({}));
    }
    const items = Object.entries(state.attributions || {});
    showModal(
      'Créditos y licencias de imágenes',
      `<p class="modal-intro">Las fotografías botánicas de especies reales provienen de Wikimedia Commons bajo licencias libres (CC0, CC BY, CC BY-SA). Las imágenes de terreno y paisaje marcadas como generadas son representaciones visuales del sistema y nunca se usan como evidencia agrícola de usuarios.</p>
       <div class="list-group">
         ${items.map(([k, v]) => `
           <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
             <div>
               <strong>${e(cap(k))}</strong> · <small class="text-muted">${e(v.wikimediaTitle)}</small>
               <div class="small">Autor: <strong>${e(v.artist)}</strong> · Licencia: <span class="badge bg-success-subtle text-success">${e(v.license)}</span></div>
             </div>
             ${v.sourceUrl ? `<a class="btn btn-sm btn-outline-secondary" href="${e(v.sourceUrl)}" target="_blank" rel="noopener">Fuente</a>` : ''}
           </div>
         `).join('')}
       </div>`,
      true
    );
  }

  function legalModal() {
    showModal(
      'Alcance V1 y aviso informativo',
      `<p class="small"><strong>Kawsapacha — Tierra & Comunidad</strong> es una plataforma de gestión comunitaria de huertos medicinales con espejo digital 2D, bitácora fotográfica y gamificación justa.</p>
       <ul class="small">
         <li>La información etnobotánica mostrada sin sello de validación oficial figura explícitamente como <em>Pendiente de validación</em> y no constituye prescripción clínica.</li>
         <li>Las fases del calendario lunar andino son una referencia cultural orientativa calculada por ciclo sinódico.</li>
         <li>Esta aplicación no exhibe logotipos institucionales no autorizados ni declara aval gubernamental externo.</li>
       </ul>`
    );
  }

  async function action(el) {
    const type = el.dataset.action;
    const id = el.dataset.id;

    switch (type) {
      case 'toggle-menu':
        $('#sidebar')?.classList.toggle('open');
        $('#mobileBackdrop')?.classList.toggle('active');
        break;
      case 'toggle-theme': {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('kawsapacha_theme', next);
        document.querySelectorAll('.theme-toggle').forEach(x => {
          x.innerHTML = `${icon(next === 'dark' ? 'sun' : 'moon-stars')} <span>${next === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>`;
        });
        break;
      }
      case 'scroll-how':
        document.getElementById('como-funciona')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        break;
      case 'open-credits':
        await creditsModal();
        break;
      case 'open-legal':
        legalModal();
        break;
      case 'auth-login':
        authModal('login');
        break;
      case 'auth-register':
        authModal('register');
        break;
      case 'open-profile':
        profileModal();
        break;
      case 'logout':
        await post('/api/auth/logout', {});
        state.user = null;
        state.moon = null;
        go('inicio');
        toast('Sesión cerrada.');
        break;
      case 'new-community':
        communityModal();
        break;
      case 'edit-community':
        communityModal(id);
        break;
      case 'community-detail':
        communityDetailModal(id);
        break;
      case 'community-view':
        state.communityView = el.dataset.view || 'cards';
        await render();
        break;
      case 'photo-zoom':
        photoLightboxModal(el.dataset.src, el.dataset.title, el.dataset.caption);
        break;
      case 'clear-plant-filters':
        state.search = '';
        state.filter = 'TODAS';
        state.soilFilter = 'TODAS';
        state.cycleFilter = 'TODAS';
        state.verifiedFilter = 'TODAS';
        state.plantSort = 'name_asc';
        state.plantPage = 1;
        if ($('#searchPlants')) $('#searchPlants').value = '';
        if ($('#thermalFilter')) $('#thermalFilter').value = 'TODAS';
        if ($('#soilCatalogFilter')) $('#soilCatalogFilter').value = 'TODAS';
        if ($('#cycleCatalogFilter')) $('#cycleCatalogFilter').value = 'TODAS';
        if ($('#verifiedCatalogFilter')) $('#verifiedCatalogFilter').value = 'TODAS';
        if ($('#sortPlants')) $('#sortPlants').value = 'name_asc';
        if ($('#plantResults')) $('#plantResults').innerHTML = plantResults();
        break;
      case 'invite-member':
        inviteModal(id);
        break;
      case 'manage-members':
      case 'view-members':
        membersModal(id);
        break;
      case 'edit-member-permissions':
        editMemberPermissionsModal(el.dataset.cid, el.dataset.mid, el.dataset.name, JSON.parse(el.dataset.perms || '[]'));
        break;
      case 'remove-member':
        confirmActionModal({
          title: 'Retirar integrante',
          message: `¿Confirmas retirar a "${el.dataset.name}" de la comunidad? Perderá sus permisos asignados.`,
          confirmLabel: 'Retirar',
          onConfirm: async () => {
            await request(`/api/comunidades/${encodeURIComponent(el.dataset.cid)}/miembros/${encodeURIComponent(el.dataset.mid)}`, { method: 'DELETE' });
            toast(`Se ha retirado a ${el.dataset.name} de la comunidad.`);
            membersModal(el.dataset.cid);
          }
        });
        break;
      case 'cancel-invitation':
        await request(`/api/comunidades/${encodeURIComponent(el.dataset.cid)}/invitaciones/${encodeURIComponent(el.dataset.invid)}`, { method: 'DELETE' });
        toast('Invitación cancelada.');
        membersModal(el.dataset.cid);
        break;
      case 'open-pending-invitations':
        pendingInvitationsModal();
        break;
      case 'respond-invitation':
        await post(`/api/invitaciones/${encodeURIComponent(id)}/responder`, { action: el.dataset.response }, 'PATCH');
        toast(el.dataset.response === 'ACEPTAR' ? '¡Te has unido a la comunidad!' : 'Invitación rechazada.');
        closeModal();
        await render();
        break;
      case 'delete-community':
        confirmActionModal({
          title: 'Eliminar comunidad',
          message: '¿Confirmas eliminar esta comunidad junto con sus huertos e historial asociado? Esta acción no se puede deshacer.',
          confirmLabel: 'Eliminar comunidad',
          onConfirm: async () => {
            await request(`/api/comunidades/${encodeURIComponent(id)}`, { method: 'DELETE' });
            closeModal();
            toast('Comunidad eliminada.');
            await render();
          }
        });
        break;
      case 'new-garden':
        gardenModal();
        break;
      case 'edit-garden':
        gardenModal(id);
        break;
      case 'open-garden':
        go('huerto', id);
        break;
      case 'grid-view':
        state.gridFilter.view = el.dataset.view;
        refreshGardenGridMount();
        break;
      case 'reset-grid-filters':
        state.gridFilter = { ...state.gridFilter, row: 'TODAS', col: 'TODAS', q: '', plant: 'TODAS', stage: 'TODAS', thermal: 'TODAS', occupancy: 'TODAS' };
        if ($('#gridSearchInput')) $('#gridSearchInput').value = '';
        $$('[data-grid-filter]').forEach(sel => {
          if (sel.dataset.gridFilter !== 'zoom') sel.value = 'TODAS';
        });
        refreshGardenGridMount();
        break;
      case 'new-crop':
        cropModal(el.dataset.cell);
        break;
      case 'delete-crop':
        confirmActionModal({
          title: 'Liberar casilla',
          message: '¿Deseas retirar este cultivo y dejar libre la parcela? Solo está permitido cuando no existen evidencias aprobadas.',
          confirmLabel: 'Liberar casilla',
          onConfirm: async () => {
            await request(`/api/huertos/${encodeURIComponent(el.dataset.gid)}/cultivos/${encodeURIComponent(id)}`, { method: 'DELETE' });
            closeModal();
            toast('Casilla liberada.');
            await render();
          }
        });
        break;
      case 'scroll-log':
        document.getElementById('garden-log')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        break;
      case 'crop-detail':
        cropDetailModal(id);
        break;
      case 'plant-detail':
        plantDetailModal(id);
        break;
      case 'plant-page':
        state.plantPage = Number(el.dataset.page) || 1;
        $('#plantResults').innerHTML = plantResults();
        break;
      case 'new-activity':
        activityModal(id, el.dataset.defaultTask);
        break;
      case 'edit-activity':
        editActivityModal(id, el.dataset.task, el.dataset.note);
        break;
      case 'activity-tab':
        state.activityTab = el.dataset.tab;
        await render();
        break;
      case 'new-plant':
        plantModal();
        break;
      case 'edit-plant':
        plantModal(id);
        break;
      case 'approve-garden':
        await post(`/api/huertos/${encodeURIComponent(id)}/validar-msp`, { status: 'ACTIVO' }, 'PATCH');
        toast('Huerto habilitado y validado.');
        await render();
        break;
      case 'observe-garden':
        reviewModal(id, 'observe-garden');
        break;
      case 'approve-activity':
        await post(`/api/actividades/${encodeURIComponent(id)}/validar-maestro`, { status: 'APROBADA' }, 'PATCH');
        toast('Evidencia aprobada y puntos acreditados.');
        await render();
        break;
      case 'reject-activity':
        reviewModal(id, 'reject-activity');
        break;
      case 'toggle-suspend': {
        const currentSuspended = el.dataset.suspended === 'true';
        await post(`/api/admin/usuarios/${encodeURIComponent(id)}/suspender`, { suspended: !currentSuspended }, 'PATCH');
        toast(currentSuspended ? 'Usuario reactivado.' : 'Usuario suspendido.');
        await render();
        break;
      }
      case 'open-talents':
        talentsModal();
        break;
      case 'open-talents-review':
        talentsReviewModal();
        break;
      case 'delete-talent':
        await request(`/api/talentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
        toast('Talento eliminado.');
        talentsModal();
        break;
      case 'certify-talent':
        await post(`/api/talentos/${encodeURIComponent(id)}/validar`, { status: 'VALIDADO' }, 'PATCH');
        toast('Saber certificado exitosamente (+25 pts).');
        talentsReviewModal();
        break;
      case 'reject-talent':
        reviewModal(id, 'reject-talent');
        break;
      case 'claim-challenge': {
        const out = await post(`/api/retos/${encodeURIComponent(id)}/reclamar`);
        toast(`¡Reto completado! +${out.pointsAwarded} pts acreditados.`);
        await render();
        break;
      }
      case 'new-challenge':
        newChallengeModal();
        break;
      case 'filter-forum-cat':
        state.forumCategoryFilter = el.dataset.cat;
        await render();
        break;
      case 'new-forum-post':
        forumPostModal();
        break;
      case 'view-forum-post':
        forumPostDetailModal(id);
        break;
      case 'delete-forum-post':
        await request(`/api/foro/publicaciones/${encodeURIComponent(id)}`, { method: 'DELETE' });
        closeModal();
        toast('Publicación eliminada.');
        await render();
        break;
      case 'delete-forum-comment':
        await request(`/api/foro/comentarios/${encodeURIComponent(id)}`, { method: 'DELETE' });
        forumPostDetailModal(el.dataset.pid);
        toast('Comentario eliminado.');
        break;
      case 'open-warehouse':
        go('bodega', id);
        break;
      case 'switch-warehouse-tab':
        state.warehouseTab = el.dataset.tab;
        await render();
        break;
      case 'new-warehouse-item':
        warehouseItemModal(el.dataset.cid || state.warehouseCommunityId);
        break;
      case 'open-item-movement':
        warehouseMovementModal(id, el.dataset.name, el.dataset.unit, Number(el.dataset.qty));
        break;
      case 'new-drying-batch':
        dryingBatchModal(el.dataset.cid || state.warehouseCommunityId);
        break;
      case 'finish-drying-batch':
        finishDryingBatchModal(id);
        break;
      case 'view-trace-label':
        traceabilityLabelModal(id, el.dataset.cid || state.warehouseCommunityId);
        break;
      case 'print-label':
        window.print();
        break;
    }
  }

  function refreshGardenGridMount() {
    const mount = $('#gardenGridMount');
    const detail = state.gardenDetail;
    if (!mount || !detail) return;
    mount.innerHTML = renderGardenGridOrTable(detail.garden, detail.canManageCrops);
    const allItems = getFilteredGardenCells(detail.garden);
    const vis = allItems.filter(x => x.visible).length;
    const countEl = $('#gridCount');
    if (countEl) countEl.textContent = `${vis} de ${allItems.length} parcelas visibles`;
    $$('[data-action="grid-view"]').forEach(btn => {
      const active = btn.dataset.view === state.gridFilter.view;
      btn.classList.toggle('btn-success', active);
      btn.classList.toggle('btn-outline-secondary', !active);
    });
  }

  async function procesarFormulario(formEl) {
    const key = formEl.dataset.form;
    const fd = new FormData(formEl);
    const v = Object.fromEntries(fd.entries());

    if (key === 'register') {
      const out = await post('/api/auth/register', v);
      state.user = out.user;
      state.moon = null;
      closeModal();
      go('resumen');
      toast('Tu cuenta está lista. Bienvenido como Aprendiz.');
      return;
    }
    if (key === 'login') {
      const out = await post('/api/auth/login', v);
      state.user = out.user;
      state.moon = null;
      closeModal();
      go('resumen');
      toast('Bienvenido de nuevo a Kawsapacha.');
      return;
    }
    if (key === 'profile') {
      if (!v.newPassword) {
        delete v.newPassword;
        delete v.currentPassword;
      }
      const out = await post('/api/me', v, 'PATCH');
      state.user = out.user;
      closeModal();
      await render();
      toast('Perfil actualizado.');
      return;
    }
    if (key === 'community') {
      if (v.id) {
        await post(`/api/comunidades/${encodeURIComponent(v.id)}`, v, 'PATCH');
        closeModal();
        await render();
        toast('Comunidad actualizada.');
      } else {
        await post('/api/comunidades', v);
        closeModal();
        await render();
        toast('Comunidad creada correctamente. Eres su propietario.');
      }
      return;
    }
    if (key === 'invite-member') {
      await post(`/api/comunidades/${encodeURIComponent(v.communityId)}/invitaciones`, {
        email: v.email,
        preset: v.preset,
        permissions: fd.getAll('permissions')
      });
      closeModal();
      toast('Invitación enviada correctamente.');
      membersModal(v.communityId);
      return;
    }
    if (key === 'update-member-permissions') {
      await post(`/api/comunidades/${encodeURIComponent(v.communityId)}/miembros/${encodeURIComponent(v.memberId)}/permisos`, {
        permissions: fd.getAll('permissions')
      }, 'PATCH');
      toast('Permisos actualizados correctamente.');
      membersModal(v.communityId);
      return;
    }
    if (key === 'garden') {
      if (v.id) {
        await post(`/api/huertos/${encodeURIComponent(v.id)}`, v, 'PATCH');
        closeModal();
        await render();
        toast('Configuración del huerto actualizada.');
      } else {
        await post('/api/huertos', v);
        closeModal();
        await render();
        toast('Huerto registrado y listo para organizar cultivos.');
      }
      return;
    }
    if (key === 'crop') {
      await post(`/api/huertos/${encodeURIComponent(v.gardenId)}/cultivos`, v);
      closeModal();
      await render();
      toast('Cultivo asignado a la parcela.');
      return;
    }
    if (key === 'activity') {
      if (fd.get('task') !== 'COSECHA') {
        fd.delete('harvestPart');
        fd.delete('harvestQuantity');
        fd.delete('harvestUnit');
      }
      if (fd.get('task') !== 'RIEGO') {
        fd.delete('irrigationType');
      }
      await request(`/api/cultivos/${encodeURIComponent(v.cropId)}/actividades`, { method: 'POST', body: fd });
      closeModal();
      await render();
      toast('Evidencia fotográfica enviada para validación.');
      return;
    }
    if (key === 'edit-activity') {
      await post(`/api/actividades/${encodeURIComponent(v.id)}`, { task: v.task, note: v.note }, 'PATCH');
      toast('Actividad pendiente actualizada.');
    }
    if (key === 'plant') {
      const payload = { ...v, soils: fd.getAll('soils'), verified: fd.has('verified') };
      if (v.id) {
        await post(`/api/plantas/${encodeURIComponent(v.id)}`, payload, 'PUT');
        closeModal();
        await render();
        toast('Ficha botánica actualizada.');
      } else {
        await post('/api/plantas', payload);
        closeModal();
        await render();
        toast('Planta registrada en el catálogo.');
      }
      return;
    }
    if (key === 'observe-garden') {
      await post(`/api/huertos/${encodeURIComponent(v.id)}/validar-msp`, { status: 'OBSERVADO', observations: v.reason }, 'PATCH');
      toast('Se registró la observación del huerto.');
    }
    if (key === 'reject-activity') {
      await post(`/api/actividades/${encodeURIComponent(v.id)}/validar-maestro`, { status: 'RECHAZADA', reviewNote: v.reason }, 'PATCH');
      toast('Evidencia rechazada con observación técnica.');
    }
    if (key === 'declare-talent') {
      await post('/api/talentos', v);
      toast('Saber tradicional registrado para certificación.');
      talentsModal();
      return;
    }
    if (key === 'reject-talent') {
      await post(`/api/talentos/${encodeURIComponent(v.id)}/validar`, { status: 'RECHAZADO', reviewNote: v.reason }, 'PATCH');
      toast('Talento marcado como no certificado.');
      closeModal();
      talentsReviewModal();
      return;
    }
    if (key === 'forum-post') {
      await post('/api/foro/publicaciones', v);
      closeModal();
      toast('Publicación compartida en la Asamblea.');
      await render();
      return;
    }
    if (key === 'forum-comment') {
      await post(`/api/foro/publicaciones/${encodeURIComponent(v.postId)}/comentarios`, { content: v.content });
      forumPostDetailModal(v.postId);
      toast('Comentario agregado.');
      return;
    }
    if (key === 'warehouse-item') {
      await post(`/api/comunidades/${encodeURIComponent(v.communityId)}/bodega/items`, v);
      closeModal();
      toast('Insumo guardado en El Resguardo.');
      await render();
      return;
    }
    if (key === 'warehouse-movement') {
      await post(`/api/comunidades/${encodeURIComponent(v.communityId)}/bodega/items/${encodeURIComponent(v.itemId)}/movimiento`, v);
      closeModal();
      toast('Movimiento registrado en inventario.');
      await render();
      return;
    }
    if (key === 'drying-batch') {
      await post(`/api/comunidades/${encodeURIComponent(v.communityId)}/bodega/secados`, v);
      closeModal();
      toast('Lote de secado postcosecha registrado.');
      await render();
      return;
    }
    if (key === 'finish-drying') {
      await post(`/api/comunidades/${encodeURIComponent(state.warehouseCommunityId)}/bodega/secados/${encodeURIComponent(v.id)}`, {
        status: 'FINALIZADO',
        dryWeightGrams: v.dryWeightGrams,
        notes: v.notes
      }, 'PATCH');
      closeModal();
      toast('Secado finalizado con éxito.');
      await render();
      return;
    }
    if (key === 'new-challenge') {
      await post('/api/admin/retos', v);
      closeModal();
      toast('Reto agroecológico creado.');
      await render();
      return;
    }

    closeModal();
    await render();
  }
  const submit = procesarFormulario;

  // Event Listeners
  document.addEventListener('click', async ev => {
    const n = ev.target.closest('[data-action],[data-nav]');
    if (!n) return;
    if (n.tagName === 'A') ev.preventDefault();
    try {
      if (n.dataset.nav) {
        go(n.dataset.nav);
        $('#sidebar')?.classList.remove('open');
        $('#mobileBackdrop')?.classList.remove('active');
      } else {
        await action(n);
      }
    } catch (err) {
      console.error(err);
      toast(err.message, false);
    }
  });

  document.addEventListener('submit', async ev => {
    const f = ev.target.closest('[data-form]');
    if (!f) return;
    ev.preventDefault();
    const btn = f.querySelector('button[type=submit]') || (f.id ? document.querySelector(`button[type=submit][form="${CSS.escape(f.id)}"]`) : null);
    if (btn) {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `${icon('hourglass-split')} Procesando...`;
    }
    try {
      await procesarFormulario(f);
    } catch (err) {
      console.error(err);
      toast(err.message, false);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.original;
      }
    }
  });

  // Fallback seguro compatible con CSP para imágenes que fallen al cargar
  document.addEventListener('error', ev => {
    const img = ev.target;
    if (img && img.tagName === 'IMG' && img.dataset.fallbackSrc && img.dataset.fallbackApplied !== '1') {
      img.dataset.fallbackApplied = '1';
      img.src = img.dataset.fallbackSrc;
    }
  }, true);

  document.addEventListener('input', ev => {
    if (ev.target.id === 'searchPlants') {
      state.search = ev.target.value;
      state.plantPage = 1;
      const target = $('#plantResults');
      if (target) target.innerHTML = plantResults();
    }
    if (ev.target.id === 'searchGardens') {
      state.gardenSearch = ev.target.value;
      const target = $('#gardensResults');
      if (target) target.innerHTML = gardensResultsHtml();
    }
    if (ev.target.id === 'rankSearchInput') {
      state.rankSearch = ev.target.value;
      const target = $('#rankingResults');
      if (target) target.innerHTML = rankingResultsHtml();
    }
    if (ev.target.id === 'gridSearchInput') {
      state.gridFilter.q = ev.target.value;
      refreshGardenGridMount();
    }
    if (ev.target.matches('.wave-input')) {
      const message = ev.target.parentElement.querySelector('.field-message');
      if (message) message.textContent = ev.target.validity.valid ? '' : ev.target.validationMessage;
    }
  });

  document.addEventListener('invalid', ev => {
    const input = ev.target;
    if (!input.matches('.wave-input')) return;
    const message = input.parentElement.querySelector('.field-message');
    if (message) message.textContent = input.validationMessage;
  }, true);

  document.addEventListener('change', ev => {
    if (ev.target.dataset.gridFilter) {
      state.gridFilter[ev.target.dataset.gridFilter] = ev.target.value;
      refreshGardenGridMount();
    }
    if (ev.target.id === 'gardenStatusFilter') {
      state.gardenStatusFilter = ev.target.value;
      const target = $('#gardensResults');
      if (target) target.innerHTML = gardensResultsHtml();
    }
    if (ev.target.id === 'gardenSoilFilter') {
      state.gardenSoilFilter = ev.target.value;
      const target = $('#gardensResults');
      if (target) target.innerHTML = gardensResultsHtml();
    }
    if (ev.target.id === 'rankTypeFilter') {
      state.rankTypeFilter = ev.target.value;
      const target = $('#rankingResults');
      if (target) target.innerHTML = rankingResultsHtml();
    }
    if (['thermalFilter', 'soilCatalogFilter', 'cycleCatalogFilter', 'verifiedCatalogFilter', 'sortPlants'].includes(ev.target.id)) {
      if (ev.target.id === 'thermalFilter') state.filter = ev.target.value;
      if (ev.target.id === 'soilCatalogFilter') state.soilFilter = ev.target.value;
      if (ev.target.id === 'cycleCatalogFilter') state.cycleFilter = ev.target.value;
      if (ev.target.id === 'verifiedCatalogFilter') state.verifiedFilter = ev.target.value;
      if (ev.target.id === 'sortPlants') state.plantSort = ev.target.value;
      state.plantPage = 1;
      const target = $('#plantResults');
      if (target) target.innerHTML = plantResults();
    }
    if (ev.target.name === 'task') {
      const section = $('#harvestWrap');
      if (section) section.style.display = ev.target.value === 'COSECHA' ? 'block' : 'none';
    }
  });

  window.addEventListener('hashchange', () => render().catch(err => toast(err.message, false)));

  // Carga inicial
  (async () => {
    try {
      const [meData, moonData] = await Promise.all([request('/api/me'), request('/api/reloj-lunar/actual')]);
      state.user = meData.user;
      state.moon = moonData.moon;
      state.moonPhases = moonData.phases || [];
      state.moonUpcoming = moonData.upcoming || [];
      await render();
    } catch (err) {
      console.error(err);
      app.innerHTML = `
        <main class="first-load">
          <div class="brand-mark">${icon('exclamation-circle')}</div>
          <strong>No se pudo cargar Kawsapacha</strong>
          <p>${e(err.message)}</p>
          <button class="btn-forest" onclick="location.reload()">Reintentar</button>
        </main>`;
    }
  })();
})();
