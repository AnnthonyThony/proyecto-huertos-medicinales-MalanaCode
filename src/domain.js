const SOILS = ['ARCILLOSO', 'LIMOSO', 'ARENOSO', 'MARGOSO', 'GREDOSO', 'PANTANOSO'];
const TASKS = ['PREPARACION', 'SIEMBRA', 'RIEGO', 'CUIDADO', 'COSECHA'];
const MAX_GARDEN_ROWS = 20;
const MAX_GARDEN_COLS = 20;
const MAX_GARDEN_CELLS = 160;

// Sistema de tipos de riego (4 opciones visibles oficiales + compatibilidad hacia atrás)
const IRRIGATION_TYPES = {
  RIO: { id: 'RIO', label: 'Río', source: 'SUPERFICIAL', method: 'GRAVEDAD', desc: 'Agua de río captada por pendiente natural o bombeo' },
  CANAL: { id: 'CANAL', label: 'Canal', source: 'CANAL_ACEQUIA', method: 'GRAVEDAD', desc: 'Canal o acequia comunitaria de riego' },
  GOTEO: { id: 'GOTEO', label: 'Goteo', source: 'SISTEMA_PRESURIZADO', method: 'LOCALIZADO', desc: 'Riego localizado por mangueras con goteros ahorradores' },
  AGUA_POTABLE: { id: 'AGUA_POTABLE', label: 'Agua potable', source: 'RED_PUBLICA', method: 'MANUAL_ASPERSIÓN', desc: 'Red pública de agua tratada o doméstica' },
  // Compatibilidad con huertos históricos
  MANUAL: { id: 'MANUAL', label: 'Manual', source: 'DIVERSA', method: 'MANUAL', desc: 'Aplicación manual con regadera o manguera' },
  ASPERSION: { id: 'ASPERSION', label: 'Aspersión', source: 'SISTEMA_PRESURIZADO', method: 'ASPERSIÓN', desc: 'Aspersores giratorios' }
};
const VALID_IRRIGATION = Object.keys(IRRIGATION_TYPES);

// Módulos V2: Categorías y estados
const TALENT_CATEGORIES = {
  SIEMBRA: 'Siembra y propagación vegetal',
  PREPARACION_SUELO: 'Preparación de suelo y compostaje',
  PLANTAS_MEDICINALES: 'Manejo e identificación de plantas medicinales',
  RECOLECCION: 'Recolección, cosecha y secado',
  COMPOSTAJE: 'Abonos orgánicos y biopreparados',
  SABERES_ANCESTRALES: 'Saberes tradicionales y cosmovisión andina'
};

const TALENT_STATUSES = ['DECLARADO', 'PENDIENTE', 'VALIDADO', 'RECHAZADO'];

const CHALLENGE_CATEGORIES = ['ACTIVIDADES', 'RIEGO', 'COSECHA', 'CUIDADO', 'COMUNIDAD'];
const CHALLENGE_TARGET_TYPES = ['ACTIVITIES_APPROVED', 'CROPS_PLANTED', 'IRRIGATION_LOGGED', 'HARVEST_LOGGED'];

const INVENTORY_CATEGORIES = {
  HERRAMIENTAS: 'Herramientas y Equipamiento',
  SEMILLAS: 'Semillas y Material Genético',
  ABONOS: 'Abonos y Biopreparados'
};

const INVENTORY_MOVEMENT_TYPES = ['ENTRADA', 'SALIDA', 'AJUSTE'];
const DRYING_STATUSES = ['EN_SECADO', 'FINALIZADO', 'DESCARTADO'];

const MOON = [
  { id: 'YANA_KILLA', name: 'Yana Killa', subtitle: 'Luna oscura', advice: 'Preparación y abonado de la tierra' },
  { id: 'WINAK_KILLA', name: 'Wiñak Killa', subtitle: 'Luna creciente', advice: 'Fase favorable para la siembra' },
  { id: 'PURA_KILLA', name: 'Pura Killa', subtitle: 'Luna llena', advice: 'Fase favorable para la siembra y algunas cosechas' },
  { id: 'WANUK_KILLA', name: 'Wañuk Killa', subtitle: 'Luna menguante', advice: 'Cosecha de raíces y semillas' }
];

