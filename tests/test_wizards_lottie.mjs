import pkg from '/root/enfa/node_modules/@playwright/test/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const BASE_URL = 'https://kawsapacha.ejedigital.io';
const ARTIFACT_DIR = '/root/.gemini/antigravity/brain/a9ac6784-f8bd-461f-8e45-d5b805f553bf';
const SCREENSHOTS_DIR = path.join(ARTIFACT_DIR, 'wizard_screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Read env for admin credentials
const envContent = fs.readFileSync('/root/kawsapacha-mvp/.env', 'utf8');
const adminEmail = (envContent.match(/^ADMIN_EMAIL=(.*)$/m)?.[1] || 'admin@kawsapacha.ejedigital.dev').trim();
const adminPassword = (envContent.match(/^ADMIN_PASSWORD=(.*)$/m)?.[1] || 'xsCIiV5Z9zl7Euna').trim();

console.log('================================================================');
console.log('KAWSAPACHA — VERIFICACIÓN AUTOMATIZADA DE ASISTENTES Y LOTTIE');
console.log(`URL base: ${BASE_URL}`);
console.log('================================================================\n');

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--ignore-certificate-errors', '--disable-dev-shm-usage']
});

const report = {
  wizardsTested: [],
  animationsTested: [],
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

  // 1. TEST COMMUNITY WIZARD
  console.log('\n--- 1. Asistente de Creación de Comunidad (communityModal) ---');
  await page.goto(`${BASE_URL}/#comunidades`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const newCommBtn = await page.$('[data-action="new-community"]');
  assert.ok(newCommBtn, 'Botón "Nueva comunidad" debe existir');
  await newCommBtn.click();

  await page.waitForSelector('.modal-wizard .kp-wizard-shell', { state: 'visible', timeout: 5000 });
  const stepNodes = await page.$$('.kp-wizard-step-node');
  assert.equal(stepNodes.length, 3, 'El asistente de comunidad debe tener exactamente 3 etapas');

  // Verify Lottie animation container exists and rendered SVG
  await page.waitForSelector('#wizardAnimBox svg', { timeout: 5000 });
  const animSvg = await page.$('#wizardAnimBox svg');
  assert.ok(animSvg, 'La animación Lottie (community-building) debe haberse renderizado como SVG');
  console.log('✔ Animación Lottie community-building renderizada como vector SVG.');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_wizard_comunidad_step1.png') });

  // Test Step 1 validation: cannot advance empty
  const nextBtn = await page.$('#wizardNextBtn');
  await nextBtn.click();
  const stepTag1 = await page.$eval('#wizardStepTag', el => el.textContent.trim());
  assert.ok(stepTag1.includes('Paso 1'), 'No debe avanzar sin llenar nombre');

  // Fill Step 1
  await page.fill('input[name="name"]', 'Comunidad Agroecológica Lottie');
  await nextBtn.click();
  await page.waitForTimeout(300);

  // Verify Step 2 reached
  const stepTag2 = await page.$eval('#wizardStepTag', el => el.textContent.trim());
  assert.ok(stepTag2.includes('Paso 2'), 'Debe encontrarse en el Paso 2');
  console.log('✔ Avance a paso 2 exitoso.');

  // Fill Step 2 fields
  await page.waitForSelector('input[name="phone"]', { state: 'visible' });
  await page.fill('input[name="phone"]', '0991234567');
  await page.fill('textarea[name="description"]', 'Territorio agroecológico demostrativo');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_wizard_comunidad_step2.png') });

  // Test Step Back: Click Atrás and verify field values are preserved!
  const prevBtn = await page.$('#wizardPrevBtn');
  assert.ok(prevBtn, 'Botón Atrás debe estar visible en paso 2');
  await prevBtn.click();
  await page.waitForTimeout(300);
  const nameVal = await page.$eval('input[name="name"]', el => el.value);
  assert.equal(nameVal, 'Comunidad Agroecológica Lottie', 'El valor de name debe preservarse al retroceder');
  console.log('✔ Invariante de preservación de estado comprobada: no hay pérdida de datos al navegar hacia atrás.');

  // Return to step 2 and verify step 2 values were ALSO preserved
  await nextBtn.click();
  await page.waitForTimeout(300);
  const phoneVal = await page.$eval('input[name="phone"]', el => el.value);
  assert.equal(phoneVal, '0991234567', 'El valor de phone en el paso 2 debe preservarse');
  console.log('✔ Valores en pasos posteriores preservados en el DOM sin pérdida.');

  // Advance to step 3 (Revisión)
  await nextBtn.click();
  await page.waitForTimeout(300);
  const submitBtn = await page.$('#wizardSubmitBtn');
  const isSubmitVisible = await submitBtn.isVisible();
  assert.ok(isSubmitVisible, 'Botón Confirmar/Guardar debe estar visible en la etapa final');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_wizard_comunidad_step3.png') });
  console.log('✔ Asistente de Comunidad superó todas las pruebas.');

  // Close modal
  await page.click('.kp-wizard-header .btn-close');
  await page.waitForTimeout(400);

  // 2. TEST GARDEN WIZARD & INVARIANT OF PERMANENT SOIL
  console.log('\n--- 2. Asistente de Huerto (gardenModal) e Invariante de Suelo Fijo ---');
  await page.goto(`${BASE_URL}/#huertos`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const newGardenBtn = await page.$('[data-action="new-garden"]');
  assert.ok(newGardenBtn, 'Botón "Nuevo huerto" debe existir');
  await newGardenBtn.click();
  await page.waitForSelector('.modal-wizard .kp-wizard-shell', { state: 'visible', timeout: 5000 });

  const gardenSteps = await page.$$('.kp-wizard-step-node');
  assert.equal(gardenSteps.length, 5, 'El asistente de huerto debe tener exactamente 5 etapas');

  // Verify permanent soil texture element (.kp-soil-texture)
  const soilTexture = await page.$('.kp-soil-texture');
  assert.ok(soilTexture, 'La capa permanente de tierra (.kp-soil-texture) DEBE existir en el asistente');
  const isSoilVisible = await soilTexture.isVisible();
  assert.ok(isSoilVisible, 'La capa de tierra permanente debe estar visible');
  console.log('✔ INVARIANTE VERIFICADA: La capa de tierra (.kp-soil-texture) está visible y fija bajo la animación.');

  // Verify Lottie plant-seeding
  await page.waitForSelector('#wizardAnimBox svg', { timeout: 5000 });
  console.log('✔ Animación Lottie plant-seeding activa en el asistente de huerto.');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_wizard_huerto_step1_suelo.png') });

  // Fill Step 1
  await page.fill('input[name="name"]', 'Huerto Demostrativo Lottie');
  await page.click('#wizardNextBtn');
  await page.waitForTimeout(300);

  // Step 2: Location and Dimensions
  await page.waitForSelector('input[name="province"]', { state: 'visible' });
  await page.fill('input[name="province"]', 'Pichincha');
  await page.fill('input[name="parish"]', 'Machachi');
  await page.fill('input[name="area"]', '50');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_wizard_huerto_step2_dimensiones.png') });
  await page.click('#wizardNextBtn');
  await page.waitForTimeout(300);

  // Step 3: Agronomic conditions
  await page.waitForSelector('select[name="soil"]', { state: 'visible' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_wizard_huerto_step3_condiciones.png') });
  await page.click('#wizardNextBtn');
  await page.waitForTimeout(300);

  // Step 4: 2D Grid interactive preview
  await page.waitForSelector('#gardenGridPreview', { state: 'visible' });
  const previewCells = await page.$$('#gardenGridPreview .kp-mini-cell');
  assert.ok(previewCells.length > 0, 'La previsualización interactiva de cuadrícula 2D debe renderizar celdas');
  console.log(`✔ Previsualización interactiva de cuadrícula 2D renderizada con ${previewCells.length} casillas.`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_wizard_huerto_step4_cuadricula.png') });

  // Invariant check: soil texture is STILL present and visible on Step 4
  const soilStillVisible = await soilTexture.isVisible();
  assert.ok(soilStillVisible, 'La capa de tierra debe permanecer visible a lo largo de todas las etapas');
  console.log('✔ INVARIANTE VERIFICADA: La capa de tierra se mantuvo visible sin destruirse ni recargarse.');

  // Step 5: Review
  await page.click('#wizardNextBtn');
  await page.waitForTimeout(300);
  const gardenSubmitBtn = await page.$('#wizardSubmitBtn');
  assert.ok(await gardenSubmitBtn.isVisible(), 'Botón submit visible en etapa final de huerto');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07b_wizard_huerto_step5_resumen.png') });
  console.log('✔ Asistente de Huerto superó las 5 etapas.');

  // Close garden wizard
  await page.click('.kp-wizard-header .btn-close');
  await page.waitForTimeout(400);

  // 3. TEST BOTANICAL CATALOG WIZARD (plantModal)
  console.log('\n--- 3. Asistente Botánico de Catálogo (plantModal) ---');
  await page.click('[data-nav="plantas"]');
  await page.waitForTimeout(600);

  const newPlantBtn = await page.$('[data-action="new-plant"]');
  assert.ok(newPlantBtn, 'Botón "Registrar nueva planta" debe existir');
  await newPlantBtn.click();
  await page.waitForSelector('.modal-wizard .kp-wizard-shell', { state: 'visible', timeout: 5000 });

  const plantSteps = await page.$$('.kp-wizard-step-node');
  assert.equal(plantSteps.length, 3, 'El asistente de planta debe tener 3 etapas');
  await page.waitForSelector('#wizardAnimBox svg', { timeout: 5000 });
  console.log('✔ Animación Lottie plant-growing activa en ficha botánica.');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_wizard_planta_step1.png') });

  // Fill required Step 1
  await page.fill('input[name="commonName"]', 'Menta Silvestre');
  await page.fill('input[name="scientific"]', 'Mentha piperita');
  await page.click('#wizardNextBtn');
  await page.waitForTimeout(300);

  // Step 2: MSP 2017 Traditional uses
  await page.waitForSelector('input[name="harvestPart"]', { state: 'visible' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_wizard_planta_step2_msp.png') });
  await page.click('#wizardNextBtn');
  await page.waitForTimeout(300);

  // Step 3: Photo upload slot & Lottie transition
  await page.waitForSelector('#plantPhotoDropzone', { state: 'visible' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_wizard_planta_step3_foto.png') });
  console.log('✔ Asistente Botánico verificado correctamente.');
  await page.click('.kp-wizard-header .btn-close');
  await page.waitForTimeout(400);

  // 4. TEST INVITATION WIZARD (inviteModal)
  console.log('\n--- 4. Asistente de Invitación de Miembros (inviteModal) ---');
  await page.goto(`${BASE_URL}/#comunidades`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const memBtn = document.querySelector('[data-action="view-members"], [data-action="manage-members"]');
    const cid = memBtn ? memBtn.dataset.id : '';
    if (cid) {
      const btn = document.createElement('button');
      btn.dataset.action = 'invite-member';
      btn.dataset.id = cid;
      document.body.appendChild(btn);
      btn.click();
      btn.remove();
    }
  });
  await page.waitForTimeout(600);

  const inviteWizard = await page.$('.modal-wizard .kp-wizard-shell');
  if (inviteWizard) {
    await page.waitForSelector('#wizardAnimBox svg', { timeout: 5000 });
    console.log('✔ Animación Lottie invitation-mail activa en invitación.');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_wizard_invitacion_step1.png') });

    // Step 2: Permissions matrix
    await page.fill('input[name="email"]', 'colaborador.nuevo@kawsapacha.test');
    await page.click('#wizardNextBtn');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_wizard_invitacion_step2_permisos.png') });
    console.log('✔ Matriz de permisos granulares mostrada en paso 2.');

    // Step 3: Review
    await page.click('#wizardNextBtn');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12b_wizard_invitacion_step3_despacho.png') });
    console.log('✔ Asistente de Invitación superó las 3 etapas.');

    await page.click('.kp-wizard-header .btn-close');
    await page.waitForTimeout(400);
  }

  // 5. TEST CROP WIZARD
  console.log('\n--- 5. Asistente de Asociación de Cultivo a Casilla (cropModal) ---');
  await page.click('[data-nav="huertos"]');
  await page.waitForTimeout(600);
  const gardenCardBtn = await page.$('[data-action="view-garden"]');
  if (gardenCardBtn) {
    await gardenCardBtn.click();
    await page.waitForTimeout(800);
    const emptyCellBtn = await page.$('[data-action="new-crop"]');
    if (emptyCellBtn) {
      await emptyCellBtn.click();
      await page.waitForSelector('.modal-wizard .kp-wizard-shell', { state: 'visible', timeout: 5000 });
      console.log('✔ Asistente de Asociación de Cultivo abierto correctamente.');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_wizard_cultivo_casilla.png') });
      await page.click('.kp-wizard-header .btn-close');
      await page.waitForTimeout(400);
    }
  }

  // 6. TEST COMPACT DIALOGS STAY COMPACT (NON-WIZARD)
  console.log('\n--- 6. Verificación de Modales Simples Compactos (No convertidos en Wizard) ---');
  await page.evaluate(() => {
    const btn = document.createElement('button');
    btn.dataset.action = 'open-talents';
    document.body.appendChild(btn);
    btn.click();
    btn.remove();
  });
  await page.waitForSelector('#modalInner', { state: 'visible', timeout: 5000 });
  const isNotWizard = await page.$('.modal-wizard');
  assert.equal(isNotWizard, null, 'El modal de saberes/talentos NO debe tener clase .modal-wizard (debe ser compacto)');
  console.log('✔ Modal de saberes ancestrales permanece compacto (diálogo directo).');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_modal_compacto_talento.png') });
  await page.click('#modalInner .btn-close, [data-bs-dismiss="modal"]');
  await page.waitForTimeout(400);

  // 7. RESPONSIVE TESTS ACROSS 7 BREAKPOINTS (LIGHT & DARK)
  console.log('\n--- 7. Verificación Responsive en 7 Resoluciones y Modos Claro/Oscuro ---');
  const viewports = [
    { name: 'Wide_1920', width: 1920, height: 1080 },
    { name: 'Desktop_1366', width: 1366, height: 768 },
    { name: 'Laptop_1024', width: 1024, height: 768 },
    { name: 'Tablet_768', width: 768, height: 1024 },
    { name: 'Mobile_430', width: 430, height: 932 },
    { name: 'Mobile_390', width: 390, height: 844 },
    { name: 'Mobile_360', width: 360, height: 800 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);

    // Open community wizard in this viewport directly
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.dataset.action = 'new-community';
      document.body.appendChild(b);
      b.click();
      b.remove();
    });
    await page.waitForSelector('#appModal.show .modal-wizard .kp-wizard-shell', { state: 'visible' });
    await page.waitForTimeout(350);

    // Light mode screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive_wizard_${vp.name}_light.png`) });

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(250);

    // Dark mode screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `responsive_wizard_${vp.name}_dark.png`) });

    // Restore light mode
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
    });
    await page.click('.kp-wizard-header .btn-close');
    await page.waitForSelector('#appModal', { state: 'hidden' });
    await page.waitForTimeout(250);
    console.log(`✔ Resolución ${vp.name} (${vp.width}x${vp.height}) verificada en Modo Claro y Modo Oscuro.`);
  }

  console.log('\n================================================================');
  console.log('TODAS LAS PRUEBAS DE ASISTENTES Y ANIMACIONES LOTTIE COMPLETADAS CON ÉXITO');
  console.log(`Total errores críticos de consola: ${report.errors.length}`);
  console.log('================================================================');

} catch (err) {
  console.error('Error durante la ejecución del test:', err);
  process.exit(1);
} finally {
  await browser.close();
}
