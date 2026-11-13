import assert from 'node:assert/strict';

const BASE_URL = process.env.BASE_URL || 'https://kawsapacha.ejedigital.io';

async function req(urlPath, options = {}) {
  const url = `${BASE_URL}${urlPath}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, headers: res.headers, json, text };
}

async function login(email, password) {
  const r = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  assert.equal(r.status, 200, `Login failed for ${email}`);
  const rawCookie = r.headers.get('set-cookie');
  assert.ok(rawCookie, 'Expected set-cookie header');
  const sessionPart = rawCookie.split(';')[0];
  return { user: r.json.user, cookie: sessionPart, rawCookie };
}

async function runConcurrencyAudit() {
  console.log('===============================================================');
  console.log('KAWSAPACHA AUDIT: VERIFICACIÓN DE CONCURRENCIA E IDEMPOTENCIA');
  console.log('Objetivo:', BASE_URL);
  console.log('===============================================================\n');

  // 1. Logins
  const admin = await login('admin@kawsapacha.ejedigital.dev', 'xsCIiV5Z9zl7Euna');
  let user;
  try {
    user = await login('colaborador_test_v2@kawsapacha.local', 'ClaveSegura2026*');
  } catch {
    const regRes = await req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Colaborador V2 Test', email: 'colaborador_test_v2@kawsapacha.local', password: 'ClaveSegura2026*' })
    });
    user = await login('colaborador_test_v2@kawsapacha.local', 'ClaveSegura2026*');
  }

  // Check cookie Secure flag in HTTPS production response
  if (BASE_URL.startsWith('https://')) {
    assert.ok(admin.rawCookie.toLowerCase().includes('secure'), 'Cookie must have Secure flag in production HTTPS');
    console.log('✔ [PASS] Cookie Session: flag Secure verificado en HTTPS');
  }

  // 2. Concurrency Test: Bodega Stock Movement
  // Create test community
  const commRes = await req('/api/comunidades', {
    method: 'POST',
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      name: `Comunidad Concurrencia ${Date.now()}`,
      type: 'FAMILIAR',
      description: 'Prueba de carrera en bodega de insumos',
      location: 'Valle Sagrado'
    })
  });
  if (commRes.status !== 201) console.error('commRes error:', commRes.text);
  assert.equal(commRes.status, 201);
  const commId = commRes.json.community.id;

  // Create bodega item with 70 units
  const itemRes = await req(`/api/comunidades/${commId}/bodega/items`, {
    method: 'POST',
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      name: 'Compost Concurrente',
      category: 'ABONOS',
      quantity: 70,
      unit: 'KG',
      minQuantity: 10,
      location: 'Bodega Central'
    })
  });
  if (itemRes.status !== 201) console.error('itemRes error:', itemRes.text);
  assert.equal(itemRes.status, 201);
  const itemId = itemRes.json.item.id;

  // Fire 2 concurrent withdrawals of 50 KG each
  console.log('Ejecutando 2 retiros simultáneos de 50 KG (stock inicial: 70 KG)...');
  const [w1, w2] = await Promise.all([
    req(`/api/comunidades/${commId}/bodega/items/${itemId}/movimiento`, {
      method: 'POST',
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({ type: 'SALIDA', quantity: 50, reason: 'Retiro concurrente A' })
    }),
    req(`/api/comunidades/${commId}/bodega/items/${itemId}/movimiento`, {
      method: 'POST',
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({ type: 'SALIDA', quantity: 50, reason: 'Retiro concurrente B' })
    })
  ]);

  const statuses = [w1.status, w2.status].sort();
  assert.deepEqual(statuses, [201, 400], 'Exactamente una solicitud debe triunfar (201) y la otra debe fallar por stock insuficiente (400)');

  // Verify final item stock is exactly 20 KG (70 - 50), never negative!
  const finalItemRes = await req(`/api/comunidades/${commId}/bodega/items`, {
    headers: { Cookie: admin.cookie }
  });
  const updatedItem = finalItemRes.json.items.find(i => i.id === itemId);
  assert.equal(updatedItem.quantity, 20, 'Stock final debe ser exactamente 20 KG, previniendo sobregiro concurrente');
  console.log(`✔ [PASS] Bodega Concurrencia: 1 éxito (200), 1 rechazo (400), stock protegido a ${updatedItem.quantity} KG`);

  // 3. Concurrency Test: Talento Certification (+25 pts bonus idempotency)
  const talentRes = await req('/api/talentos', {
    method: 'POST',
    headers: { Cookie: user.cookie },
    body: JSON.stringify({
      name: 'Cataplasmas medicinales andinas',
      category: 'PLANTAS_MEDICINALES',
      description: 'Preparación de cataplasmas medicinales para prueba de carrera',
      experience: '4 años en botánica comunitaria'
    })
  });
  if (talentRes.status !== 201) console.error('talentRes error:', talentRes.text);
  assert.equal(talentRes.status, 201);
  const talentId = talentRes.json.talent.id;

  // Admin validates talent twice simultaneously
  console.log('Ejecutando 2 validaciones simultáneas sobre el mismo talento...');
  const [v1, v2] = await Promise.all([
    req(`/api/talentos/${talentId}/validar`, {
      method: 'PATCH',
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({ status: 'VALIDADO', reviewNote: 'Validación concurrente 1' })
    }),
    req(`/api/talentos/${talentId}/validar`, {
      method: 'PATCH',
      headers: { Cookie: admin.cookie },
      body: JSON.stringify({ status: 'VALIDADO', reviewNote: 'Validación concurrente 2' })
    })
  ]);

  const talentStatuses = [v1.status, v2.status].sort();
  assert.deepEqual(talentStatuses, [200, 409], 'Exactamente una validación debe triunfar (200) y la otra debe detectar conflicto (409)');
  console.log('✔ [PASS] Saberes Concurrencia: 1 validación exitosa (200), 1 conflicto evitado (409)');

  // 4. Concurrency Test: Invitación Responder
  const invRes = await req(`/api/comunidades/${commId}/invitaciones`, {
    method: 'POST',
    headers: { Cookie: admin.cookie },
    body: JSON.stringify({
      email: 'colaborador_test_v2@kawsapacha.local',
      role: 'COLABORADOR',
      permissions: ['REGISTER_ACTIVITIES']
    })
  });
  if (invRes.status !== 201) console.error('invRes error:', invRes.text);
  assert.equal(invRes.status, 201);
  const invId = invRes.json.invitation.id;

  console.log('Ejecutando 2 aceptaciones simultáneas sobre la misma invitación...');
  const [i1, i2] = await Promise.all([
    req(`/api/invitaciones/${invId}/responder`, {
      method: 'PATCH',
      headers: { Cookie: user.cookie },
      body: JSON.stringify({ action: 'ACEPTAR' })
    }),
    req(`/api/invitaciones/${invId}/responder`, {
      method: 'PATCH',
      headers: { Cookie: user.cookie },
      body: JSON.stringify({ action: 'ACEPTAR' })
    })
  ]);

  const invStatuses = [i1.status, i2.status].sort();
  assert.deepEqual(invStatuses, [200, 409], 'Exactamente una aceptación debe triunfar (200) y la segunda ser rechazada como procesada (409)');
  console.log('✔ [PASS] Invitaciones Concurrencia: 1 aceptación exitosa (200), 1 conflicto evitado (409)');

  console.log('\n===============================================================');
  console.log('TODAS LAS PRUEBAS DE CONCURRENCIA E IDEMPOTENCIA SUPERADAS');
  console.log('===============================================================');
}

runConcurrencyAudit().catch(err => {
  console.error('CONCURRENCY TEST ERROR:', err);
  process.exit(1);
});
