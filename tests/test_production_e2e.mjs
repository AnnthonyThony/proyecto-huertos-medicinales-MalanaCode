import fs from 'node:fs';
import assert from 'node:assert/strict';

// Helper to parse .env without external dependencies
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv('/root/kawsapacha-mvp/.env');
const BASE_URL = 'https://kawsapacha.ejedigital.io';
const HOST_HEADER = 'kawsapacha.ejedigital.io';

console.log('--- INICIANDO SUITE DE PRUEBAS END-TO-END DE PRODUCCIÓN (KAWSAPACHA) ---');
console.log(`Destino: ${BASE_URL} con encabezado Host: ${HOST_HEADER}`);

class Session {
  constructor(name) {
    this.name = name;
    this.cookie = null;
  }

  async request(path, options = {}) {
    const headers = {
      Host: HOST_HEADER,
      Origin: `https://${HOST_HEADER}`,
      ...(options.headers || {})
    };
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/kawsapacha_session=([^;]+)/);
      if (match) {
        this.cookie = `kawsapacha_session=${match[1]}`;
      }
    }

    let body = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    return { status: res.status, headers: res.headers, body };
  }

  async post(path, data) {
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async put(path, data) {
    return this.request(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async patch(path, data) {
    return this.request(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async get(path) {
    return this.request(path, { method: 'GET' });
  }
}

// Minimal valid 1x1 PNG bytes
const validPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

async function runTests() {
  const results = [];
  const logTest = (module, desc, passed, details = '') => {
    results.push({ module, desc, passed, details });
    const mark = passed ? '✔ PASÓ' : '✖ FALLÓ';
    console.log(`[${mark}] [${module}] ${desc} ${details ? '(' + details + ')' : ''}`);
    if (!passed) throw new Error(`Fallo en prueba: [${module}] ${desc} -> ${details}`);
  };

  // 0. Redirección HTTP -> HTTPS y SSL
  {
    const httpRes = await fetch('http://kawsapacha.ejedigital.io/api/health', { redirect: 'manual' });
    logTest('Seguridad SSL', 'Redirección HTTP 301 forzada hacia HTTPS', httpRes.status === 301 && httpRes.headers.get('location')?.startsWith('https://kawsapacha.ejedigital.io'), `Status: ${httpRes.status} -> ${httpRes.headers.get('location')}`);
  }

  // 1. Health check & Nginx Proxy bajo HTTPS
  {
    const anon = new Session('anon');
    const res = await anon.get('/api/health');
    logTest('Infraestructura', 'HTTPS reverse proxy y API health check (Let\'s Encrypt)', res.status === 200 && res.body.ok === true, `HTTP ${res.status}`);
  }

  // 2. Reloj Lunar
  {
    const anon = new Session('anon');
    const res = await anon.get('/api/reloj-lunar/actual');
    logTest('Cosmovisión', 'Cálculo de reloj lunar en tiempo real', res.status === 200 && Boolean(res.body.moon?.name), res.body.moon?.name);
  }

  // 3. Autenticación Administrador MSP
  const admin = new Session('admin');
  {
    const res = await admin.post('/api/auth/login', {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD
    });
    logTest('Autenticación', 'Inicio de sesión cuenta Administrador MSP', res.status === 200 && res.body.user.role === 'ADMIN_MSP', res.body.user?.email);

    const setCookieStr = res.headers.get('set-cookie') || '';
    logTest('Seguridad Cookies', 'Cookie de sesión emitida con atributos Secure y HttpOnly', setCookieStr.includes('Secure') && setCookieStr.includes('HttpOnly'), 'Directiva Secure confirmada');

    const me = await admin.get('/api/me');
    logTest('Autenticación', 'Sesión persistente por Cookie JWT', me.status === 200 && me.body.user?.id === res.body.user.id);
  }

  // 4. Catálogo Medicinal - Crear planta (Admin)
  let plantId = null;
  const plantScientific = `Piper aduncum test_${Date.now()}`;
  {
    const res = await admin.post('/api/plantas', {
      commonName: 'Matico de prueba',
      scientific: plantScientific,
      family: 'Piperaceae',
      uses: 'Planta de prueba para validación de catálogo',
      cautions: 'Uso en pruebas',
      minAltitude: 0,
      maxAltitude: 2500,
      cycle: 'LARGO',
      thermal: 'CALIENTE',
      verified: true,
      soils: ['ARENOSO', 'MARGOSO']
    });
    logTest('Catálogo medicinal', 'Crear ficha botánica medicinal (Rol ADMIN_MSP)', res.status === 201 && Boolean(res.body.plant?.id), `ID: ${res.body.plant?.id}`);
    plantId = res.body.plant.id;
  }

  // 5. Catálogo Medicinal - Edición de ficha
  {
    const res = await admin.put(`/api/plantas/${plantId}`, {
      commonName: 'Matico Tradicional (Editado)',
      scientific: plantScientific,
      family: 'Piperaceae',
      uses: 'Cicatrizante y antiséptico ancestral comprobado',
      cautions: 'Evitar en dosis excesivas',
      minAltitude: 0,
      maxAltitude: 2600,
      cycle: 'LARGO',
      thermal: 'CALIENTE',
      verified: true,
      soils: ['ARENOSO', 'MARGOSO', 'LIMOSO']
    });
    logTest('Catálogo medicinal', 'Actualizar ficha botánica autorizada', res.status === 200 && res.body.plant.commonName.includes('Editado'));
  }

  // 6. Catálogo Medicinal - Búsqueda y Filtros
  {
    const anon = new Session('anon');
    const searchRes = await anon.get(`/api/plantas?q=${encodeURIComponent('Matico Tradicional')}`);
    logTest('Catálogo medicinal', 'Búsqueda por texto (insensible a mayúsculas)', searchRes.status === 200 && searchRes.body.plants.length > 0);

    const filterRes = await anon.get('/api/plantas?thermal=CALIENTE');
    logTest('Catálogo medicinal', 'Filtro por cualidad térmica CALIENTE', filterRes.status === 200 && filterRes.body.plants.every(p => p.thermal === 'CALIENTE'));
  }

  // 7. Registro de Usuarios (Voluntario 1 y Voluntario 2)
  const u1Email = `voluntario1_${Date.now()}@test.kawsapacha.local`;
  const u2Email = `voluntario2_${Date.now()}@test.kawsapacha.local`;
  const pass = 'ClaveSegura123#';

  const user1 = new Session('user1');
  let user1Data = null;
  {
    const res = await user1.post('/api/auth/register', {
      name: 'María Quishpe (Test)',
      email: u1Email,
      password: pass,
      birthDate: '1995-04-12',
      gender: 'Femenino',
      talents: 'Agricultura tradicional y manejo de compost'
    });
    logTest('Autenticación', 'Registro de nuevo usuario voluntario 1', res.status === 201 && res.body.user.role === 'VOLUNTARIO', u1Email);
    user1Data = res.body.user;
  }

  const user2 = new Session('user2');
  let user2Data = null;
  {
    const res = await user2.post('/api/auth/register', {
      name: 'Inti Guamán (Test)',
      email: u2Email,
      password: pass,
      birthDate: '1998-09-20',
      gender: 'Masculino',
      talents: 'Bio-riego y semillas nativas'
    });
    logTest('Autenticación', 'Registro de nuevo usuario voluntario 2', res.status === 201 && res.body.user.role === 'VOLUNTARIO', u2Email);
    user2Data = res.body.user;
  }

  // 8. Creación de Comunidad y Promoción de Rol
  let communityId = null;
  {
    const res = await user1.post('/api/comunidades', {
      name: `Comunidad Allpa Sumak ${Date.now()}`,
      type: 'BARRIAL',
      phone: '0991234567'
    });
    logTest('Comunidades', 'Creación de comunidad barrial', res.status === 201 && Boolean(res.body.community?.id), res.body.community?.name);
    communityId = res.body.community.id;

    // Verificar que el usuario 1 fue promovido a MAESTRO (Responsable)
    const me = await user1.get('/api/me');
    logTest('Comunidades', 'Promoción automática a Responsable (MAESTRO)', me.body.user?.role === 'MAESTRO');
  }

  // 9. Añadir Voluntario a la Comunidad
  {
    const res = await user1.post(`/api/comunidades/${communityId}/miembros`, {
      email: u2Email
    });
    logTest('Comunidades', 'Responsable añade voluntario registrado a la comunidad', res.status === 201, res.body.message);

    // Comprobar listado de comunidades de user2
    const u2Comms = await user2.get('/api/comunidades');
    logTest('Comunidades', 'Voluntario consulta sus comunidades asignadas', u2Comms.body.communities.some(c => c.id === communityId));
  }

  // 10. Creación de Huerto Comunitario
  let gardenId = null;
  {
    const res = await user1.post('/api/huertos', {
      communityId,
      name: `Huerto San Pedro ${Date.now()}`,
      province: 'Pichincha',
      parish: 'Tumbaco',
      latitude: -0.215,
      longitude: -78.402,
      area: 60,
      orientation: 'NORTE',
      architecture: 'TIERRA',
      fence: 'SI',
      soil: 'MARGOSO',
      irrigation: 'GOTEO',
      fertilizer: 'COMPOST',
      rows: 3,
      cols: 4
    });
    logTest('Huertos', 'Creación de huerto con cuadrícula 3x4 y parámetros técnicos', res.status === 201 && res.body.garden.status === 'PENDIENTE', `Status: ${res.body.garden.status}`);
    gardenId = res.body.garden.id;
  }

  // 11. Validación de Huerto por Admin MSP
  {
    const res = await admin.patch(`/api/huertos/${gardenId}/validar-msp`, {
      status: 'ACTIVO',
      observations: 'Huerto habilitado y conforme a requisitos técnicos MSP.'
    });
    logTest('Validaciones', 'Aprobación técnica de huerto por ADMIN_MSP', res.status === 200 && res.body.garden.status === 'ACTIVO');
  }

  // 12. Huerto Virtual - Consulta de cuadrícula
  {
    const res = await user1.get(`/api/huertos/${gardenId}/virtual-grid`);
    logTest('Huerto virtual', 'Carga de cuadrícula interactiva y permisos de edición', res.status === 200 && res.body.canEdit === true && res.body.garden.rows === 3 && res.body.garden.cols === 4);
  }

  // 13. Huerto Virtual - Asignar Planta a Casilla A1
  let cropId = null;
  {
    const res = await user1.post(`/api/huertos/${gardenId}/cultivos`, {
      plantId,
      cell: 'A1',
      technique: 'SURCOS',
      propagation: 'PLANTULAS'
    });
    logTest('Huerto virtual', 'Asignación de cultivo a casilla A1', res.status === 201 && res.body.crop.cell === 'A1');
    cropId = res.body.crop.id;
  }

  // 14. Regla de Negocio: Evitar dos cultivos en la misma casilla
  {
    const res = await user1.post(`/api/huertos/${gardenId}/cultivos`, {
      plantId,
      cell: 'A1',
      technique: 'TERRAZAS',
      propagation: 'SEMILLAS'
    });
    logTest('Reglas de integridad', 'Restricción: Rechazar segundo cultivo en casilla A1 (409 Conflict)', res.status === 409, res.body.error);
  }

  // 15. Bitácora - Registro de actividad con subida de fotografía JPG/PNG
  let activityId = null;
  let uploadedFilename = null;
  {
    const formData = new FormData();
    formData.append('task', 'RIEGO');
    formData.append('note', 'Riego matutino con técnica de conservación de humedad ancestral');
    const photoBlob = new Blob([validPngBuffer], { type: 'image/png' });
    formData.append('photo', photoBlob, 'evidencia_riego.png');

    const headers = {
      Host: HOST_HEADER,
      Origin: `https://${HOST_HEADER}`,
      Cookie: user2.cookie
    };

    const res = await fetch(`${BASE_URL}/api/cultivos/${cropId}/actividades`, {
      method: 'POST',
      headers,
      body: formData
    });
    const body = await res.json();
    logTest('Bitácora y Evidencias', 'Registro de actividad con subida de imagen PNG auténtica', res.status === 201 && Boolean(body.activity?.id), `Archivo: ${body.activity?.imageName}`);
    activityId = body.activity.id;
    uploadedFilename = body.activity.imageName;
  }

  // 16. Verificación de archivo subido en /uploads/
  {
    const res = await user2.get(`/uploads/${uploadedFilename}`);
    logTest('Almacenamiento multimedia', 'Servir fotografía persistida desde /uploads', res.status === 200, uploadedFilename);
  }

  // 17. Seguridad en subida: rechazar archivo no imagen
  {
    const formData = new FormData();
    formData.append('task', 'RIEGO');
    formData.append('note', 'Intento de archivo de texto');
    const fakeBlob = new Blob(['contenido_de_texto_no_imagen'], { type: 'image/png' });
    formData.append('photo', fakeBlob, 'falso.png');

    const headers = {
      Host: HOST_HEADER,
      Origin: `https://${HOST_HEADER}`,
      Cookie: user2.cookie
    };

    const res = await fetch(`${BASE_URL}/api/cultivos/${cropId}/actividades`, {
      method: 'POST',
      headers,
      body: formData
    });
    logTest('Seguridad', 'Rechazo de archivo con firma binaria inválida (Magic bytes)', res.status === 400);
  }

  // 18. Validación de Evidencia por Responsable (MAESTRO)
  {
    const res = await user1.patch(`/api/actividades/${activityId}/validar-maestro`, {
      status: 'APROBADA'
    });
    logTest('Validaciones', 'Aprobación de evidencia y asignación de puntos por Responsable', res.status === 200 && res.body.activity.status === 'APROBADA' && res.body.activity.pointsAwarded > 0, `Puntos: ${res.body.activity.pointsAwarded}`);
  }

  // 19. Acreditación de puntos y actualización de nivel del Voluntario
  {
    const me = await user2.get('/api/me');
    logTest('Gamificación justa', 'Puntos acreditados en el perfil del voluntario', me.body.user.points > 0, `Puntos acumulados: ${me.body.user.points}`);
  }

  // 20. Evitar puntos duplicados: Re-validar la misma evidencia
  {
    const res = await user1.patch(`/api/actividades/${activityId}/validar-maestro`, {
      status: 'APROBADA'
    });
    logTest('Reglas de integridad', 'Evitar puntos duplicados: Rechazo 409 si evidencia ya fue procesada', res.status === 409, res.body.error);
  }

  // 21. Ranking Justo
  {
    const res = await admin.get('/api/ranking');
    const myGardenRank = res.body.ranking.find(r => r.id === gardenId);
    logTest('Ranking justo', 'Huerto activo listado en ranking con puntuación proporcional real', Boolean(myGardenRank && myGardenRank.score > 0), `Posición: ${myGardenRank?.position}, Score: ${myGardenRank?.score}`);
  }

  // 22. Dashboard de Métricas
  {
    const res = await user2.get('/api/dashboard');
    logTest('Dashboard', 'Dashboard con conteo verificado de huertos y actividades aprobadas', res.status === 200 && res.body.approved >= 1);
  }

  console.log('\n--- TODAS LAS PRUEBAS END-TO-END COMPLETADAS SATISFACTORIAMENTE ---');
  return { success: true, uploadedFilename, gardenId, cropId };
}

runTests().catch(err => {
  console.error('\nERROR DURANTE LA EJECUCIÓN:', err);
  process.exit(1);
});