// Permisos granulares de comunidad (11 permisos oficiales)
const PERMISSIONS = {
  VIEW_COMMUNITY: { id: 'VIEW_COMMUNITY', name: 'Ver comunidad', category: 'General', desc: 'Consultar información básica y estado de la comunidad' },
  VIEW_GARDENS: { id: 'VIEW_GARDENS', name: 'Ver huertos', category: 'Huertos', desc: 'Acceder y visualizar los huertos medicinales asociados' },
  CREATE_GARDENS: { id: 'CREATE_GARDENS', name: 'Crear huertos', category: 'Huertos', desc: 'Registrar nuevos huertos dentro de la comunidad' },
  EDIT_GARDENS: { id: 'EDIT_GARDENS', name: 'Editar huertos', category: 'Huertos', desc: 'Modificar configuración física y agronómica de huertos existentes' },
  MANAGE_CROPS: { id: 'MANAGE_CROPS', name: 'Gestionar cultivos', category: 'Cultivos', desc: 'Organizar casillas en la cuadrícula virtual 2D, asociar y rotar plantas' },
  REGISTER_ACTIVITIES: { id: 'REGISTER_ACTIVITIES', name: 'Registrar actividades', category: 'Bitácora', desc: 'Registrar labores agrícolas en la bitácora del cultivo' },
  UPLOAD_EVIDENCE: { id: 'UPLOAD_EVIDENCE', name: 'Subir evidencias', category: 'Bitácora', desc: 'Adjuntar fotografías de respaldo en las labores agrícolas' },
  VIEW_LOGS: { id: 'VIEW_LOGS', name: 'Ver bitácora', category: 'Bitácora', desc: 'Consultar historial y reportes de actividades agrícolas' },
  EDIT_OWN_ACTIVITIES: { id: 'EDIT_OWN_ACTIVITIES', name: 'Editar actividades propias', category: 'Bitácora', desc: 'Modificar observaciones de sus labores antes de ser validadas' },
  VIEW_MEMBERS: { id: 'VIEW_MEMBERS', name: 'Ver integrantes', category: 'Comunidad', desc: 'Consultar el listado de miembros participantes' },
  VIEW_STATS: { id: 'VIEW_STATS', name: 'Ver estadísticas', category: 'Métricas', desc: 'Acceder a métricas de rendimiento y avance del huerto' }
};

const ALL_PERMISSIONS = Object.keys(PERMISSIONS);

// Perfiles predefinidos de invitación
const PRESET_PROFILES = {
  READ_ONLY: {
    id: 'READ_ONLY',
    name: 'Solo lectura',
    desc: 'Permite consultar la comunidad, huertos, bitácora y estadísticas sin realizar modificaciones.',
    permissions: ['VIEW_COMMUNITY', 'VIEW_GARDENS', 'VIEW_LOGS', 'VIEW_MEMBERS', 'VIEW_STATS']
  },
  AGRICULTURAL_COLLABORATOR: {
    id: 'AGRICULTURAL_COLLABORATOR',
    name: 'Colaborador agrícola',
    desc: 'Permite registrar labores agrícolas diarias, subir fotos y editar actividades propias pendientes.',
    permissions: ['VIEW_COMMUNITY', 'VIEW_GARDENS', 'VIEW_LOGS', 'VIEW_MEMBERS', 'VIEW_STATS', 'REGISTER_ACTIVITIES', 'UPLOAD_EVIDENCE', 'EDIT_OWN_ACTIVITIES']
  },
  ADVANCED_COLLABORATOR: {
    id: 'ADVANCED_COLLABORATOR',
    name: 'Colaborador avanzado',
    desc: 'Permite crear y configurar huertos, organizar casillas y cultivos, además de todas las labores agrícolas.',
    permissions: ['VIEW_COMMUNITY', 'VIEW_GARDENS', 'VIEW_LOGS', 'VIEW_MEMBERS', 'VIEW_STATS', 'CREATE_GARDENS', 'EDIT_GARDENS', 'MANAGE_CROPS', 'REGISTER_ACTIVITIES', 'UPLOAD_EVIDENCE', 'EDIT_OWN_ACTIVITIES']
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Personalizado',
    desc: 'Permite configurar manualmente cualquier combinación de los 11 permisos.',
    permissions: []
  }
};

