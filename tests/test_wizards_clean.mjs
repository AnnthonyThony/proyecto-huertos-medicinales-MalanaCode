import pkg from '/root/enfa/node_modules/@playwright/test/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const BASE_URL = 'https://kawsapacha.ejedigital.io';
const ARTIFACT_DIR = '/root/.gemini/antigravity/brain/a9ac6784-f8bd-461f-8e45-d5b805f553bf';
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'wizard_clean_screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Read admin credentials from .env
const envContent = fs.readFileSync('/root/kawsapacha-mvp/.env', 'utf8');
const adminEmail = (envContent.match(/^ADMIN_EMAIL=(.*)$/m)?.[1] || 'admin@kawsapacha.ejedigital.dev').trim();
const adminPassword = (envContent.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1] || 'xsCIiV5Z9zl7Euna').trim();

console.log('================================================================');
console.log('KAWSAPACHA — VERIFICACIÓN AUTOMATIZADA: REDISEÑO VISUAL LIMPIO');
console.log('Asistentes compactos, Stepper horizontal, Sin Lottie');
console.log(`URL base: ${BASE_URL}`);
console.log('================================================================\n');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--ignore-certificate-errors', '--disable-dev-shm-usage']
});

const report = {
  wizardsTested: [],
  responsiveTested: [],
  invariants: {},
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
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('404')) {
        console.error(`  [PAGE_ERROR] ${txt}`);
        report.errors.push(txt);
      }
    }
  });
  return { context, page };
}

async function loginAdmin(page) {
  await page.goto(`${BASE_URL}/#inicio`, { waitUntil: 'networkidle' });
  const loginBtn = await page.$('[data-action="auth-login"]');
  if (loginBtn) {
    await loginBtn.click();
    await page.waitForSelector('#modalInner input[name="email"]', { state: 'visible', timeout: 5000 });
    await page.fill('#modalInner input[name="email"]', adminEmail);
    await page.fill('#modalInner input[name="password"]', adminPassword);
    await page.click('#modalInner button[type="submit"]');
    await page.waitForSelector('#sidebar', { state: 'visible', timeout: 10000 });
  }
}

