import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_URL || 'https://kawsapacha.ejedigital.io';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kawsapacha.ejedigital.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'xsCIiV5Z9zl7Euna';

class ApiClient {
  constructor(name) {
    this.name = name;
    this.cookie = null;
    this.user = null;
  }

  async req(endpoint, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }
    const isFormData = options.body && options.body.constructor && options.body.constructor.name === 'FormData';
    if (!isFormData && options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    headers['Origin'] = BASE_URL;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    for (const sc of setCookies) {
      const match = sc.match(/(kawsapacha_session=[^;]+)/);
      if (match) this.cookie = match[1];
    }

    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return { status: res.status, ok: res.ok, data };
  }

  async login(email, password) {
    const res = await this.req('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (res.ok) {
      this.user = res.data.user;
    }
    return res;
  }
}

async function runTests() {
  console.log(`\n===============================================================`);
  console.log(`KAWSAPACHA V2: SUITE DE PRUEBAS FUNCIONALES Y DE INTEGRACIÓN`);
  console.log(`Dominio objetivo: ${BASE_URL}`);
  console.log(`===============================================================\n`);

  const results = [];
  function record(name, pass, details = '') {
    results.push({ name, pass, details });
    console.log(`${pass ? '✔' : '✖'} [${pass ? 'PASS' : 'FAIL'}] ${name} ${details ? '(' + details + ')' : ''}`);
  }

  const admin = new ApiClient('Admin');
  const user = new ApiClient('Usuario');

  try {
    // 1. Health check
    const health = await admin.req('/api/health');
    record('API Health Check', health.status === 200 && health.data.ok === true, `status: ${health.status}`);

    // 2. Admin Login
    const adminLogin = await admin.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    record('Autenticación Administrador', adminLogin.ok && admin.user.role === 'ADMINISTRADOR', `id: ${admin.user?.id}`);

    // 3. User Login or Registration
    const testUserEmail = 'colaborador_test_v2@kawsapacha.local';
    const testUserPass = 'ClaveSegura2026*';
    let userLogin = await user.login(testUserEmail, testUserPass);
    if (!userLogin.ok) {
      // Registrar usuario de prueba
      const regRes = await user.req('/api/auth/register', {
        method: 'POST',
        body: { name: 'Colaborador V2 Test', email: testUserEmail, password: testUserPass }
      });
      userLogin = regRes;
      if (regRes.ok) user.user = regRes.data.user;
    }
    record('Autenticación Usuario Colaborador', userLogin.ok && user.user.role === 'USUARIO', `id: ${user.user?.id}`);

    // 4. Catálogo Botánico y recomendaciones MSP 2017
    const plantsRes = await admin.req('/api/plantas?limit=50');
    const hasPlants = plantsRes.ok && plantsRes.data.plants?.length >= 14;
    const samplePlant = plantsRes.data.plants?.[0];
    const hasHarvestInfo = Boolean(samplePlant?.harvestPart && samplePlant?.harvestStage);
    record('Catálogo Botánico con Datos de Recolección MSP 2017', hasPlants && hasHarvestInfo, `Especies: ${plantsRes.data.plants?.length}, Parte: ${samplePlant?.harvestPart}`);

    // 5. Comunidad de prueba para pruebas V2
    const commRes = await user.req('/api/comunidades', {
      method: 'POST',
      body: { name: `Comunidad Agrícola V2 ${Date.now()}`, type: 'FAMILIAR', description: 'Pruebas funcionales de irrigación y bodega' }
    });
    const testCommunity = commRes.data?.community;
    record('Creación de Comunidad Agrícola', commRes.status === 201 && Boolean(testCommunity?.id), `ID: ${testCommunity?.id}`);

    // 6. Huerto con nuevo sistema de irrigación (RÍO / GOTEO)
    const gardenRioRes = await user.req('/api/huertos', {
      method: 'POST',
      body: {
        communityId: testCommunity.id,
        name: `Huerto Río & Acequia ${Date.now()}`,
        province: 'Pichincha',
        parish: 'Tumbaco',
        latitude: -0.21,
        longitude: -78.4,
        area: 50,
        architecture: 'TIERRA',
        orientation: 'NORTE',
        fence: 'SI',
        soil: 'MARGOSO',
        irrigation: 'RIO',
        fertilizer: 'COMPOST',
        rows: 3,
        cols: 4
      }
    });
    const testGarden = gardenRioRes.data?.garden;
    record('Configuración de Huerto con Riego RIO', gardenRioRes.status === 201 && testGarden?.irrigation === 'RIO', `Huerto: ${testGarden?.name}`);

    // Modificar tipo de riego a GOTEO
    const gardenPatchRes = await user.req(`/api/huertos/${testGarden.id}`, {
      method: 'PATCH',
      body: { irrigation: 'GOTEO' }
    });
    record('Actualización de Riego a GOTEO', gardenPatchRes.ok && gardenPatchRes.data?.garden?.irrigation === 'GOTEO', `Irrigation: ${gardenPatchRes.data?.garden?.irrigation}`);

    // 7. Cultivo en Casilla A1
    const plantId = plantsRes.data.plants[0].id;
    const cropRes = await user.req(`/api/huertos/${testGarden.id}/cultivos`, {
      method: 'POST',
      body: {
        plantId,
        cell: 'A1',
        technique: 'SURCOS',
        propagation: 'SEMILLAS',
        notes: 'Cultivo de prueba para hidratación y cosecha'
      }
    });
    const testCrop = cropRes.data?.crop;
    record('Asociación de Cultivo en Casilla A1', cropRes.status === 201 && Boolean(testCrop?.id), `Cultivo ID: ${testCrop?.id}`);

    // 8. Grid virtual y verificación de tabla de parcelas
    const gridRes = await user.req(`/api/huertos/${testGarden.id}/virtual-grid`);
    const cropInGrid = gridRes.data?.garden?.crops?.find(c => c.cell === 'A1');
    record('Espejo Digital 2D y Persistencia de Casilla', gridRes.ok && Boolean(cropInGrid), `Cultivos: ${gridRes.data?.garden?.crops?.length}`);

    // 9. Módulo de Talentos Ancestrales
    // Declaración
    const declareTalentRes = await user.req('/api/talentos', {
      method: 'POST',
      body: {
        name: 'Manejo etnobotánico andino',
        category: 'PLANTAS_MEDICINALES',
        description: 'Identificación y preparación tradicional de infusiones medicinales',
        experience: '5 años colaborando en huertos comunitarios',
        evidenceUrl: 'https://ejedigital.io'
      }
    });
    const talent = declareTalentRes.data?.talent;
    record('Declaración de Saber Tradicional (Usuario)', declareTalentRes.status === 201 && talent?.status === 'PENDIENTE', `Talento ID: ${talent?.id}`);

    // Listar mis talentos
    const myTalents = await user.req('/api/talentos/mis-talentos');
    record('Consulta de Mis Saberes (Usuario)', myTalents.ok && myTalents.data.talents.some(t => t.id === talent.id), `Total: ${myTalents.data?.talents?.length}`);

    // Bandeja de pendientes (Admin)
    const pendingTalents = await admin.req('/api/talentos/pendientes');
    record('Bandeja de Saberes Pendientes (Admin/Maestro)', pendingTalents.ok && pendingTalents.data.talents.some(t => t.id === talent.id), `Pendientes: ${pendingTalents.data?.talents?.length}`);

    // Validación por Admin (+25 pts)
    const validateTalentRes = await admin.req(`/api/talentos/${talent.id}/validar`, {
      method: 'PATCH',
      body: { status: 'VALIDADO', reviewNote: 'Conocimiento verificado en campo con la comunidad.' }
    });
    record('Certificación de Saber y Bonificación (+25 pts)', validateTalentRes.ok && validateTalentRes.data.talent.status === 'VALIDADO', `Certificado por Admin`);

    // 10. Misiones y Retos
    const challengesRes = await user.req('/api/retos');
    const challengesList = challengesRes.data?.challenges || [];
    record('Consulta de Misiones y Retos Comunitarios', challengesRes.ok && challengesList.length >= 4, `Retos activos: ${challengesList.length}`);

    // 11. Foro Comunitario "La Asamblea"
    const forumCats = await admin.req('/api/foro/categorias');
    record('Categorías Oficiales del Foro', forumCats.ok && forumCats.data.categories.length === 7, `Categorías: ${forumCats.data?.categories?.length}`);

    const postRes = await user.req('/api/foro/publicaciones', {
      method: 'POST',
      body: {
        title: 'Consejos para el cultivo de Manzanilla en suelo margoso',
        categoryId: forumCats.data.categories[0].id,
        content: 'Comparto mi experiencia manteniendo humedad adecuada con riego por goteo localizado.'
      }
    });
    const forumPost = postRes.data?.post;
    record('Creación de Publicación en La Asamblea', postRes.status === 201 && Boolean(forumPost?.id), `Post ID: ${forumPost?.id}`);

    const commentRes = await admin.req(`/api/foro/publicaciones/${forumPost.id}/comentarios`, {
      method: 'POST',
      body: { content: 'Excelente aporte. En suelo margoso el drenaje favorece las sumidades floridas.' }
    });
    record('Comentario en Hilo Comunitario', commentRes.status === 201 && Boolean(commentRes.data?.comment?.id), `Comentario ID: ${commentRes.data?.comment?.id}`);

    // 12. Bodega Comunitaria e Inventario "El Resguardo"
    const itemRes = await user.req(`/api/comunidades/${testCommunity.id}/bodega/items`, {
      method: 'POST',
      body: {
        name: 'Mangueras para riego por goteo 16mm',
        category: 'HERRAMIENTAS',
        unit: 'metros',
        quantity: 100,
        minQuantity: 20,
        location: 'Bodega Central, Estante 1',
        description: 'Rollo de manguera con goteros integrados a 20cm'
      }
    });
    const invItem = itemRes.data?.item;
    record('Registro de Insumo en Bodega', itemRes.status === 201 && Boolean(invItem?.id), `Item ID: ${invItem?.id}, Stock: ${invItem?.quantity}`);

    // Movimiento de salida
    const movSalidaRes = await user.req(`/api/comunidades/${testCommunity.id}/bodega/items/${invItem.id}/movimiento`, {
      method: 'POST',
      body: {
        type: 'SALIDA',
        quantity: 30,
        reason: 'Instalación en huerto de prueba parcelas A1-A4'
      }
    });
    record('Movimiento de Salida con Actualización de Saldo', movSalidaRes.status === 201 && movSalidaRes.data.item.quantity === 70, `Saldo restante: ${movSalidaRes.data?.item?.quantity}`);

    // Guardia de stock no negativo (intento de retirar más de lo disponible)
    const movOverdraw = await user.req(`/api/comunidades/${testCommunity.id}/bodega/items/${invItem.id}/movimiento`, {
      method: 'POST',
      body: {
        type: 'SALIDA',
        quantity: 200,
        reason: 'Intento de sobregiro'
      }
    });
    record('Guardia Antidéficit de Inventario (Stock no negativo)', movOverdraw.status === 400, `Rechazo con código: ${movOverdraw.status}`);

    // Lote de secado postcosecha
    const dryBatchRes = await user.req(`/api/comunidades/${testCommunity.id}/bodega/secados`, {
      method: 'POST',
      body: {
        plantId,
        cropId: testCrop.id,
        harvestDate: new Date().toISOString(),
        initialWeightGrams: 850,
        conditions: 'Secado en bastidores andinos a la sombra, 19°C',
        notes: 'Lote de prueba de sumidades floridas'
      }
    });
    const batch = dryBatchRes.data?.batch;
    record('Registro de Lote de Secado Postcosecha', dryBatchRes.status === 201 && Boolean(batch?.lotNumber), `Lote: ${batch?.lotNumber}`);

    // Finalizar lote con peso seco
    const finishBatchRes = await user.req(`/api/comunidades/${testCommunity.id}/bodega/secados/${batch.id}`, {
      method: 'PATCH',
      body: { status: 'FINALIZADO', dryWeightGrams: 170.5, notes: 'Secado óptimo, rendimiento 20%' }
    });
    record('Finalización de Lote de Secado', finishBatchRes.ok && finishBatchRes.data.batch.status === 'FINALIZADO', `Peso seco: ${finishBatchRes.data?.batch?.dryWeightGrams}g`);

    // Etiqueta oficial de trazabilidad 100g
    const labelRes = await user.req(`/api/comunidades/${testCommunity.id}/bodega/secados/${batch.id}/etiqueta`);
    const label = labelRes.data?.label;
    record('Generación de Etiqueta de Trazabilidad 100g (MSP 2017)', labelRes.ok && label?.netWeight === '100 g' && Boolean(label?.qrPayload), `Lote: ${label?.lotNumber}, Norma: ${label?.standard}`);

    // 13. Seguridad y Control de Acceso (2 Roles)
    const adminEndpointDenied = await user.req('/api/admin/usuarios');
    record('Control de Acceso: Usuario bloqueado de Rutas Admin (403)', adminEndpointDenied.status === 403, `HTTP: ${adminEndpointDenied.status}`);

    const auditAdmin = await admin.req('/api/admin/auditoria');
    record('Acceso de Administrador a Auditoría Global', auditAdmin.ok && Array.isArray(auditAdmin.data?.logs), `Logs registrados: ${auditAdmin.data?.logs?.length}`);

  } catch (err) {
    console.error('ERROR EN SUITE:', err);
    record('Ejecución Global', false, err.message);
  }

  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n===============================================================`);
  console.log(`RESUMEN: ${passed} / ${total} pruebas superadas (${Math.round((passed / total) * 100)}%)`);
  console.log(`===============================================================\n`);
}

runTests();