function tienePermiso(permisosMiembro, permiso) {
  if (!Array.isArray(permisosMiembro)) return false;
  return permisosMiembro.includes(permiso);
}

// Estimación sinódica de la fase lunar para orientación cultural agrícola andina (no reemplaza efemérides oficiales).
function faseLunar(fecha = new Date()) {
  const referencia = Date.UTC(2000, 0, 6, 18, 14, 0);
  const duracionDia = 86400000;
  const edadLunar = ((((fecha.getTime() - referencia) / duracionDia) % 29.530588853) + 29.530588853) % 29.530588853;
  const fraccion = edadLunar / 29.530588853;
  const indice = fraccion < 0.125 || fraccion >= 0.875 ? 0 : fraccion < 0.375 ? 1 : fraccion < 0.625 ? 2 : 3;
  return { ...MOON[indice], ageDays: Math.round(edadLunar * 10) / 10, approximation: true };
}

// Evaluación de concordancia entre labor agrícola, parte botánica aprovechada (MSP 2017) y ciclo lunar andino.
function evaluarFaseLunar(labor, idFase, parteCosecha = '') {
  if (labor === 'PREPARACION') return idFase === 'YANA_KILLA';
  if (labor === 'SIEMBRA') return idFase === 'WINAK_KILLA' || idFase === 'PURA_KILLA';
  if (labor === 'COSECHA') {
    const parte = String(parteCosecha).toUpperCase();
    if (parte.includes('RAIZ') || parte.includes('RAÍZ') || parte.includes('TUBERCULO') || parte.includes('TUBÉRCULO') || parte.includes('SEMILLA') || parte === 'RAICES_SEMILLAS') {
      return idFase === 'WANUK_KILLA';
    }
    return idFase === 'WINAK_KILLA' || idFase === 'PURA_KILLA';
  }
  return false;
}

function nivelSegunPuntos(puntos) {
  return puntos >= 300 ? 'MAESTRO' : puntos >= 100 ? 'OFICIAL' : 'APRENDIZ';
}

function puntajeRanking(puntosOtorgados, cultivosActivos) {
  return cultivosActivos > 0 ? Math.round((puntosOtorgados / cultivosActivos) * 100) / 100 : 0;
}

function proximasFasesLunares(dias = 8, inicio = new Date()) {
  const resultado = [];
  for (let i = 0; i < dias; i++) {
    const dt = new Date(inicio.getTime() + i * 86400000);
    const fase = faseLunar(dt);
    resultado.push({
      date: dt.toISOString().slice(0, 10),
      ...fase
    });
  }
  return resultado;
}

module.exports = {
  SOILS,
  TASKS,
  MAX_GARDEN_ROWS,
  MAX_GARDEN_COLS,
  MAX_GARDEN_CELLS,
  IRRIGATION_TYPES,
  VALID_IRRIGATION,
  TALENT_CATEGORIES,
  TALENT_STATUSES,
  CHALLENGE_CATEGORIES,
  CHALLENGE_TARGET_TYPES,
  INVENTORY_CATEGORIES,
  INVENTORY_MOVEMENT_TYPES,
  DRYING_STATUSES,
  MOON,
  PERMISSIONS,
  ALL_PERMISSIONS,
  PRESET_PROFILES,
  tienePermiso,
  hasPermission: tienePermiso,
  faseLunar,
  moonPhase: faseLunar,
  proximasFasesLunares,
  moonUpcoming: proximasFasesLunares,
  evaluarFaseLunar,
  evaluateLunar: evaluarFaseLunar,
  nivelSegunPuntos,
  levelForPoints: nivelSegunPuntos,
  puntajeRanking,
  rankingScore: puntajeRanking
};