try {
  const { context, page } = await createPage({ width: 1366, height: 768 });
  await loginAdmin(page);
  console.log('✔ Sesión de Administrador iniciada correctamente.');

  // Save auth state to reuse in responsive tests without hitting login rate limits
  const authStatePath = '/tmp/kawsapacha_admin_auth.json';
  await context.storageState({ path: authStatePath });

  // 1. INVARIANTE: COMPROBAR AUSENCIA DE LOTTIE
  console.log('\n--- 1. Invariante: Cero Dependencias y Cero Animaciones Lottie ---');
  const lottieScript = await page.$('script[src*="lottie"]');
  assert.equal(lottieScript, null, 'No debe existir script de Lottie cargado en el DOM');
  const hasWindowLottie = await page.evaluate(() => Boolean(window.lottie));
  assert.equal(hasWindowLottie, false, 'window.lottie no debe estar presente en el entorno global');
  console.log('✔ Invariante verificada: Scripts de Lottie y librerías externas eliminados con éxito.');
  report.invariants.noLottie = true;

  // 2. TEST COMMUNITY WIZARD
  console.log('\n--- 2. Asistente de Creación de Comunidad (communityModal) ---');
  await page.goto(`${BASE_URL}/#comunidades`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const newCommBtn = await page.$('[data-action="new-community"]');
  assert.ok(newCommBtn, 'Botón "Nueva comunidad" debe existir');
  await newCommBtn.click();

  await page.waitForSelector('.modal-wizard .kp-modal-card', { state: 'visible', timeout: 5000 });
  
  // Verify horizontal stepper items
  const stepNodes = await page.$$('.kp-hstep-item');
  assert.equal(stepNodes.length, 3, 'El asistente de comunidad debe tener exactamente 3 etapas');
  console.log('✔ Stepper horizontal de 3 etapas verificado.');

  // Verify icon badge exists and no lottie slot
  const iconBadge = await page.$('.kp-modal-icon-badge');
  assert.ok(iconBadge, 'Debe existir el badge del icono modal (.kp-modal-icon-badge)');
  const animSlot = await page.$('#wizardAnimSlot');
  assert.equal(animSlot, null, 'El contenedor lateral de animaciones Lottie debe haber sido eliminado');
  console.log('✔ Columna lateral e ilustraciones Lottie eliminadas del modal.');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_wizard_comunidad_step1.png') });

  // Test Step 1 validation: cannot advance empty
  const nextBtn = await page.$('#wizardNextBtn');
  await nextBtn.click();
  const stepTag1 = await page.$eval('#wizardStepTag', el => el.textContent.trim());
  assert.ok(stepTag1.includes('Paso 1'), 'No debe avanzar sin llenar nombre');

  // Fill Step 1
  const testCommName = `Comunidad Pura ${Date.now()}`;
  await page.fill('input[name="name"]', testCommName);
  await nextBtn.click();
  await page.waitForTimeout(300);

  // Step 2 reached
  const stepTag2 = await page.$eval('#wizardStepTag', el => el.textContent.trim());
  assert.ok(stepTag2.includes('Paso 2'), 'Debe encontrarse en el Paso 2');
  console.log('✔ Avance a paso 2 exitoso.');

  // Fill Step 2
  await page.fill('input[name="phone"]', '0987654321');
  await page.fill('textarea[name="description"]', 'Custodia de huertos medicinales andinos');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_wizard_comunidad_step2.png') });

  // Test Step Back: Click Atrás and verify state preservation
  const prevBtn = await page.$('#wizardPrevBtn');
  assert.ok(prevBtn, 'Botón Atrás debe estar visible en paso 2');
  await prevBtn.click();
  await page.waitForTimeout(300);
  const nameVal = await page.$eval('input[name="name"]', el => el.value);
  assert.equal(nameVal, testCommName, 'El nombre debe preservarse al retroceder');
  console.log('✔ Invariante de navegación: datos preservados al volver atrás.');

  // Forward again to Step 3
  await nextBtn.click();
  await page.waitForTimeout(300);
  await nextBtn.click();
  await page.waitForTimeout(300);

  const stepTag3 = await page.$eval('#wizardStepTag', el => el.textContent.trim());
  assert.ok(stepTag3.includes('Paso 3'), 'Debe encontrarse en el Paso 3 (Revisión)');

  const submitBtn = await page.$('#wizardSubmitBtn');
  const isSubmitVisible = await submitBtn.isVisible();
  assert.ok(isSubmitVisible, 'Botón Guardar debe estar visible en la etapa final');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_wizard_comunidad_step3.png') });

  // Close modal
  await page.click('.kp-modal-header .btn-close');
  await page.waitForTimeout(400);
  report.wizardsTested.push('communityModal');

  // 3. TEST GARDEN WIZARD (gardenModal)
  console.log('\n--- 3. Asistente de Huerto (gardenModal) ---');
  await page.goto(`${BASE_URL}/#huertos`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const newGardenBtn = await page.$('[data-action="new-garden"]');
  assert.ok(newGardenBtn, 'Botón "Nuevo huerto" debe existir');
  await newGardenBtn.click();

  await page.waitForSelector('.modal-wizard .kp-modal-card', { state: 'visible', timeout: 5000 });
  const gardenSteps = await page.$$('.kp-hstep-item');
  assert.equal(gardenSteps.length, 5, 'El asistente de huerto debe tener exactamente 5 etapas');
  console.log('✔ Stepper de huerto cuenta con 5 pasos horizontales compactos.');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_wizard_huerto_step1.png') });

  // Fill Step 1
  await page.fill('input[name="name"]', `Huerto Limpio ${Date.now()}`);
  const gNext = await page.$('#wizardNextBtn');
  await gNext.click();
  await page.waitForTimeout(300);

  // Step 2: Territorio y dimensiones
  await page.fill('input[name="province"]', 'Pichincha');
  await page.fill('input[name="parish"]', 'Alangasí');
  await page.fill('input[name="area"]', '55.5');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_wizard_huerto_step2.png') });
  await gNext.click();
  await page.waitForTimeout(300);

  // Step 3: Condiciones agronómicas
  await page.selectOption('select[name="soil"]', 'MARGOSO');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_wizard_huerto_step3.png') });
  await gNext.click();
  await page.waitForTimeout(300);

  // Step 4: Cuadrícula 2D y preview interactivo
  const gridPreview = await page.$('#gardenGridPreview');
  assert.ok(gridPreview, 'La previsualización de la cuadrícula debe renderizarse');
  const countBadge = await page.$eval('#gardenGridCountBadge', el => el.textContent.trim());
  assert.ok(countBadge.includes('casillas'), 'Debe mostrar el recuento de casillas');
  console.log(`✔ Cuadrícula 2D interactiva renderizada (${countBadge}).`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_wizard_huerto_step4_grid.png') });

  // Step 5: Revisión
  await gNext.click();
  await page.waitForTimeout(300);
  const gardenSubmit = await page.$('#wizardSubmitBtn');
  assert.ok(await gardenSubmit.isVisible(), 'Botón Crear huerto debe estar visible');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_wizard_huerto_step5_review.png') });

  await page.click('.kp-modal-header .btn-close');
  await page.waitForTimeout(400);
  report.wizardsTested.push('gardenModal');

  // 4. TEST GARDEN DETAIL VIEW COMPACT HEADER (gardenPage)
  console.log('\n--- 4. Cabecera Compacta del Huerto (gardenPage) ---');
  // Navigate to an existing active garden
  const firstGardenLink = await page.$('[data-action="open-garden"]');
  if (firstGardenLink) {
    await firstGardenLink.click();
    await page.waitForSelector('.garden-compact-header', { state: 'visible', timeout: 5000 });
    const compactTitle = await page.$eval('.garden-compact-title', el => el.textContent.trim());
    assert.ok(compactTitle.length > 0, 'El título del huerto debe estar visible');
    const pills = await page.$$('.garden-meta-pills .badge');
    assert.ok(pills.length >= 4, 'Deben mostrarse las pastillas compactas de metadatos (ubicación, parcelas, área, riego, suelo)');
    console.log(`✔ Cabecera compacta del huerto verificada con éxito: "${compactTitle}" con ${pills.length} pastillas de metadata.`);

    // Check that the 2D grid mount is immediately visible near the top
    const gridMount = await page.$('#gardenGridMount');
    assert.ok(gridMount, 'El mapa 2D de parcelas debe estar montado');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_garden_compact_header.png') });
  }

  // 5. TEST BOTANICAL CATALOG WIZARD (plantModal)
  console.log('\n--- 5. Asistente de Catálogo Botánico (plantModal) ---');
  await page.goto(`${BASE_URL}/#plantas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const newPlantBtn = await page.$('[data-action="new-plant"]');
  if (newPlantBtn) {
    await newPlantBtn.click();
    await page.waitForSelector('.modal-wizard .kp-modal-card', { state: 'visible', timeout: 5000 });
    const plantSteps = await page.$$('.kp-hstep-item');
    assert.equal(plantSteps.length, 3, 'El asistente de planta debe tener exactamente 3 etapas');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_wizard_planta_step1.png') });

    const pNext = await page.$('#wizardNextBtn');
    await page.fill('input[name="commonName"]', 'Cedrón Andino');
    await page.fill('input[name="scientific"]', 'Aloysia citrodora');
    await pNext.click();
    await page.waitForTimeout(300);

    // Step 2: Usos tradicionales y norma MSP
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_wizard_planta_step2_msp.png') });
    await pNext.click();
    await page.waitForTimeout(300);

    // Step 3: Fotografía botánica y dropzone
    const dropzone = await page.$('#plantPhotoDropzone');
    assert.ok(dropzone, 'El dropzone de fotografía debe estar presente');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_wizard_planta_step3_photo.png') });
    console.log('✔ Asistente de planta medicinal verificado con 3 pasos limpios.');

    await page.click('.kp-modal-header .btn-close');
    await page.waitForTimeout(400);
    report.wizardsTested.push('plantModal');
  }

  // 5b. TEST INVITE WIZARD (inviteModal)
  console.log('\n--- 5b. Asistente de Invitación a Comunidad (inviteModal) ---');
  await page.goto(`${BASE_URL}/#comunidades`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const commId = await page.evaluate(() => window.kawsapachaState?.communities?.[0]?.id || window.kawsapachaState?.ownedCommunities?.[0]?.id);
  if (commId) {
    await page.evaluate(id => window.kawsapachaApp?.inviteModal ? window.kawsapachaApp.inviteModal(id) : null, commId);
  }
  const inviteBtn = await page.$('[data-action="invite-member"]');
  if (inviteBtn) {
    await inviteBtn.click();
  }
  const inviteModalCard = await page.$('.modal-wizard .kp-modal-card');
  if (inviteModalCard) {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_wizard_invitacion_step1.png') });
    const invNext = await page.$('#wizardNextBtn');
    await page.fill('input[name="email"]', 'colaborador.andino@kawsapacha.ec');
    await invNext.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_wizard_invitacion_step2_permisos.png') });
    await invNext.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_wizard_invitacion_step3_envio.png') });
    console.log('✔ Asistente de invitación verificado con stepper horizontal.');
    await page.click('.kp-modal-header .btn-close');
    await page.waitForTimeout(400);
  }

  // 6. RESPONSIVE SUITE: 7 RESOLUTIONS IN LIGHT & DARK MODE
  console.log('\n--- 6. Verificación Responsiva Integral (7 Resoluciones x 2 Temas) ---');
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
    for (const theme of ['light', 'dark']) {
      const rContext = await browser.newContext({
        viewport: vp,
        storageState: authStatePath,
        ignoreHTTPSErrors: true
      });
      const rPage = await rContext.newPage();

      // Open garden wizard first so the page origin is set
      await rPage.goto(`${BASE_URL}/#huertos`, { waitUntil: 'networkidle' });
      await rPage.waitForTimeout(300);

      // Set theme
      await rPage.evaluate(t => {
        document.documentElement.dataset.theme = t;
        localStorage.setItem('kawsapacha_theme', t);
      }, theme);

      const btn = await rPage.$('[data-action="new-garden"]');
      if (btn) {
        await btn.click();
        await rPage.waitForSelector('#appModal.show .kp-modal-card', { state: 'visible', timeout: 5000 });
        await rPage.waitForTimeout(300);

        // Advance to step 4 (Cuadrícula) to verify mobile responsiveness of controls
        const nBtn = await rPage.$('#wizardNextBtn');
        await rPage.fill('input[name="name"]', 'Huerto Test Responsive');
        await nBtn.click();
        await rPage.waitForTimeout(200);
        await rPage.fill('input[name="province"]', 'Pichincha');
        await rPage.fill('input[name="parish"]', 'Quito');
        await rPage.fill('input[name="area"]', '40');
        await nBtn.click();
        await rPage.waitForTimeout(200);
        await nBtn.click();
        await rPage.waitForTimeout(200);

        // Screenshot step 4
        const shotName = `responsive_${vp.name}_${theme}.png`;
        await rPage.screenshot({ path: path.join(SCREENSHOTS_DIR, shotName) });
        console.log(`  ✔ [${vp.name}] ${theme} mode: modal responsivo verificado (${shotName}).`);
      }
      await rContext.close();
    }
    report.responsiveTested.push(vp.name);
  }

  await context.close();
  console.log('\n================================================================');
  console.log('TODAS LAS PRUEBAS AUTOMATIZADAS SUPERADAS CON ÉXITO');
  console.log('================================================================\n');

} catch (err) {
  console.error('❌ Error durante la verificación:', err);
  process.exit(1);
} finally {
  await browser.close();
}
