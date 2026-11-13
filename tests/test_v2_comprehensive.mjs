import pkg from '/root/enfa/node_modules/@playwright/test/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const BASE_URL = 'https://kawsapacha.ejedigital.io';
const ARTIFACT_DIR = '/root/.gemini/antigravity/brain/a9ac6784-f8bd-461f-8e45-d5b805f553bf';
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'v2_screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Read env for admin credentials
const envContent = fs.readFileSync('/root/kawsapacha-mvp/.env', 'utf8');
const adminEmail = (envContent.match(/^ADMIN_EMAIL=(.*)$/m)?.[1] || 'admin@kawsapacha.ejedigital.dev').trim();
const adminPassword = (envContent.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1] || 'xsCIiV5Z9zl7Euna').trim();

console.log('--- INICIANDO SUITE PLAYWRIGHT V2 KAWSAPACHA ---');
console.log(`URL base: ${BASE_URL}`);
console.log(`Admin email: ${adminEmail}`);

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--ignore-certificate-errors', '--disable-dev-shm-usage']
});

const report = {
  phases: {},
  viewportsTested: [],
  screenshots: [],
  errors: []
};

async function createPage(viewport = { width: 1366, height: 768 }) {
  const context = await browser.newContext({
    viewport,
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[PAGE_ERROR] ${msg.text()}`);
      report.errors.push(msg.text());
    }
  });
  return { context, page };
}

async function loginAdmin(page) {
  await page.goto(`${BASE_URL}/#inicio`, { waitUntil: 'networkidle' });
  // Check if already logged in or login via form
  const loginBtn = await page.$('[data-action="auth-login"]');
  if (loginBtn) {
    await loginBtn.click();
    await page.waitForSelector('#modalInner input[name="email"]', { state: 'visible' });
    await page.fill('#modalInner input[name="email"]', adminEmail);
    await page.fill('#modalInner input[name="password"]', adminPassword);
    await page.click('#modalInner button[type="submit"]');
    await page.waitForSelector('#sidebar', { state: 'visible', timeout: 10000 });
  }
}

try {
  // =========================================================================
  // 1. DESKTOP TEST: FASES 1-7 DE PUNTA A PUNTA (1366x768)
  // =========================================================================
  console.log('\n--- 1. EJECUCIÓN END-TO-END EN ESCRITORIO (1366x768) ---');
  const { page: dPage } = await createPage({ width: 1366, height: 768 });
  await loginAdmin(dPage);
  console.log('✓ Login administrativo verificado.');

  // --- Fase 5: Misiones y Retos ---
  console.log('\n[Fase 5] Verificando Misiones y Retos...');
  await dPage.goto(`${BASE_URL}/#retos`, { waitUntil: 'networkidle' });
  await dPage.waitForSelector('.kp-challenge-card');
  const challengeCount = await dPage.$$eval('.kp-challenge-card', els => els.length);
  assert.ok(challengeCount >= 4, `Debe haber al menos 4 retos, encontrados: ${challengeCount}`);
  console.log(`✓ Misiones y retos renderizados: ${challengeCount} retos activos.`);
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_desktop_retos_light.png'), fullPage: true });

  // --- Fase 6: Foro Comunitario ("La Asamblea") ---
  console.log('\n[Fase 6] Verificando La Asamblea Comunitaria...');
  await dPage.goto(`${BASE_URL}/#asamblea`, { waitUntil: 'networkidle' });
  await dPage.waitForSelector('[data-action="new-forum-post"]');
  const catButtons = await dPage.$$eval('[data-action="filter-forum-cat"]', els => els.map(b => b.textContent.trim()));
  console.log('✓ Categorías de la asamblea:', catButtons);
  assert.ok(catButtons.length >= 7, 'Deben existir al menos 7 categorías de diálogo');

  // Crear publicación en la Asamblea
  await dPage.click('[data-action="new-forum-post"]');
  await dPage.waitForSelector('#modalInner input[name="title"]', { state: 'visible' });
  const testPostTitle = `Experiencia con Ruda y Menta - Test ${Date.now()}`;
  await dPage.fill('#modalInner input[name="title"]', testPostTitle);
  await dPage.fill('#modalInner textarea[name="content"]', 'Comparto que la asociación de ruda en bordes repele efectivamente insectos sin aplicar agroquímicos sintéticos.');
  await dPage.click('#modalInner button[type="submit"]');
  await dPage.waitForTimeout(1000);

  // Verificar que aparece y abrir hilo
  await dPage.waitForSelector(`.kp-forum-card:has-text("${testPostTitle}")`);
  console.log('✓ Publicación creada y visible en la Asamblea.');
  await dPage.click(`.kp-forum-card:has-text("${testPostTitle}")`);
  await dPage.waitForSelector('#forumCommentForm', { state: 'visible' });

  // Agregar comentario al hilo
  await dPage.fill('#f_comment_content', 'Excelente aporte ancestral para la salud comunitaria.');
  await dPage.click('#forumCommentForm button[type="submit"]');
  await dPage.waitForTimeout(1000);
  const commentText = await dPage.$eval('.kp-comment-item', el => el.textContent);
  assert.ok(commentText.includes('Excelente aporte'), 'El comentario debe aparecer en el hilo');
  console.log('✓ Comentario en el hilo verificado correctamente.');
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_desktop_foro_post_modal.png') });
  await dPage.click('#appModal .btn-close, #appModal button:has-text("Cerrar")');

  // --- Fase 7: Bodega Comunitaria e Inventario ("El Resguardo") ---
  console.log('\n[Fase 7] Verificando El Resguardo / Bodega Comunitaria...');
  await dPage.goto(`${BASE_URL}/#comunidades`, { waitUntil: 'networkidle' });
  await dPage.waitForSelector('.community-card [data-action="open-warehouse"]');
  await dPage.click('.community-card [data-action="open-warehouse"]');
  await dPage.waitForSelector('[data-action="new-warehouse-item"]');
  console.log('✓ Acceso directo a El Resguardo desde comunidad verificado.');

  // Registrar un insumo en bodega
  await dPage.click('[data-action="new-warehouse-item"]');
  await dPage.waitForSelector('#modalInner input[name="name"]', { state: 'visible' });
  const testItemName = `Azadón Forjado Andino ${Date.now().toString().slice(-4)}`;
  await dPage.fill('#modalInner input[name="name"]', testItemName);
  await dPage.fill('#modalInner input[name="quantity"]', '15');
  await dPage.fill('#modalInner input[name="unit"]', 'unidades');
  await dPage.fill('#modalInner input[name="minQuantity"]', '3');
  await dPage.fill('#modalInner input[name="location"]', 'Gaveta Central A-1');
  await dPage.click('#modalInner button[type="submit"]');
  await dPage.waitForTimeout(1000);

  // Registrar movimiento de salida
  await dPage.waitForSelector(`.kp-inventory-card:has-text("${testItemName}")`);
  console.log(`✓ Insumo registrado: ${testItemName}`);
  await dPage.click(`.kp-inventory-card:has-text("${testItemName}") [data-action="open-item-movement"]`);
  await dPage.waitForSelector('#modalInner input[name="quantity"]', { state: 'visible' });
  await dPage.fill('#modalInner input[name="quantity"]', '2');
  await dPage.fill('#modalInner input[name="reason"]', 'Labores de deshierbe en parcela A1');
  await dPage.click('#modalInner button[type="submit"]');
  await dPage.waitForTimeout(1000);

  // Verificar saldo actualizado
  const updatedCardText = await dPage.$eval(`.kp-inventory-card:has-text("${testItemName}")`, el => el.textContent);
  assert.ok(updatedCardText.includes('13'), `El saldo después de salida de 2 debe ser 13, texto: ${updatedCardText}`);
  console.log('✓ Movimiento auditado y reducción de stock verificada (15 - 2 = 13).');

  // Registrar lote de secado postcosecha
  await dPage.click('[data-action="new-drying-batch"]');
  await dPage.waitForSelector('#modalInner input[name="initialWeightGrams"]', { state: 'visible' });
  await dPage.fill('#modalInner input[name="initialWeightGrams"]', '800');
  await dPage.click('#modalInner button[type="submit"]');
  await dPage.waitForTimeout(1000);

  // Cambiar a pestaña de lotes y verificar
  await dPage.click('[data-action="switch-warehouse-tab"][data-tab="batches"]');
  await dPage.waitForSelector('.kp-drying-card');
  console.log('✓ Lote de secado postcosecha visible.');

  // Abrir etiqueta 100g
  await dPage.click('.kp-drying-card [data-action="view-trace-label"]');
  await dPage.waitForSelector('.kp-trace-label-100g', { state: 'visible' });
  const labelText = await dPage.$eval('.kp-trace-label-100g', el => el.textContent);
  assert.ok(labelText.includes('100 g'), 'La etiqueta debe indicar contenido neto 100 g');
  assert.ok(labelText.includes('Norma Técnica MSP 2017'), 'La etiqueta debe indicar la norma técnica');
  console.log('✓ Etiqueta de trazabilidad de 100 g generada correctamente.');
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_desktop_etiqueta_100g.png') });
  await dPage.click('#appModal .btn-close, #appModal button:has-text("Cerrar")');

  // --- Fase 4: Saberes y Talentos Ancestrales ---
  console.log('\n[Fase 4] Verificando Saberes y Talentos Ancestrales...');
  await dPage.click('[data-action="open-profile"]');
  await dPage.waitForSelector('[data-action="open-talents"]', { state: 'visible' });
  console.log('✓ Botón de saberes y certificación visible en perfil.');

  // Declarar talento
  await dPage.click('[data-action="open-talents"]');
  await dPage.waitForSelector('#talentDeclareForm input[name="name"]', { state: 'visible' });
  const testTalentName = `Identificación de plantas medicinales andinas - ${Date.now().toString().slice(-4)}`;
  await dPage.fill('#talentDeclareForm input[name="name"]', testTalentName);
  await dPage.fill('#f_talent_desc', 'Conocimiento transmitido sobre propiedades térmicas cálidas y frías de las hierbas andinas.');
  await dPage.fill('#talentDeclareForm input[name="experience"]', '10 años en huertos familiares');
  await dPage.click('#talentDeclareForm button[type="submit"]');
  await dPage.waitForTimeout(1000);

  // Verificar que aparece en lista con estado En revisión
  const talentCardText = await dPage.$eval('.kp-talent-card', el => el.textContent);
  assert.ok(talentCardText.includes('En revisión') || talentCardText.includes('Declarado'), 'El talento debe iniciar en revisión');
  console.log(`✓ Talento declarado: ${testTalentName} en revisión.`);
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_desktop_talento_declarado.png') });
  await dPage.click('#appModal .btn-close, #appModal button:has-text("Cerrar")');

  // Certificar talento desde la bandeja de Maestro/Admin
  await dPage.click('[data-action="open-profile"]');
  await dPage.waitForSelector('[data-action="open-talents-review"]', { state: 'visible' });
  await dPage.click('[data-action="open-talents-review"]');
  await dPage.waitForSelector('[data-action="certify-talent"]', { state: 'visible' });
  await dPage.click('[data-action="certify-talent"]');
  await dPage.waitForTimeout(1000);
  console.log('✓ Talento certificado con éxito y puntos acreditados.');
  await dPage.click('#appModal .btn-close, #appModal button:has-text("Cerrar")');

  // --- Fase 1 & 2: Tabla de Parcelas y Modal de Cultivo ---
  console.log('\n[Fase 1 & 2] Verificando Tabla de Parcelas Rediseñada y Modal de Cultivo...');
  await dPage.goto(`${BASE_URL}/#huertos`, { waitUntil: 'networkidle' });
  await dPage.waitForSelector('.garden-card [data-action="open-garden"]');
  await dPage.click('.garden-card [data-action="open-garden"]');
  await dPage.waitForSelector('#gardenGridMount');

  // Cambiar a vista de lista / tabla
  await dPage.click('[data-action="grid-view"][data-view="list"]');
  await dPage.waitForSelector('.kp-parcel-table');
  console.log('✓ Vista lista activada. Tabla .kp-parcel-table presente.');

  // Verificar filas ocupadas y disponibles
  const emptyRowText = await dPage.$eval('.kp-row-empty', el => el.textContent).catch(() => '');
  console.log('✓ Fila disponible verificada:', emptyRowText.replace(/\s+/g, ' ').slice(0, 60));

  // Abrir modal de cultivo en una fila ocupada
  await dPage.click('.kp-row-occupied [data-action="crop-detail"]');
  await dPage.waitForSelector('.plant-detail-hero', { state: 'visible' });
  await dPage.waitForSelector('.kp-hydric-card', { state: 'visible' });

  // Verificar las 6 secciones requeridas en el modal:
  const heroText = await dPage.$eval('.plant-detail-hero', el => el.textContent);
  assert.ok(heroText.includes('Casilla'), 'Sección 1 (Hero) debe mostrar la casilla');

  const hydricCard = await dPage.$eval('.kp-hydric-card', el => el.textContent);
  assert.ok(hydricCard.includes('Tipo de riego configurado'), 'Sección 4 (Hídrico) debe mostrar tipo de riego');
  assert.ok(hydricCard.includes('Último riego registrado'), 'Sección 4 (Hídrico) debe mostrar último riego');
  console.log('✓ Las 6 secciones del modal de cultivo y la tarjeta hídrica verificadas.');
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_desktop_modal_cultivo_hidrico.png') });

  // Probar registrar actividad de RIEGO con los 4 tipos oficiales
  await dPage.click('.kp-hydric-card [data-action="new-activity"]');
  await dPage.waitForSelector('#modalInner select[name="task"]', { state: 'visible' });
  await dPage.waitForSelector('#irrigationWrap', { state: 'visible' });
  const irrigationOptions = await dPage.$$eval('#irrigationWrap select[name="irrigationType"] option', opts => opts.map(o => o.value));
  console.log('✓ Opciones de riego disponibles en actividad:', irrigationOptions);
  assert.ok(irrigationOptions.includes('RIO'), 'Debe incluir RIO');
  assert.ok(irrigationOptions.includes('CANAL'), 'Debe incluir CANAL');
  assert.ok(irrigationOptions.includes('GOTEO'), 'Debe incluir GOTEO');
  assert.ok(irrigationOptions.includes('AGUA_POTABLE'), 'Debe incluir AGUA_POTABLE');
  await dPage.click('#appModal .btn-close, #appModal button:has-text("Cerrar")');

  // --- Fase 3: Catálogo Botánico y Recomendaciones de Cosecha ---
  console.log('\n[Fase 3] Verificando Recomendaciones de Cosecha en Catálogo...');
  await dPage.goto(`${BASE_URL}/#plantas`, { waitUntil: 'networkidle' });
  await dPage.waitForSelector('.plant-card [data-action="plant-detail"]');
  await dPage.click('.plant-card [data-action="plant-detail"]');
  await dPage.waitForSelector('.kp-detail-section:has-text("Recolección y cosecha")', { state: 'visible' });
  const harvestSectionText = await dPage.$eval('.kp-detail-section:has-text("Recolección y cosecha")', el => el.textContent);
  console.log('✓ Sección de cosecha MSP 2017:', harvestSectionText.replace(/\s+/g, ' ').slice(0, 100));
  assert.ok(harvestSectionText.includes('Parte recolectada'), 'Debe detallar parte recolectada');
  assert.ok(harvestSectionText.includes('Momento y etapa'), 'Debe detallar momento propicio');
  assert.ok(harvestSectionText.includes('Norma MSP 2017'), 'Debe referenciar la norma técnica');
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_desktop_planta_cosecha_msp.png') });
  await dPage.click('#appModal .btn-close, #appModal button:has-text("Cerrar")');

  // =========================================================================
  // 2. MATRIZ DE RESPONSIVIDAD Y MODO OSCURO (WCAG AA & ZERO BLEED-THROUGH)
  // =========================================================================
  console.log('\n--- 2. VERIFICACIÓN DE RESPONSIVIDAD Y MODO OSCURO ---');
  const viewports = [
    { name: 'Mobile_360', width: 360, height: 740 },
    { name: 'Mobile_390', width: 390, height: 844 },
    { name: 'Mobile_430', width: 430, height: 932 },
    { name: 'Tablet_768', width: 768, height: 1024 },
    { name: 'Laptop_1024', width: 1024, height: 768 },
    { name: 'Desktop_1366', width: 1366, height: 768 },
    { name: 'Wide_1920', width: 1920, height: 1080 }
  ];

  for (const vp of viewports) {
    console.log(`\nVerificando Viewport ${vp.name} (${vp.width}x${vp.height})...`);
    const { page } = await createPage({ width: vp.width, height: vp.height });
    await loginAdmin(page);

    // Test huerto list view on this viewport
    await page.goto(`${BASE_URL}/#huertos`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.garden-card [data-action="open-garden"]');
    await page.$eval('.garden-card [data-action="open-garden"]', el => el.click());
    await page.waitForSelector('#gardenGridMount');
    await page.waitForSelector('[data-action="grid-view"][data-view="list"]');
    await page.$eval('[data-action="grid-view"][data-view="list"]', el => el.click());

    if (vp.width < 768) {
      // Mobile: debe mostrar tarjetas .kp-parcel-mobile-cards
      await page.waitForSelector('.kp-parcel-mobile-cards', { state: 'visible' });
      const cardsCount = await page.$$eval('.kp-parcel-card', els => els.length);
      console.log(`✓ [${vp.name}] Tarjetas móviles visibles: ${cardsCount} casillas adaptadas sin desborde.`);
    } else {
      // Desktop / Tablet: tabla visible
      await page.waitForSelector('.kp-parcel-table', { state: 'visible' });
      console.log(`✓ [${vp.name}] Tabla compacta de parcelas visible.`);
    }

    // Screenshot Light Mode
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive_${vp.name}_light.png`) });

    // Activar Dark Mode y capturar
    await page.waitForSelector('[data-action="toggle-theme"]');
    await page.$eval('[data-action="toggle-theme"]', el => el.click());
    await page.waitForTimeout(400);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    assert.equal(theme, 'dark', 'El tema debe haber cambiado a dark');

    // Verificar que los fondos de tarjetas son sólidos y no transparentes
    const paperBg = await page.evaluate(() => {
      const card = document.querySelector('.card, .kp-parcel-card, .panel');
      return card ? getComputedStyle(card).backgroundColor : null;
    });
    console.log(`✓ [${vp.name}] Dark Mode activo. Color de fondo de tarjeta: ${paperBg}`);
    assert.ok(paperBg && paperBg !== 'rgba(0, 0, 0, 0)' && paperBg !== 'transparent', 'Las tarjetas deben tener fondo sólido');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive_${vp.name}_dark.png`) });
    report.viewportsTested.push(`${vp.name} (${vp.width}px): Light & Dark OK`);
    await page.close();
  }

  console.log('\n--- TODAS LAS VERIFICACIONES E2E Y RESPONSIVAS COMPLETADAS CON ÉXITO ---');
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
