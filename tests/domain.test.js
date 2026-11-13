const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ALL_PERMISSIONS,
  PRESET_PROFILES,
  IRRIGATION_TYPES,
  VALID_IRRIGATION,
  TALENT_CATEGORIES,
  TALENT_STATUSES,
  INVENTORY_CATEGORIES,
  hasPermission,
  tienePermiso,
  moonPhase,
  faseLunar,
  moonUpcoming,
  proximasFasesLunares,
  evaluateLunar,
  evaluarFaseLunar,
  levelForPoints,
  nivelSegunPuntos,
  rankingScore,
  puntajeRanking
} = require('../src/domain');

test('el reloj genera una de las cuatro fases', () =>
  assert.ok(['YANA_KILLA', 'WINAK_KILLA', 'PURA_KILLA', 'WANUK_KILLA'].includes(moonPhase(new Date('2026-11-13')).id)));

test('recomendación de siembra en luna creciente', () => {
  assert.equal(evaluateLunar('SIEMBRA', 'WINAK_KILLA'), true);
  assert.equal(evaluateLunar('SIEMBRA', 'YANA_KILLA'), false);
});

test('cosecha de raíces en menguante y partes aéreas en creciente/llena', () => {
  assert.equal(evaluateLunar('COSECHA', 'WANUK_KILLA', 'RAICES_SEMILLAS'), true);
  assert.equal(evaluateLunar('COSECHA', 'WINAK_KILLA', 'PARTES_AEREAS'), true);
  assert.equal(evaluateLunar('PREPARACION', 'YANA_KILLA'), true);
});

test('próximas fases lunares devuelve serie ordenada de días', () => {
  const days = moonUpcoming(8, new Date('2026-11-12T12:00:00Z'));
  assert.equal(days.length, 8);
  assert.equal(days[0].date, '2026-11-12');
  assert.equal(days[7].date, '2026-11-19');
  for (const d of days) {
    assert.ok(['YANA_KILLA', 'WINAK_KILLA', 'PURA_KILLA', 'WANUK_KILLA'].includes(d.id));
    assert.equal(d.approximation, true);
  }
});

test('permisos granulares y perfiles predefinidos coherentes', () => {
  assert.equal(ALL_PERMISSIONS.length, 11);
  assert.equal(hasPermission(PRESET_PROFILES.READ_ONLY.permissions, 'VIEW_GARDENS'), true);
  assert.equal(hasPermission(PRESET_PROFILES.READ_ONLY.permissions, 'MANAGE_CROPS'), false);
  assert.equal(hasPermission(PRESET_PROFILES.AGRICULTURAL_COLLABORATOR.permissions, 'REGISTER_ACTIVITIES'), true);
  assert.equal(hasPermission(PRESET_PROFILES.ADVANCED_COLLABORATOR.permissions, 'EDIT_GARDENS'), true);
  assert.equal(hasPermission(null, 'VIEW_COMMUNITY'), false);
});

test('umbrales de niveles', () => {
  assert.equal(levelForPoints(0), 'APRENDIZ');
  assert.equal(levelForPoints(99), 'APRENDIZ');
  assert.equal(levelForPoints(100), 'OFICIAL');
  assert.equal(levelForPoints(300), 'MAESTRO');
});

test('ranking proporcional', () => {
  assert.equal(rankingScore(50, 5), 10);
  assert.equal(rankingScore(0, 0), 0);
});

test('sistema de tipos de riego contiene 4 opciones oficiales y compatibilidad', () => {
  assert.ok(VALID_IRRIGATION.includes('RIO'));
  assert.ok(VALID_IRRIGATION.includes('CANAL'));
  assert.ok(VALID_IRRIGATION.includes('GOTEO'));
  assert.ok(VALID_IRRIGATION.includes('AGUA_POTABLE'));
  assert.ok(VALID_IRRIGATION.includes('MANUAL'));
  assert.ok(VALID_IRRIGATION.includes('ASPERSION'));
  assert.equal(IRRIGATION_TYPES.RIO.label, 'Río');
  assert.equal(IRRIGATION_TYPES.CANAL.label, 'Canal');
  assert.equal(IRRIGATION_TYPES.GOTEO.label, 'Goteo');
  assert.equal(IRRIGATION_TYPES.AGUA_POTABLE.label, 'Agua potable');
});

test('evaluación lunar flexible con partes botánicas MSP 2017', () => {
  assert.equal(evaluateLunar('COSECHA', 'WANUK_KILLA', 'Raíz fresca'), true);
  assert.equal(evaluateLunar('COSECHA', 'WINAK_KILLA', 'Raíz fresca'), false);
  assert.equal(evaluateLunar('COSECHA', 'WINAK_KILLA', 'Hojas y flores'), true);
  assert.equal(evaluateLunar('COSECHA', 'PURA_KILLA', 'Sumidades floridas'), true);
  assert.equal(evaluateLunar('COSECHA', 'WANUK_KILLA', 'Hojas secas'), false);
});

test('categorías y estados de saberes ancestrales e inventario V2', () => {
  assert.ok(Object.keys(TALENT_CATEGORIES).includes('SIEMBRA'));
  assert.ok(Object.keys(TALENT_CATEGORIES).includes('PLANTAS_MEDICINALES'));
  assert.ok(TALENT_STATUSES.includes('DECLARADO'));
  assert.ok(TALENT_STATUSES.includes('VALIDADO'));
  assert.ok(Object.keys(INVENTORY_CATEGORIES).includes('HERRAMIENTAS'));
  assert.ok(Object.keys(INVENTORY_CATEGORIES).includes('SEMILLAS'));
  assert.ok(Object.keys(INVENTORY_CATEGORIES).includes('ABONOS'));
});

test('funciones y utilidades con nomenclatura canónica en español', () => {
  assert.equal(tienePermiso, hasPermission);
  assert.equal(faseLunar, moonPhase);
  assert.equal(evaluarFaseLunar, evaluateLunar);
  assert.equal(nivelSegunPuntos, levelForPoints);
  assert.equal(puntajeRanking, rankingScore);
  assert.equal(proximasFasesLunares, moonUpcoming);

  assert.equal(tienePermiso(PRESET_PROFILES.READ_ONLY.permissions, 'VIEW_GARDENS'), true);
  assert.equal(evaluarFaseLunar('SIEMBRA', 'WINAK_KILLA'), true);
  assert.equal(nivelSegunPuntos(350), 'MAESTRO');
  assert.equal(puntajeRanking(100, 4), 25);
});
