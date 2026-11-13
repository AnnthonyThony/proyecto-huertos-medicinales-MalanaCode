import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'https://kawsapacha.ejedigital.io';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kawsapacha.ejedigital.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CAMBIA_ESTA_CLAVE_ADMIN';

class Client {
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
    // Origin header for CSRF
    headers['Origin'] = BASE_URL;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/kawsapacha_session=([^;]+)/);
      if (match) this.cookie = `kawsapacha_session=${match[1]}`;
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => '');
    }

    return { status: res.status, ok: res.ok, data };
  }

  async register(name, email, password) {
    const res = await this.req('/api/auth/register', {
      method: 'POST',
      body: { name, email, password, birthDate: '1995-05-15', gender: 'OTRO', talents: 'Cuidado de hierbas' }
    });
    if (res.ok) this.user = res.data.user;
    return res;
  }

  async login(email, password) {
    const res = await this.req('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (res.ok) this.user = res.data.user;
    return res;
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runTests() {
  console.log(`\n============================================================`);
  console.log(`   SUITE DE PRUEBAS AUTOMATIZADAS - KAWSAPACHA V1`);
  console.log(`   ROLES, PROPIEDAD, INVITACIONES Y PERMISOS GRANULARES`);
  console.log(`   URL objetivo: ${BASE_URL}`);
  console.log(`============================================================\n`);

  const ts = Date.now();
  const userA = new Client('Usuario A (Propietario)');
  const userB = new Client('Usuario B (Invitada)');
  const userC = new Client('Usuario C (Tercero)');
  const admin = new Client('Administrador MSP');

  // TEST 1: Registro de Usuario A y verificación de rol USUARIO y nivel APRENDIZ
  console.log(`[TEST 1] Registro de Usuario A (Carlos)`);
  const regA = await userA.register(`Carlos Propietario ${ts}`, `carlos_${ts}@test.com`, 'ClaveSegura123!');
  assert(regA.status === 201, `Usuario A registrado exitosamente (status 201)`);
  assert(regA.data.user.role === 'USUARIO', `Rol global asignado es estrictamente 'USUARIO' (obtenido: ${regA.data.user.role})`);
  assert(regA.data.user.level === 'APRENDIZ', `Nivel de experiencia inicial es 'APRENDIZ'`);
  assert(regA.data.user.points === 0, `Puntos iniciales son 0`);
  assert(regA.data.user.suspended === false, `Cuenta no está suspendida`);

  // TEST 2: Usuario A crea una comunidad propia
  console.log(`\n[TEST 2] Creación de comunidad por Usuario A`);
  const commRes = await userA.req('/api/comunidades', {
    method: 'POST',
    body: { name: `Comunidad El Paraíso ${ts}`, type: 'BARRIAL', phone: '0991234567' }
  });
  assert(commRes.status === 201, `Comunidad creada con éxito (status 201)`);
  const community = commRes.data.community;
  assert(community.ownerId === userA.user.id || community.leaderId === userA.user.id, `Usuario A es identificado como propietario (ownerId: ${community.ownerId})`);

  // Verificar que el rol global de Usuario A NO subió a MAESTRO (sigue siendo USUARIO)
  const meA = await userA.req('/api/me');
  assert(meA.data.user.role === 'USUARIO', `El rol global del creador permanece en 'USUARIO' (no muta a rol de seguridad privilegiado)`);

  // TEST 3: Registro de Usuario B
  console.log(`\n[TEST 3] Registro de Usuario B (Diana)`);
  const regB = await userB.register(`Diana Colaboradora ${ts}`, `diana_${ts}@test.com`, 'ClaveSegura123!');
  assert(regB.status === 201, `Usuario B registrada con éxito (status 201)`);
  assert(regB.data.user.role === 'USUARIO', `Rol global de Usuario B es 'USUARIO'`);

  // TEST 4: Usuario A envía invitación a Usuario B con preset 'AGRICULTURAL_COLLABORATOR'
  console.log(`\n[TEST 4] Envío de invitación con perfil 'Colaborador agrícola'`);
  const invRes = await userA.req(`/api/comunidades/${community.id}/invitaciones`, {
    method: 'POST',
    body: { email: `diana_${ts}@test.com`, preset: 'AGRICULTURAL_COLLABORATOR' }
  });
  assert(invRes.status === 201, `Invitación creada en estado PENDIENTE (status 201)`);
  const invitation = invRes.data.invitation;
  assert(invitation.status === 'PENDIENTE', `Estado inicial de la invitación es PENDIENTE`);
  assert(invitation.permissions.includes('REGISTER_ACTIVITIES'), `Contiene permiso REGISTER_ACTIVITIES`);
  assert(invitation.permissions.includes('UPLOAD_EVIDENCE'), `Contiene permiso UPLOAD_EVIDENCE`);
  assert(!invitation.permissions.includes('CREATE_GARDENS'), `NO contiene permiso CREATE_GARDENS (restringido en colaborador agrícola)`);

  // TEST 5: Intento de reenvío duplicado de invitación
  console.log(`\n[TEST 5] Prevención de invitaciones duplicadas pendientes`);
  const dupRes = await userA.req(`/api/comunidades/${community.id}/invitaciones`, {
    method: 'POST',
    body: { email: `diana_${ts}@test.com`, preset: 'AGRICULTURAL_COLLABORATOR' }
  });
  assert(dupRes.status === 409, `Rechaza invitación duplicada con código HTTP 409 Conflicto`);

  // TEST 6: Usuario B consulta sus invitaciones pendientes
  console.log(`\n[TEST 6] Consulta de invitaciones pendientes por Usuario B`);
  const pendingRes = await userB.req('/api/invitaciones/pendientes');
  assert(pendingRes.status === 200, `Consulta exitosa de invitaciones pendientes`);
  const myInvs = pendingRes.data.invitations;
  assert(myInvs.length >= 1, `Usuario B encuentra su invitación pendiente`);
  const targetInv = myInvs.find(i => i.id === invitation.id);
  assert(Boolean(targetInv), `Invitación encontrada coincide con el ID creado`);

  // TEST 7: Usuario B acepta la invitación
  console.log(`\n[TEST 7] Usuario B acepta la invitación`);
  const acceptRes = await userB.req(`/api/invitaciones/${invitation.id}/responder`, {
    method: 'PATCH',
    body: { action: 'ACEPTAR' }
  });
  assert(acceptRes.status === 200, `Invitación aceptada exitosamente (status 200)`);

  // Verificar que Usuario B ahora ve la comunidad en "Compartidas conmigo"
  const commB = await userB.req('/api/comunidades');
  assert(commB.data.shared.some(c => c.id === community.id), `La comunidad aparece en la sección 'Compartidas conmigo' de Usuario B`);
  assert(!commB.data.owned.some(c => c.id === community.id), `La comunidad NO aparece en 'Mis comunidades' de Usuario B`);

  // TEST 8: Restricción de seguridad - Usuario B NO puede invitar a terceros
  console.log(`\n[TEST 8] Bloqueo de seguridad: Invitado NO puede enviar invitaciones`);
  const illegalInv = await userB.req(`/api/comunidades/${community.id}/invitaciones`, {
    method: 'POST',
    body: { email: `hacker_${ts}@test.com`, preset: 'READ_ONLY' }
  });
  assert(illegalInv.status === 403, `Invitado bloqueado con HTTP 403 al intentar invitar`);

  // TEST 9: Restricción de seguridad - Usuario B NO puede eliminar la comunidad
  console.log(`\n[TEST 9] Bloqueo de seguridad: Invitado NO puede eliminar la comunidad`);
  const illegalDelete = await userB.req(`/api/comunidades/${community.id}`, {
    method: 'DELETE'
  });
  assert(illegalDelete.status === 403, `Invitado bloqueado con HTTP 403 al intentar eliminar comunidad`);

  // TEST 10: Restricción de seguridad - Usuario B NO puede modificar permisos de integrantes
  console.log(`\n[TEST 10] Bloqueo de seguridad: Invitado NO puede alterar permisos`);
  const membersRes = await userA.req(`/api/comunidades/${community.id}/miembros`);
  const memberBRecord = membersRes.data.members.find(m => m.email === `diana_${ts}@test.com`);
  assert(Boolean(memberBRecord), `Registro de membresía de Usuario B localizado`);

  const illegalPerms = await userB.req(`/api/comunidades/${community.id}/miembros/${memberBRecord.id}/permisos`, {
    method: 'PATCH',
    body: { permissions: ['CREATE_GARDENS', 'EDIT_GARDENS'] }
  });
  assert(illegalPerms.status === 403, `Invitado bloqueado con HTTP 403 al intentar autoasignarse permisos`);

  // TEST 11: Restricción de permisos - Usuario B NO tiene CREATE_GARDENS
  console.log(`\n[TEST 11] Control granular: Invitado sin CREATE_GARDENS no puede crear huertos`);
  const illegalGarden = await userB.req('/api/huertos', {
    method: 'POST',
    body: {
      communityId: community.id,
      name: `Huerto No Autorizado ${ts}`,
      province: 'Pichincha',
      parish: 'Quito',
      area: 50,
      soil: 'LIMOSO',
      rows: 3,
      cols: 4
    }
  });
  assert(illegalGarden.status === 403, `Creación de huerto bloqueada con HTTP 403 por falta de permiso CREATE_GARDENS`);

  // TEST 12: Usuario A (Propietario) crea el Huerto oficial
  console.log(`\n[TEST 12] Usuario A (Propietario) crea huerto medicinal`);
  const gardenRes = await userA.req('/api/huertos', {
    method: 'POST',
    body: {
      communityId: community.id,
      name: `Huerto San Carlos ${ts}`,
      province: 'Pichincha',
      parish: 'Tumbaco',
      area: 120,
      soil: 'LIMOSO',
      rows: 3,
      cols: 4
    }
  });
  assert(gardenRes.status === 201, `Huerto creado exitosamente por el propietario (status 201)`);
  const garden = gardenRes.data.garden;

  // TEST 13: Usuario A siembra un cultivo en la casilla A1
  console.log(`\n[TEST 13] Asignación de cultivo 2D en casilla A1`);
  const plantsRes = await userA.req('/api/plantas');
  const plant = plantsRes.data.plants[0];
  assert(Boolean(plant), `Planta del catálogo obtenida: ${plant?.commonName}`);

  const cropRes = await userA.req(`/api/huertos/${garden.id}/cultivos`, {
    method: 'POST',
    body: {
      cell: 'A1',
      plantId: plant.id,
      technique: 'SURCOS',
      propagation: 'SEMILLAS'
    }
  });
  assert(cropRes.status === 201, `Cultivo registrado en casilla A1 (status 201)`);
  const crop = cropRes.data.crop;

  // TEST 14: Usuario B registra una actividad agrícola con foto en el cultivo
  console.log(`\n[TEST 14] Usuario B registra labor agrícola (REGISTER_ACTIVITIES + UPLOAD_EVIDENCE)`);
  // Crear imagen JPG mínima de prueba en base64
  const tinyJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  const formData = new FormData();
  formData.append('task', 'RIEGO');
  formData.append('note', 'Riego matutino con agua de acequia.');
  formData.append('photo', new Blob([tinyJpg], { type: 'image/jpeg' }), 'riego.jpg');

  const actRes = await userB.req(`/api/cultivos/${crop.id}/actividades`, {
    method: 'POST',
    body: formData
  });
  assert(actRes.status === 201, `Actividad registrada en estado PENDIENTE con evidencia fotográfica (status 201)`);
  const activity = actRes.data.activity;
  assert(activity.status === 'PENDIENTE', `Actividad creada con status PENDIENTE`);

  // TEST 15: Prevención de autovalidación - Usuario B NO puede validarse su propia actividad
  console.log(`\n[TEST 15] Prevención de autovalidación de actividades`);
  const illegalVal = await userB.req(`/api/actividades/${activity.id}/validar-maestro`, {
    method: 'PATCH',
    body: { status: 'APROBADA' }
  });
  assert(illegalVal.status === 403, `Autovalidación bloqueada con HTTP 403 (No se permite autovalidar para inflar puntos)`);

  // TEST 16: Usuario A (Propietario) valida y aprueba la actividad de Usuario B
  console.log(`\n[TEST 16] Usuario A (Propietario) aprueba actividad de Usuario B`);
  const approveRes = await userA.req(`/api/actividades/${activity.id}/validar-maestro`, {
    method: 'PATCH',
    body: { status: 'APROBADA' }
  });
  assert(approveRes.status === 200, `Actividad aprobada con éxito (status 200)`);
  assert(approveRes.data.activity.pointsAwarded > 0, `Puntos asignados a la actividad: ${approveRes.data.activity.pointsAwarded}`);

  // Verificar que Usuario B recibió los puntos en su perfil
  const meB = await userB.req('/api/me');
  assert(meB.data.user.points > 0, `Puntos acreditados en el perfil de Usuario B (total: ${meB.data.user.points})`);

  // TEST 17: Usuario A modifica los permisos de Usuario B a 'READ_ONLY'
  console.log(`\n[TEST 17] Modificación de permisos de integrante a 'Solo lectura'`);
  const updatePermsRes = await userA.req(`/api/comunidades/${community.id}/miembros/${memberBRecord.id}/permisos`, {
    method: 'PATCH',
    body: { preset: 'READ_ONLY' }
  });
  assert(updatePermsRes.status === 200, `Permisos de Usuario B actualizados a READ_ONLY`);

  // Ahora Usuario B intenta registrar otra actividad: debe fallar con 403
  const formData2 = new FormData();
  formData2.append('task', 'CUIDADO');
  formData2.append('note', 'Deshierbe.');
  formData2.append('photo', new Blob([tinyJpg], { type: 'image/jpeg' }), 'deshierbe.jpg');
  const actDenied = await userB.req(`/api/cultivos/${crop.id}/actividades`, {
    method: 'POST',
    body: formData2
  });
  assert(actDenied.status === 403, `Actividad rechazada con HTTP 403 tras ser degradado a READ_ONLY`);

  // TEST 18: Envío y cancelación de invitación por el propietario
  console.log(`\n[TEST 18] Cancelación de invitaciones`);
  const invC = await userA.req(`/api/comunidades/${community.id}/invitaciones`, {
    method: 'POST',
    body: { email: `cancelar_${ts}@test.com`, preset: 'READ_ONLY' }
  });
  assert(invC.status === 201, `Invitación a cancelar creada`);
  const cancelRes = await userA.req(`/api/comunidades/${community.id}/invitaciones/${invC.data.invitation.id}`, {
    method: 'DELETE'
  });
  assert(cancelRes.status === 200, `Invitación cancelada exitosamente con HTTP 200`);

  // TEST 19: Operaciones de Administrador Global
  console.log(`\n[TEST 19] Operaciones de Administrador Global`);
  const adminLogin = await admin.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert(adminLogin.status === 200, `Login de Administrador exitoso`);
  assert(adminLogin.data.user.role === 'ADMINISTRADOR', `Rol del Administrador es 'ADMINISTRADOR'`);

  // Listar usuarios
  const adminUsers = await admin.req('/api/admin/usuarios');
  assert(adminUsers.status === 200, `Admin consulta lista global de usuarios`);
  assert(adminUsers.data.users.length >= 2, `Lista contiene los usuarios registrados`);

  // Consultar auditoría
  const auditLogs = await admin.req('/api/admin/auditoria');
  assert(auditLogs.status === 200, `Admin consulta registros de auditoría`);
  assert(auditLogs.data.logs.some(l => l.action === 'COMMUNITY_CREATED'), `Audit log contiene evento COMMUNITY_CREATED`);
  assert(auditLogs.data.logs.some(l => l.action === 'INVITATION_SENT'), `Audit log contiene evento INVITATION_SENT`);

  // Suspender y reactivar un usuario de prueba
  console.log(`\n[TEST 20] Suspensión y reactivación de usuario`);
  const suspendRes = await admin.req(`/api/admin/usuarios/${userB.user.id}/suspender`, {
    method: 'PATCH',
    body: { suspended: true }
  });
  assert(suspendRes.status === 200, `Usuario B suspendido por Administrador`);

  // Usuario B intenta realizar una acción autenticada: debe recibir 403 Cuenta suspendida
  const suspendedReq = await userB.req('/api/me');
  assert(suspendedReq.status === 403, `Usuario B bloqueado con HTTP 403 al estar suspendido`);

  // Reactivar usuario B
  const reactivateRes = await admin.req(`/api/admin/usuarios/${userB.user.id}/suspender`, {
    method: 'PATCH',
    body: { suspended: false }
  });
  assert(reactivateRes.status === 200, `Usuario B reactivado con éxito`);
  const activeReq = await userB.req('/api/me');
  assert(activeReq.status === 200, `Usuario B recupera acceso normal tras reactivación`);

  console.log(`\n============================================================`);
  console.log(`   🎉 TODAS LAS 20 PRUEBAS COMPLETADAS SATISFACTORIAMENTE`);
  console.log(`============================================================\n`);
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});

