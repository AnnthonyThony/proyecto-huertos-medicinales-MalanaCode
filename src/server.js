require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const {
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
  ALL_PERMISSIONS,
  PRESET_PROFILES,
  moonPhase,
  moonUpcoming,
  evaluateLunar,
  levelForPoints,
  rankingScore
} = require('./domain');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
}

const prisma = new PrismaClient();
const app = express();
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

const uploadDir = path.resolve(__dirname, '../uploads');
const plantUploadDir = path.join(uploadDir, 'plants');
fs.mkdirSync(plantUploadDir, { recursive: true });

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  }
}));

app.use(express.json({ limit: '90kb' }));
app.use(cookieParser());

app.use('/vendor/bootstrap', express.static(path.resolve(__dirname, '../node_modules/bootstrap/dist'), { maxAge: '7d' }));
app.use('/vendor/icons', express.static(path.resolve(__dirname, '../node_modules/bootstrap-icons/font'), { maxAge: '7d' }));
app.use('/vendor/gsap', express.static(path.resolve(__dirname, '../node_modules/gsap/dist'), { maxAge: '7d' }));
app.use('/uploads', express.static(uploadDir, { maxAge: '1d', immutable: false, dotfiles: 'deny', index: false }));

app.get(['/docs', '/documentacion'], (req, res) => res.sendFile(path.resolve(__dirname, '../public/documentacion.html')));
app.get('/DOCUMENTACION.md', (req, res, next) => {
  if (req.accepts('html') && !req.query.raw) return res.redirect(302, '/documentacion');
  next();
});

app.use(express.static(path.resolve(__dirname, '../public'), { index: 'index.html', maxAge: 0 }));

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const lanzarError = (estado, mensaje) => { throw new ApiError(estado, mensaje); };
const fail = lanzarError;

const envolverControlador = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const wrap = envolverControlador;

const NOMBRE_COOKIE = 'kawsapacha_session';
const cookieName = NOMBRE_COOKIE;

const opcionesCookie = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000
};
const cookieOptions = opcionesCookie;

const usuarioPublico = ({ password, ...u }) => u;
const publicUser = usuarioPublico;

function validarCadena(valor, etiqueta, max = 160, opcional = false) {
  if ((valor === undefined || valor === null || valor === '') && opcional) return '';
  if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > max) {
    lanzarError(400, `${etiqueta}: ingresa un valor válido (máx. ${max} caracteres).`);
  }
  return valor.trim();
}
const str = validarCadena;

function validarOpcion(valor, opciones, etiqueta) {
  if (!opciones.includes(valor)) lanzarError(400, `${etiqueta}: selecciona una opción válida.`);
  return valor;
}
const option = validarOpcion;

function validarNumero(valor, min, max, etiqueta) {
  const n = Number(valor);
  if (valor == null || valor === '' || !Number.isFinite(n) || n < min || n > max) {
    lanzarError(400, `${etiqueta}: debe estar entre ${min} y ${max}.`);
  }
  return n;
}
const number = validarNumero;

function validarEntero(valor, min, max, etiqueta) {
  const n = validarNumero(valor, min, max, etiqueta);
  if (!Number.isInteger(n)) lanzarError(400, `${etiqueta}: utiliza un número entero.`);
  return n;
}
const integer = validarEntero;

function validarUrlOArchivo(v) {
  if (!v) return null;
  if (typeof v === 'string' && !v.includes('..')) {
    if (v.startsWith('/assets/') && /^\/assets\/[a-zA-Z0-9_\/.-]+$/.test(v)) return v;
    if (v.startsWith('/uploads/plants/') && /^\/uploads\/plants\/[a-zA-Z0-9_.-]+$/.test(v)) return v;
  }
  try {
    const u = new URL(v);
    if (u.protocol !== 'https:') throw Error();
    return u.href;
  } catch {
    lanzarError(400, 'La imagen debe ser un archivo subido (/uploads/plants/...), un recurso local (/assets/...) o una URL HTTPS válida.');
  }
}
const urlOrEmpty = validarUrlOArchivo;

const normalizarCorreo = e => validarCadena(e, 'Correo', 200).toLowerCase();
const emailNormalize = normalizarCorreo;

const generarTokenUsuario = usuario => jwt.sign({ sub: usuario.id }, process.env.JWT_SECRET, { expiresIn: '7d', issuer: 'kawsapacha-mvp' });
const tokenFor = generarTokenUsuario;

async function identificarUsuario(req) {
  const token = req.cookies[NOMBRE_COOKIE];
  if (!token) return null;
  try {
    const cargaUtil = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'kawsapacha-mvp' });
    const usuario = await prisma.user.findUnique({ where: { id: cargaUtil.sub } });
    if (!usuario) return null;
    return usuario;
  } catch {
    return null;
  }
}
const identify = identificarUsuario;

const autenticacionOpcional = envolverControlador(async (req, res, next) => {
  req.user = await identificarUsuario(req);
  if (req.user && req.user.suspended) {
    lanzarError(403, 'Tu cuenta ha sido suspendida. Comunícate con el administrador.');
  }
  next();
});
const optionalAuth = autenticacionOpcional;

const requerirAutenticacion = envolverControlador(async (req, res, next) => {
  req.user = await identificarUsuario(req);
  if (!req.user) lanzarError(401, 'Inicia sesión para continuar.');
  if (req.user.suspended) lanzarError(403, 'Tu cuenta ha sido suspendida. Comunícate con el administrador.');
  next();
});
const requireAuth = requerirAutenticacion;

const requerirAdministrador = (req) => {
  if (!req.user || req.user.role !== 'ADMINISTRADOR') {
    lanzarError(403, 'Solo el administrador del sistema puede realizar esta acción.');
  }
};
const requireAdmin = requerirAdministrador;

async function registrarAuditoria({ userId, communityId, action, entityType, entityId, details, req }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    await prisma.auditLog.create({
      data: {
        userId: userId || req?.user?.id || null,
        communityId: communityId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? JSON.stringify(details) : (details || null),
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : null
      }
    });
  } catch (e) {
    console.error('[AUDIT_ERROR]', e.message);
  }
}
const logAudit = registrarAuditoria;

async function resolverAccesoComunidad(communityId, user, requiredPermission = null) {
  if (!user) lanzarError(401, 'Inicia sesión para continuar.');
  if (user.suspended) lanzarError(403, 'Tu cuenta ha sido suspendida.');

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        where: { status: 'ACTIVO' },
        include: { user: { select: { id: true, name: true, email: true, level: true } } }
      }
    }
  });
  if (!community) lanzarError(404, 'Comunidad no encontrada.');

  const isGlobalAdmin = user.role === 'ADMINISTRADOR';
  const isCommunityOwner = community.ownerId === user.id;

  if (isGlobalAdmin || isCommunityOwner) {
    return {
      community,
      isOwner: isCommunityOwner,
      isAdmin: isGlobalAdmin,
      isMember: true,
      permissions: ALL_PERMISSIONS,
      canManageMembers: true,
      canInvite: true
    };
  }

  const membership = community.members.find(m => m.userId === user.id);
  if (!membership) {
    lanzarError(403, 'No tienes acceso a esta comunidad ni formas parte de sus integrantes.');
  }

  const userPerms = membership.permissions || [];
  if (requiredPermission && !userPerms.includes(requiredPermission)) {
    lanzarError(403, `Permiso denegado: se requiere ${requiredPermission} en esta comunidad.`);
  }

  return {
    community,
    isOwner: false,
    isAdmin: false,
    isMember: true,
    permissions: userPerms,
    canManageMembers: false,
    canInvite: false
  };
}
const resolveCommunityAccess = resolverAccesoComunidad;

// Control same-origin
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin')) {
    const origin = req.get('origin');
    const host = req.get('x-forwarded-host') || req.get('host');
    if (origin !== `http://${host}` && origin !== `https://${host}`) {
      return next(new ApiError(403, 'Origen no permitido.'));
    }
  }
  next();
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente más tarde.' }
});

app.get('/api/health', wrap(async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, service: 'Kawsapacha MVP', roles: ['ADMINISTRADOR', 'USUARIO'] });
}));

app.get('/api/me', optionalAuth, wrap(async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const pendingInvitationsCount = await prisma.communityInvitation.count({
    where: {
      status: 'PENDIENTE',
      OR: [
        { invitedUserId: req.user.id },
        { invitedEmail: req.user.email.toLowerCase() }
      ]
    }
  });
  res.json({
    user: publicUser(req.user),
    pendingInvitationsCount
  });
}));

app.post('/api/auth/register', authLimit, wrap(async (req, res) => {
  const name = str(req.body.name, 'Nombre', 120);
  const email = emailNormalize(req.body.email);
  const password = str(req.body.password, 'Contraseña', 128);
  if (password.length < 8) fail(400, 'La contraseña debe tener al menos 8 caracteres.');
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'Introduce un correo válido.');

  let birthDate = null;
  if (req.body.birthDate) {
    birthDate = new Date(req.body.birthDate + 'T12:00:00.000Z');
    if (!Number.isFinite(birthDate.getTime()) || birthDate > new Date()) {
      fail(400, 'Fecha de nacimiento inválida.');
    }
  }

  // Todo usuario registrado recibe rol USUARIO y nivel APRENDIZ
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 12),
      birthDate,
      gender: str(req.body.gender, 'Género', 35, true),
      talents: str(req.body.talents, 'Talentos', 200, true),
      role: 'USUARIO',
      level: 'APRENDIZ',
      points: 0,
      suspended: false
    }
  });

  // Vincular invitaciones pendientes dirigidas a este correo
  await prisma.communityInvitation.updateMany({
    where: { invitedEmail: email, invitedUserId: null },
    data: { invitedUserId: user.id }
  });

  await logAudit({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: user.id,
    details: { email },
    req
  });

  res.cookie(cookieName, tokenFor(user), cookieOptions);
  res.status(201).json({ user: publicUser(user) });
}));

app.post('/api/auth/login', authLimit, wrap(async (req, res) => {
  const email = emailNormalize(req.body.email);
  const password = str(req.body.password, 'Contraseña', 128);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    fail(401, 'Correo o contraseña incorrectos.');
  }
  if (user.suspended) {
    fail(403, 'Tu cuenta ha sido suspendida. Comunícate con el administrador.');
  }

  res.cookie(cookieName, tokenFor(user), cookieOptions);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

app.patch('/api/me', requireAuth, wrap(async (req, res) => {
  const data = {};
  if (req.body.name !== undefined) data.name = str(req.body.name, 'Nombre', 120);
  if (req.body.gender !== undefined) data.gender = str(req.body.gender, 'Género', 35, true);
  if (req.body.talents !== undefined) data.talents = str(req.body.talents, 'Talentos', 200, true);
  if (req.body.birthDate !== undefined) {
    if (!req.body.birthDate) {
      data.birthDate = null;
    } else {
      const bd = new Date(req.body.birthDate + 'T12:00:00.000Z');
      if (!Number.isFinite(bd.getTime()) || bd > new Date()) fail(400, 'Fecha de nacimiento inválida.');
      data.birthDate = bd;
    }
  }
  if (req.body.newPassword) {
    const cur = str(req.body.currentPassword, 'Contraseña actual', 128);
    if (!await bcrypt.compare(cur, req.user.password)) {
      fail(400, 'La contraseña actual no coincide.');
    }
    const nextPass = str(req.body.newPassword, 'Nueva contraseña', 128);
    if (nextPass.length < 8) fail(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    data.password = await bcrypt.hash(nextPass, 12);
  }

  const updated = await prisma.user.update({ where: { id: req.user.id }, data });
  await logAudit({
    userId: req.user.id,
    action: 'USER_PROFILE_UPDATED',
    entityType: 'USER',
    entityId: req.user.id,
    details: { fields: Object.keys(data).filter(k => k !== 'password') },
    req
  });
  res.json({ user: publicUser(updated) });
}));

// Comunidades: Mis comunidades y Compartidas conmigo
app.get('/api/comunidades', requireAuth, wrap(async (req, res) => {
  const isAdm = req.user.role === 'ADMINISTRADOR';

  const owned = await prisma.community.findMany({
    where: { ownerId: req.user.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        where: { status: 'ACTIVO' },
        include: { user: { select: { id: true, name: true, email: true, level: true, role: true } } }
      },
      _count: { select: { gardens: true, members: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const sharedMemberships = await prisma.communityMember.findMany({
    where: {
      userId: req.user.id,
      status: 'ACTIVO',
      community: { ownerId: { not: req.user.id } }
    },
    include: {
      community: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            where: { status: 'ACTIVO' },
            include: { user: { select: { id: true, name: true, email: true, level: true, role: true } } }
          },
          _count: { select: { gardens: true, members: true } }
        }
      }
    },
    orderBy: { joinedAt: 'desc' }
  });

  const shared = sharedMemberships.map(sm => ({
    ...sm.community,
    myPermissions: sm.permissions,
    membershipStatus: sm.status,
    joinedAt: sm.joinedAt
  }));

  let all = undefined;
  if (isAdm) {
    all = await prisma.community.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          where: { status: 'ACTIVO' },
          include: { user: { select: { id: true, name: true, email: true, level: true, role: true } } }
        },
        _count: { select: { gardens: true, members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  const formatCommunity = c => ({
    ...c,
    leader: c.owner,
    leaderId: c.ownerId,
    isOwner: c.ownerId === req.user.id,
    canInvite: isAdm || c.ownerId === req.user.id
  });

  const formattedOwned = owned.map(formatCommunity);
  const formattedShared = shared.map(formatCommunity);
  const formattedAll = all ? all.map(formatCommunity) : undefined;
  const combined = isAdm ? formattedAll : [...formattedOwned, ...formattedShared];

  res.json({
    communities: combined,
    owned: formattedOwned,
    shared: formattedShared,
    all: formattedAll
  });
}));

app.post('/api/comunidades', requireAuth, wrap(async (req, res) => {
  const name = str(req.body.name, 'Nombre de comunidad', 100);
  const type = option(req.body.type, ['INDIVIDUAL', 'FAMILIAR', 'CONDOMINIO', 'BARRIAL'], 'Tipo');
  const phone = str(req.body.phone, 'Teléfono', 30, true);
  const description = str(req.body.description, 'Descripción', 400, true);

  const community = await prisma.$transaction(async (tx) => {
    const c = await tx.community.create({
      data: {
        name,
        type,
        phone,
        description: description || null,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            status: 'ACTIVO',
            permissions: ALL_PERMISSIONS
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, level: true, role: true } } } },
        _count: { select: { gardens: true, members: true } }
      }
    });
    return c;
  });

  await logAudit({
    userId: req.user.id,
    communityId: community.id,
    action: 'COMMUNITY_CREATED',
    entityType: 'COMMUNITY',
    entityId: community.id,
    details: { name, type },
    req
  });

  res.status(201).json({
    community: {
      ...community,
      leader: community.owner,
      leaderId: community.ownerId,
      isOwner: true,
      canInvite: true
    }
  });
}));

app.patch('/api/comunidades/:id', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario de la comunidad o el administrador pueden editarla.');
  }
  const data = {};
  if (req.body.name !== undefined) data.name = str(req.body.name, 'Nombre de comunidad', 100);
  if (req.body.type !== undefined) data.type = option(req.body.type, ['INDIVIDUAL', 'FAMILIAR', 'CONDOMINIO', 'BARRIAL'], 'Tipo');
  if (req.body.phone !== undefined) data.phone = str(req.body.phone, 'Teléfono', 30, true);
  if (req.body.description !== undefined) data.description = str(req.body.description, 'Descripción', 400, true) || null;

  const updated = await prisma.community.update({
    where: { id: access.community.id },
    data
  });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'COMMUNITY_UPDATED',
    entityType: 'COMMUNITY',
    entityId: access.community.id,
    details: data,
    req
  });

  res.json({ community: updated });
}));

app.delete('/api/comunidades/:id', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario de la comunidad o el administrador pueden eliminarla.');
  }

  await prisma.community.delete({ where: { id: access.community.id } });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'COMMUNITY_DELETED',
    entityType: 'COMMUNITY',
    entityId: access.community.id,
    details: { name: access.community.name },
    req
  });

  res.json({ ok: true, message: 'Comunidad eliminada correctamente.' });
}));

// Invitaciones a comunidades
app.post('/api/comunidades/:id/invitaciones', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario de la comunidad o el administrador pueden enviar invitaciones.');
  }

  const invitedEmail = emailNormalize(req.body.email);
  if (!/^\S+@\S+\.\S+$/.test(invitedEmail)) {
    fail(400, 'Introduce un correo electrónico válido.');
  }

  let permissions = [];
  if (req.body.preset && PRESET_PROFILES[req.body.preset]) {
    permissions = [...PRESET_PROFILES[req.body.preset].permissions];
  } else if (Array.isArray(req.body.permissions)) {
    permissions = req.body.permissions.filter(p => ALL_PERMISSIONS.includes(p));
  }
  if (!permissions.length) {
    permissions = [...PRESET_PROFILES.READ_ONLY.permissions];
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitedEmail } });
  if (existingUser && existingUser.id === access.community.ownerId) {
    fail(400, 'No puedes invitar al propietario de la comunidad.');
  }

  if (existingUser) {
    const existingMember = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: existingUser.id, communityId: access.community.id } }
    });
    if (existingMember && existingMember.status === 'ACTIVO') {
      fail(409, 'El usuario ya es integrante activo de esta comunidad.');
    }
  }

  const pendingInv = await prisma.communityInvitation.findFirst({
    where: {
      communityId: access.community.id,
      invitedEmail,
      status: 'PENDIENTE'
    }
  });
  if (pendingInv) {
    fail(409, 'Ya existe una invitación pendiente para este correo.');
  }

  const invitation = await prisma.communityInvitation.create({
    data: {
      communityId: access.community.id,
      senderId: req.user.id,
      invitedEmail,
      invitedUserId: existingUser?.id || null,
      permissions,
      status: 'PENDIENTE'
    },
    include: {
      community: { select: { id: true, name: true } },
      sender: { select: { id: true, name: true, email: true } },
      invitedUser: { select: { id: true, name: true, email: true } }
    }
  });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'INVITATION_SENT',
    entityType: 'INVITATION',
    entityId: invitation.id,
    details: { invitedEmail, permissions, preset: req.body.preset || 'CUSTOM' },
    req
  });

  res.status(201).json({ invitation, message: 'Invitación enviada correctamente.' });
}));

app.get('/api/comunidades/:id/invitaciones', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario o el administrador pueden ver las invitaciones.');
  }

  const invitations = await prisma.communityInvitation.findMany({
    where: { communityId: access.community.id },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      invitedUser: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ invitations });
}));

app.delete('/api/comunidades/:id/invitaciones/:invitationId', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario o el administrador pueden cancelar invitaciones.');
  }

  const invitation = await prisma.communityInvitation.findUnique({
    where: { id: req.params.invitationId }
  });
  if (!invitation || invitation.communityId !== access.community.id) {
    fail(404, 'Invitación no encontrada.');
  }

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: { status: 'CANCELADA' }
  });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'INVITATION_CANCELLED',
    entityType: 'INVITATION',
    entityId: invitation.id,
    details: { invitedEmail: invitation.invitedEmail },
    req
  });

  res.json({ ok: true, message: 'Invitación cancelada.' });
}));

app.get('/api/invitaciones/pendientes', requireAuth, wrap(async (req, res) => {
  const invitations = await prisma.communityInvitation.findMany({
    where: {
      status: 'PENDIENTE',
      OR: [
        { invitedUserId: req.user.id },
        { invitedEmail: req.user.email.toLowerCase() }
      ]
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          type: true,
          owner: { select: { id: true, name: true, email: true } }
        }
      },
      sender: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ invitations });
}));

app.patch('/api/invitaciones/:id/responder', requireAuth, wrap(async (req, res) => {
  const action = option(req.body.action, ['ACEPTAR', 'RECHAZAR'], 'Acción');
  const invitation = await prisma.communityInvitation.findUnique({
    where: { id: req.params.id },
    include: { community: true }
  });
  if (!invitation || invitation.status !== 'PENDIENTE') {
    fail(404, 'Invitación no encontrada o ya resuelta.');
  }

  const isRecipient = invitation.invitedUserId === req.user.id ||
                      invitation.invitedEmail.toLowerCase() === req.user.email.toLowerCase();
  if (!isRecipient && req.user.role !== 'ADMINISTRADOR') {
    fail(403, 'Esta invitación no fue enviada a tu cuenta.');
  }

  if (action === 'ACEPTAR') {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.communityInvitation.updateMany({
        where: { id: invitation.id, status: 'PENDIENTE' },
        data: { status: 'ACEPTADA', respondedAt: new Date(), invitedUserId: req.user.id }
      });
      if (updated.count === 0) {
        fail(409, 'La invitación ya fue procesada o cancelada.');
      }
      await tx.communityMember.upsert({
        where: { userId_communityId: { userId: req.user.id, communityId: invitation.communityId } },
        create: {
          userId: req.user.id,
          communityId: invitation.communityId,
          status: 'ACTIVO',
          permissions: invitation.permissions
        },
        update: {
          status: 'ACTIVO',
          permissions: invitation.permissions
        }
      });
    });

    await logAudit({
      userId: req.user.id,
      communityId: invitation.communityId,
      action: 'INVITATION_ACCEPTED',
      entityType: 'INVITATION',
      entityId: invitation.id,
      details: { permissions: invitation.permissions },
      req
    });

    res.json({ ok: true, message: `Te has unido a ${invitation.community.name}.` });
  } else {
    const updated = await prisma.communityInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDIENTE' },
      data: { status: 'RECHAZADA', respondedAt: new Date(), invitedUserId: req.user.id }
    });
    if (updated.count === 0) {
      fail(409, 'La invitación ya fue procesada o cancelada.');
    }

    await logAudit({
      userId: req.user.id,
      communityId: invitation.communityId,
      action: 'INVITATION_REJECTED',
      entityType: 'INVITATION',
      entityId: invitation.id,
      req
    });

    res.json({ ok: true, message: 'Invitación rechazada.' });
  }
}));

// Integrantes y permisos de la comunidad
app.get('/api/comunidades/:id/miembros', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user, 'VIEW_MEMBERS');
  const members = await prisma.communityMember.findMany({
    where: { communityId: access.community.id, status: 'ACTIVO' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
          points: true,
          role: true,
          suspended: true
        }
      }
    },
    orderBy: { joinedAt: 'asc' }
  });

  res.json({
    members: members.map(m => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      level: m.user.level,
      points: m.user.points,
      role: m.user.role,
      suspended: m.user.suspended,
      isOwner: m.userId === access.community.ownerId,
      permissions: m.userId === access.community.ownerId ? ALL_PERMISSIONS : m.permissions,
      joinedAt: m.joinedAt
    })),
    canManage: access.isOwner || access.isAdmin
  });
}));

app.patch('/api/comunidades/:id/miembros/:memberId/permisos', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario o el administrador pueden cambiar permisos.');
  }

  const member = await prisma.communityMember.findUnique({
    where: { id: req.params.memberId },
    include: { user: true }
  });
  if (!member || member.communityId !== access.community.id) {
    fail(404, 'Integrante no encontrado en esta comunidad.');
  }

  if (member.userId === access.community.ownerId) {
    fail(400, 'No se pueden restringir los permisos del propietario de la comunidad.');
  }

  let permissions = [];
  if (req.body.preset && PRESET_PROFILES[req.body.preset]) {
    permissions = [...PRESET_PROFILES[req.body.preset].permissions];
  } else if (Array.isArray(req.body.permissions)) {
    permissions = req.body.permissions.filter(p => ALL_PERMISSIONS.includes(p));
  }

  const updated = await prisma.communityMember.update({
    where: { id: member.id },
    data: { permissions }
  });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'PERMISSIONS_UPDATED',
    entityType: 'MEMBER',
    entityId: member.id,
    details: { targetUserId: member.userId, permissions },
    req
  });

  res.json({ member: updated, message: 'Permisos actualizados correctamente.' });
}));

app.delete('/api/comunidades/:id/miembros/:memberId', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.id, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario o el administrador pueden retirar integrantes.');
  }

  const member = await prisma.communityMember.findUnique({
    where: { id: req.params.memberId },
    include: { user: true }
  });
  if (!member || member.communityId !== access.community.id) {
    fail(404, 'Integrante no encontrado en esta comunidad.');
  }

  if (member.userId === access.community.ownerId) {
    fail(400, 'No se puede expulsar al propietario de la comunidad.');
  }

  await prisma.communityMember.delete({ where: { id: member.id } });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'MEMBER_REMOVED',
    entityType: 'MEMBER',
    entityId: member.id,
    details: { targetUserId: member.userId, targetEmail: member.user?.email },
    req
  });

  res.json({ ok: true, message: 'Integrante retirado de la comunidad.' });
}));

// Catálogo de plantas medicinales MSP
const plantFields = body => {
  const minAlt = body.minAltitude !== '' && body.minAltitude != null ? number(body.minAltitude, -500, 6000, 'Altitud mínima') : null;
  const maxAlt = body.maxAltitude !== '' && body.maxAltitude != null ? number(body.maxAltitude, -500, 6000, 'Altitud máxima') : null;
  if (minAlt !== null && maxAlt !== null && minAlt > maxAlt) fail(400, 'La altitud mínima no puede superar a la máxima.');
  const soils = Array.isArray(body.soils) ? [...new Set(body.soils.map(s => option(s, SOILS, 'Suelo')))] : [];
  return {
    data: {
      commonName: str(body.commonName, 'Nombre común', 100),
      scientific: str(body.scientific, 'Nombre científico', 130),
      family: str(body.family, 'Familia', 100, true),
      uses: str(body.uses, 'Usos', 800, true),
      cautions: str(body.cautions, 'Precauciones', 800, true),
      botanicalNotes: str(body.botanicalNotes, 'Información agrícola', 1000, true) || null,
      minAltitude: minAlt,
      maxAltitude: maxAlt,
      cycle: option(body.cycle, ['CORTO', 'LARGO'], 'Ciclo'),
      thermal: option(body.thermal, ['CALIENTE', 'FRIA'], 'Cualidad térmica'),
      imageUrl: urlOrEmpty(body.imageUrl),
      imageThumbUrl: urlOrEmpty(body.imageThumbUrl),
      imageAttribution: str(body.imageAttribution, 'Autoría de imagen', 200, true) || null,
      imageLicense: str(body.imageLicense, 'Licencia de imagen', 100, true) || null,
      imageSource: str(body.imageSource, 'Fuente de imagen', 400, true) || null,
      verified: body.verified === true
    },
    soils
  };
};

app.get('/api/plantas', wrap(async (req, res) => {
  const where = {};
  if (req.query.thermal) where.thermal = option(req.query.thermal, ['CALIENTE', 'FRIA'], 'Cualidad térmica');
  if (req.query.soil) where.soils = { some: { soil: option(req.query.soil, SOILS, 'Suelo') } };
  if (req.query.cycle) where.cycle = option(req.query.cycle, ['CORTO', 'LARGO'], 'Ciclo');
  if (req.query.verified === 'true') where.verified = true;
  if (req.query.verified === 'false') where.verified = false;
  if (req.query.q) {
    const q = str(req.query.q, 'Búsqueda', 80);
    where.OR = [
      { commonName: { contains: q, mode: 'insensitive' } },
      { scientific: { contains: q, mode: 'insensitive' } },
      { family: { contains: q, mode: 'insensitive' } },
      { uses: { contains: q, mode: 'insensitive' } }
    ];
  }
  const sortMap = {
    name_asc: { commonName: 'asc' },
    name_desc: { commonName: 'desc' },
    thermal: [{ thermal: 'asc' }, { commonName: 'asc' }],
    cycle: [{ cycle: 'asc' }, { commonName: 'asc' }]
  };
  const orderBy = sortMap[req.query.sort] || { commonName: 'asc' };
  const limit = req.query.limit ? integer(req.query.limit, 1, 200, 'Límite') : 100;
  const page = req.query.page ? integer(req.query.page, 1, 1000, 'Página') : 1;
  const skip = (page - 1) * limit;

  const [plants, total] = await Promise.all([
    prisma.plant.findMany({ where, include: { soils: true }, orderBy, skip, take: limit }),
    prisma.plant.count({ where })
  ]);
  res.json({ plants, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

function checkImageBufferSignature(bytes, mimetype) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 12) return false;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mimetype === 'image/png') return png;
  if (mimetype === 'image/jpeg') return jpg;
  if (mimetype === 'image/webp') return webp;
  return false;
}

async function softRemoveLightBackground(inputBuffer) {
  // Remoción opcional no destructiva solo desde bordes conectados de fondo muy claro, sin alterar píxeles internos
  const { data, info } = await sharp(inputBuffer)
    .rotate()
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isNearWhiteBg = (idx) => {
    const off = idx * channels;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    const a = data[off + 3];
    if (a < 20) return true;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return min >= 224 && (max - min) <= 26;
  };

  const pushIfBg = (x, y) => {
    const idx = y * width + x;
    if (!visited[idx] && isNearWhiteBg(idx)) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % width;
    const cy = Math.floor(cur / width);
    data[cur * channels + 3] = 0;
    if (cx > 0) pushIfBg(cx - 1, cy);
    if (cx + 1 < width) pushIfBg(cx + 1, cy);
    if (cy > 0) pushIfBg(cx, cy - 1);
    if (cy + 1 < height) pushIfBg(cx, cy + 1);
  }

  return sharp(data, { raw: { width, height, channels } }).webp({ quality: 86 }).toBuffer();
}

const uploadPlant = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
      return cb(new ApiError(400, 'Solo se admiten fotografías en formato JPG, PNG o WebP.'));
    }
    cb(null, true);
  }
});

app.post('/api/plantas/imagen', requireAuth, uploadPlant.single('image'), wrap(async (req, res) => {
  requireAdmin(req);
  if (!req.file || !req.file.buffer) fail(400, 'Selecciona una fotografía JPG, PNG o WebP (máximo 6 MB).');
  if (!checkImageBufferSignature(req.file.buffer, req.file.mimetype)) {
    fail(400, 'La firma real del archivo no corresponde a una imagen JPG, PNG o WebP válida.');
  }

  let meta;
  try {
    meta = await sharp(req.file.buffer).metadata();
  } catch {
    fail(400, 'El archivo no pudo decodificarse como una imagen válida.');
  }
  if (!meta.width || !meta.height) fail(400, 'Dimensiones de imagen no válidas.');

  const baseId = crypto.randomUUID();
  const mainName = `${baseId}.webp`;
  const thumbName = `${baseId}-thumb.webp`;
  const mainPath = path.join(plantUploadDir, mainName);
  const thumbPath = path.join(plantUploadDir, thumbName);

  let origBuf;
  let finalBuf;
  let thumbBuf;
  let finalMeta;
  let originalUrl = null;
  try {
    origBuf = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();

    finalBuf = origBuf;
    if (req.body.removeLightBg === 'true') {
      const origName = `${baseId}-orig.webp`;
      await fs.promises.writeFile(path.join(plantUploadDir, origName), origBuf);
      originalUrl = `/uploads/plants/${origName}`;
      finalBuf = await softRemoveLightBackground(req.file.buffer);
    }

    thumbBuf = await sharp(finalBuf)
      .resize({ width: 280, height: 280, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    finalMeta = await sharp(finalBuf).metadata();
  } catch {
    fail(400, 'La fotografía está dañada o no pudo decodificarse como una imagen válida.');
  }

  await Promise.all([
    fs.promises.writeFile(mainPath, finalBuf),
    fs.promises.writeFile(thumbPath, thumbBuf)
  ]);
  await logAudit({
    userId: req.user.id,
    action: 'PLANT_IMAGE_UPLOADED',
    entityType: 'PLANT_IMAGE',
    details: { mainName, thumbName, width: finalMeta.width, height: finalMeta.height, removeLightBg: req.body.removeLightBg === 'true' },
    req
  });

  res.status(201).json({
    imageUrl: `/uploads/plants/${mainName}`,
    imageThumbUrl: `/uploads/plants/${thumbName}`,
    originalUrl,
    width: finalMeta.width,
    height: finalMeta.height,
    size: finalBuf.length,
    hasAlpha: Boolean(finalMeta.hasAlpha)
  });
}));

app.post('/api/plantas', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const { data, soils } = plantFields(req.body);
  const plant = await prisma.plant.create({
    data: { ...data, soils: { create: soils.map(soil => ({ soil })) } },
    include: { soils: true }
  });
  await logAudit({ userId: req.user.id, action: 'PLANT_CREATED', entityType: 'PLANT', entityId: plant.id, details: { commonName: plant.commonName }, req });
  res.status(201).json({ plant });
}));

app.put('/api/plantas/:id', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const { data, soils } = plantFields(req.body);
  const plant = await prisma.plant.update({
    where: { id: req.params.id },
    data: { ...data, soils: { deleteMany: {}, create: soils.map(soil => ({ soil })) } },
    include: { soils: true }
  });
  await logAudit({ userId: req.user.id, action: 'PLANT_UPDATED', entityType: 'PLANT', entityId: plant.id, details: { commonName: plant.commonName }, req });
  res.json({ plant });
}));

app.delete('/api/plantas/:id', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const cropCount = await prisma.crop.count({ where: { plantId: req.params.id } });
  if (cropCount > 0) fail(409, 'No se puede eliminar esta planta porque tiene cultivos asociados en huertos.');
  await prisma.plant.delete({ where: { id: req.params.id } });
  await logAudit({ userId: req.user.id, action: 'PLANT_DELETED', entityType: 'PLANT', entityId: req.params.id, req });
  res.json({ ok: true });
}));

// Huertos
app.get('/api/huertos', optionalAuth, wrap(async (req, res) => {
  let where = { status: 'ACTIVO' };
  if (req.user) {
    if (req.user.role === 'ADMINISTRADOR') {
      where = {};
    } else {
      where = {
        OR: [
          { status: 'ACTIVO' },
          { community: { ownerId: req.user.id } },
          {
            community: {
              members: {
                some: {
                  userId: req.user.id,
                  status: 'ACTIVO',
                  permissions: { has: 'VIEW_GARDENS' }
                }
              }
            }
          }
        ]
      };
    }
  }

  if (req.query.status) {
    const st = option(req.query.status, ['PENDIENTE', 'ACTIVO', 'OBSERVADO'], 'Estado');
    where = { AND: [where, { status: st }] };
  }

  const gardens = await prisma.garden.findMany({
    where,
    include: {
      community: { select: { id: true, name: true, ownerId: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { crops: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const mapped = gardens.map(g => ({
    ...g,
    community: {
      ...g.community,
      leaderId: g.community.ownerId
    }
  }));

  res.json({ gardens: mapped });
}));

app.post('/api/huertos', requireAuth, wrap(async (req, res) => {
  const communityId = str(req.body.communityId, 'Comunidad', 50);
  const access = await resolveCommunityAccess(communityId, req.user, 'CREATE_GARDENS');

  const area = number(req.body.area, 1, 400, 'Área');
  const latitude = number(req.body.latitude ?? -1.831239, -5.5, 2.1, 'Latitud aproximada de Ecuador');
  const longitude = number(req.body.longitude ?? -78.183406, -92.5, -74.5, 'Longitud aproximada de Ecuador');

  const rows = integer(req.body.rows ?? 3, 1, MAX_GARDEN_ROWS, 'Filas');
  const cols = integer(req.body.cols ?? 4, 1, MAX_GARDEN_COLS, 'Columnas');
  if (rows * cols > MAX_GARDEN_CELLS) {
    fail(400, `La cuadrícula (${rows} × ${cols} = ${rows * cols} casillas) supera el límite operativo de ${MAX_GARDEN_CELLS} parcelas por huerto.`);
  }

  const garden = await prisma.garden.create({
    data: {
      name: str(req.body.name, 'Nombre del huerto', 100),
      communityId: access.community.id,
      createdById: req.user.id,
      province: str(req.body.province, 'Provincia', 90),
      parish: str(req.body.parish, 'Parroquia', 90),
      latitude,
      longitude,
      area,
      orientation: option(req.body.orientation || 'NORTE', ['NORTE', 'SUR', 'ESTE', 'OESTE'], 'Orientación'),
      architecture: option(req.body.architecture || 'TIERRA', ['TIERRA', 'VERTICAL', 'COLGANTE', 'PISO'], 'Tipología'),
      fence: option(req.body.fence || 'NO', ['SI', 'NO'], 'Cerramiento'),
      soil: option(req.body.soil, SOILS, 'Suelo'),
      irrigation: option(req.body.irrigation || 'GOTEO', VALID_IRRIGATION, 'Riego'),
      fertilizer: option(req.body.fertilizer || 'COMPOST', ['COMPOST', 'HUMUS', 'ORGANICO', 'NINGUNO'], 'Abono'),
      rows,
      cols,
      description: str(req.body.description, 'Descripción', 400, true) || null
    }
  });

  await logAudit({
    userId: req.user.id,
    communityId: access.community.id,
    action: 'GARDEN_CREATED',
    entityType: 'GARDEN',
    entityId: garden.id,
    details: { name: garden.name },
    req
  });

  res.status(201).json({ garden });
}));

app.patch('/api/huertos/:id', requireAuth, wrap(async (req, res) => {
  const garden = await prisma.garden.findUnique({ where: { id: req.params.id }, include: { crops: { select: { cell: true } } } });
  if (!garden) fail(404, 'Huerto no encontrado.');
  const access = await resolveCommunityAccess(garden.communityId, req.user, 'EDIT_GARDENS');

  const data = {};
  if (req.body.name !== undefined) data.name = str(req.body.name, 'Nombre', 100);
  if (req.body.province !== undefined) data.province = str(req.body.province, 'Provincia', 90);
  if (req.body.parish !== undefined) data.parish = str(req.body.parish, 'Parroquia', 90);
  if (req.body.latitude !== undefined && req.body.latitude !== '') data.latitude = number(req.body.latitude, -5.5, 2.1, 'Latitud aproximada de Ecuador');
  if (req.body.longitude !== undefined && req.body.longitude !== '') data.longitude = number(req.body.longitude, -92.5, -74.5, 'Longitud aproximada de Ecuador');
  if (req.body.soil) data.soil = option(req.body.soil, SOILS, 'Suelo');
  if (req.body.area !== undefined && req.body.area !== '') data.area = number(req.body.area, 1, 400, 'Área');
  if (req.body.orientation) data.orientation = option(req.body.orientation, ['NORTE', 'SUR', 'ESTE', 'OESTE'], 'Orientación');
  if (req.body.architecture) data.architecture = option(req.body.architecture, ['TIERRA', 'VERTICAL', 'COLGANTE', 'PISO'], 'Tipología');
  if (req.body.fence) data.fence = option(req.body.fence, ['SI', 'NO'], 'Cerramiento');
  if (req.body.irrigation) data.irrigation = option(req.body.irrigation, VALID_IRRIGATION, 'Riego');
  if (req.body.fertilizer) data.fertilizer = option(req.body.fertilizer, ['COMPOST', 'HUMUS', 'ORGANICO', 'NINGUNO'], 'Abono');
  if (req.body.description !== undefined) data.description = str(req.body.description, 'Descripción', 400, true) || null;

  const nextRows = req.body.rows !== undefined && req.body.rows !== '' ? integer(req.body.rows, 1, MAX_GARDEN_ROWS, 'Filas') : garden.rows;
  const nextCols = req.body.cols !== undefined && req.body.cols !== '' ? integer(req.body.cols, 1, MAX_GARDEN_COLS, 'Columnas') : garden.cols;
  if (nextRows * nextCols > MAX_GARDEN_CELLS) {
    fail(400, `La cuadrícula (${nextRows} × ${nextCols} = ${nextRows * nextCols} casillas) supera el límite operativo de ${MAX_GARDEN_CELLS} parcelas por huerto.`);
  }
  if (nextRows !== garden.rows || nextCols !== garden.cols) {
    const affectedCells = [];
    for (const c of garden.crops) {
      const clean = c.cell.replace('-', '');
      const rIdx = clean.charCodeAt(0) - 64;
      const cIdx = Number(clean.slice(1));
      if (rIdx > nextRows || cIdx > nextCols) {
        affectedCells.push(clean);
      }
    }
    if (affectedCells.length) {
      fail(409, `No puedes reducir la cuadrícula porque hay cultivos activos fuera del nuevo rango (${affectedCells.join(', ')}).`);
    }
    data.rows = nextRows;
    data.cols = nextCols;
  }

  const updated = await prisma.garden.update({ where: { id: garden.id }, data });

  await logAudit({
    userId: req.user.id,
    communityId: garden.communityId,
    action: 'GARDEN_UPDATED',
    entityType: 'GARDEN',
    entityId: garden.id,
    details: data,
    req
  });

  res.json({ garden: updated });
}));

app.delete('/api/huertos/:id', requireAuth, wrap(async (req, res) => {
  const garden = await prisma.garden.findUnique({ where: { id: req.params.id } });
  if (!garden) fail(404, 'Huerto no encontrado.');
  const access = await resolveCommunityAccess(garden.communityId, req.user);
  if (!access.isOwner && !access.isAdmin) {
    fail(403, 'Solo el propietario de la comunidad o el administrador pueden eliminar el huerto.');
  }

  await prisma.garden.delete({ where: { id: garden.id } });

  await logAudit({
    userId: req.user.id,
    communityId: garden.communityId,
    action: 'GARDEN_DELETED',
    entityType: 'GARDEN',
    entityId: garden.id,
    details: { name: garden.name },
    req
  });

  res.json({ ok: true, message: 'Huerto eliminado correctamente.' });
}));

app.patch('/api/huertos/:id/validar-msp', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const status = option(req.body.status, ['ACTIVO', 'OBSERVADO'], 'Estado');
  const observations = str(req.body.observations, 'Observaciones', 500, true);
  if (status === 'OBSERVADO' && !observations) fail(400, 'Para observar un huerto escribe el motivo.');
  const garden = await prisma.garden.update({
    where: { id: req.params.id },
    data: { status, observations, validatedAt: status === 'ACTIVO' ? new Date() : null }
  });
  await logAudit({ userId: req.user.id, action: 'GARDEN_VALIDATED_MSP', entityType: 'GARDEN', entityId: garden.id, details: { status, observations }, req });
  res.json({ garden });
}));

app.get('/api/huertos/:id/virtual-grid', optionalAuth, wrap(async (req, res) => {
  const baseGarden = await prisma.garden.findUnique({
    where: { id: req.params.id },
    include: {
      community: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            where: { status: 'ACTIVO' },
            select: { userId: true, permissions: true }
          }
        }
      }
    }
  });
  if (!baseGarden) fail(404, 'Huerto no encontrado.');

  const user = req.user;
  const isAdm = Boolean(user && user.role === 'ADMINISTRADOR');
  const isOwner = Boolean(user && baseGarden.community.ownerId === user.id);
  const member = user ? baseGarden.community.members.find(m => m.userId === user.id) : null;
  const isMember = Boolean(isOwner || member);
  const userPerms = isOwner || isAdm ? ALL_PERMISSIONS : (member?.permissions || []);

  if (baseGarden.status !== 'ACTIVO' && !isMember && !isAdm) {
    fail(403, 'Este huerto todavía no está disponible públicamente.');
  }

  const canManageCrops = isAdm || isOwner || userPerms.includes('MANAGE_CROPS');
  const canRegisterActivity = isAdm || isOwner || userPerms.includes('REGISTER_ACTIVITIES');
  const canUploadEvidence = isAdm || isOwner || userPerms.includes('UPLOAD_EVIDENCE');
  const canEditGarden = isAdm || isOwner || userPerms.includes('EDIT_GARDENS');
  const canViewLogs = isAdm || isOwner || userPerms.includes('VIEW_LOGS');
  const canViewStats = isAdm || isOwner || userPerms.includes('VIEW_STATS');

  const garden = await prisma.garden.findUnique({
    where: { id: req.params.id },
    include: {
      community: {
        include: {
          owner: { select: { id: true, name: true, email: true } }
        }
      },
      crops: {
        include: {
          plant: { include: { soils: true } },
          activities: {
            where: canViewLogs ? {} : { status: 'APROBADA' },
            include: { volunteer: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        },
        orderBy: { cell: 'asc' }
      },
      _count: { select: { crops: true } }
    }
  });

  res.json({
    garden: {
      ...garden,
      community: {
        ...garden.community,
        leader: garden.community.owner,
        leaderId: garden.community.ownerId
      }
    },
    canEdit: canManageCrops,
    canManageCrops,
    canRegisterActivity,
    canUploadEvidence,
    canEditGarden,
    canViewLogs,
    canViewStats,
    isOwner,
    isMember,
    userPermissions: userPerms
  });
}));

app.get('/api/huertos/:id/estadisticas', optionalAuth, wrap(async (req, res) => {
  const garden = await prisma.garden.findUnique({
    where: { id: req.params.id },
    include: {
      community: {
        include: {
          members: { where: { status: 'ACTIVO' }, select: { userId: true, permissions: true } }
        }
      },
      crops: {
        include: {
          plant: { select: { thermal: true, commonName: true } },
          activities: {
            include: { volunteer: { select: { id: true, name: true } } }
          }
        }
      }
    }
  });
  if (!garden) fail(404, 'Huerto no encontrado.');

  const user = req.user;
  const isAdm = Boolean(user && user.role === 'ADMINISTRADOR');
  const isOwner = Boolean(user && garden.community.ownerId === user.id);
  const member = user ? garden.community.members.find(m => m.userId === user.id) : null;
  const perms = isOwner || isAdm ? ALL_PERMISSIONS : (member?.permissions || []);

  if (garden.status !== 'ACTIVO' && !isOwner && !isAdm && !member) {
    fail(403, 'No tienes acceso a este huerto.');
  }
  if (user && member && !isOwner && !isAdm && !perms.includes('VIEW_STATS')) {
    fail(403, 'Permiso denegado: se requiere VIEW_STATS.');
  }

  const totalCells = garden.rows * garden.cols;
  const occupiedCells = garden.crops.length;
  const freeCells = Math.max(0, totalCells - occupiedCells);
  const stages = { PREPARACION: 0, SIEMBRA: 0, CRECIMIENTO: 0, COSECHA: 0 };
  const thermal = { CALIENTE: 0, FRIA: 0 };
  const activitiesByStatus = { PENDIENTE: 0, APROBADA: 0, RECHAZADA: 0 };
  const activitiesByTask = { PREPARACION: 0, SIEMBRA: 0, RIEGO: 0, CUIDADO: 0, COSECHA: 0 };
  let lunarOptimalCount = 0;
  let totalActivities = 0;
  let totalApprovedPoints = 0;
  const contributorMap = new Map();

  for (const c of garden.crops) {
    if (stages[c.stage] !== undefined) stages[c.stage]++;
    if (thermal[c.plant.thermal] !== undefined) thermal[c.plant.thermal]++;
    for (const a of c.activities) {
      totalActivities++;
      if (activitiesByStatus[a.status] !== undefined) activitiesByStatus[a.status]++;
      if (activitiesByTask[a.task] !== undefined) activitiesByTask[a.task]++;
      if (a.lunarOptimal) lunarOptimalCount++;
      if (a.status === 'APROBADA') {
        totalApprovedPoints += a.pointsAwarded;
        const prev = contributorMap.get(a.volunteerId) || { name: a.volunteer.name, points: 0, count: 0 };
        prev.points += a.pointsAwarded;
        prev.count += 1;
        contributorMap.set(a.volunteerId, prev);
      }
    }
  }

  const contributors = [...contributorMap.values()].sort((a, b) => b.points - a.points).slice(0, 10);
  res.json({
    stats: {
      totalCells,
      occupiedCells,
      freeCells,
      occupancyPct: totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0,
      stages,
      thermal,
      totalActivities,
      activitiesByStatus,
      activitiesByTask,
      lunarOptimalCount,
      lunarCompliancePct: totalActivities > 0 ? Math.round((lunarOptimalCount / totalActivities) * 100) : 0,
      totalApprovedPoints,
      rankingScore: rankingScore(totalApprovedPoints, occupiedCells),
      contributors
    }
  });
}));

async function incrementChallengeProgress(client, userId, targetType, amount = 1) {
  try {
    const now = new Date();
    const activeChallenges = await client.challenge.findMany({
      where: {
        active: true,
        targetType,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    for (const challenge of activeChallenges) {
      const existing = await client.userChallenge.findUnique({
        where: { userId_challengeId: { userId, challengeId: challenge.id } }
      });

      const currentProgress = existing ? existing.progress : 0;
      const newProgress = currentProgress + amount;
      const isCompleted = newProgress >= challenge.targetCount;

      if (existing) {
        await client.userChallenge.update({
          where: { id: existing.id },
          data: {
            progress: newProgress,
            completed: existing.completed || isCompleted,
            completedAt: (isCompleted && !existing.completed) ? now : existing.completedAt
          }
        });
      } else {
        await client.userChallenge.create({
          data: {
            userId,
            challengeId: challenge.id,
            progress: newProgress,
            completed: isCompleted,
            completedAt: isCompleted ? now : null
          }
        });
      }
    }
  } catch (err) {
    console.error('[CHALLENGE_PROGRESS_ERROR]', err);
  }
}

app.post('/api/huertos/:id/cultivos', requireAuth, wrap(async (req, res) => {
  const garden = await prisma.garden.findUnique({ where: { id: req.params.id } });
  if (!garden) fail(404, 'Huerto no encontrado.');
  const access = await resolveCommunityAccess(garden.communityId, req.user, 'MANAGE_CROPS');

  const cell = option(
    str(req.body.cell, 'Casilla', 10),
    Array.from({ length: garden.rows * garden.cols }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / garden.cols))}${i % garden.cols + 1}`),
    'Casilla'
  );
  const legacyCell = cell.replace(/^([A-Z])([0-9]+)$/, '$1-$2');
  if (await prisma.crop.findFirst({ where: { gardenId: garden.id, cell: { in: [cell, legacyCell] } } })) {
    fail(409, 'Esta casilla ya tiene un cultivo registrado.');
  }

  const plant = await prisma.plant.findUnique({ where: { id: str(req.body.plantId, 'Planta', 60) } });
  if (!plant) fail(404, 'Planta no encontrada.');

  const crop = await prisma.crop.create({
    data: {
      gardenId: garden.id,
      plantId: plant.id,
      cell,
      technique: option(req.body.technique, ['SURCOS', 'TERRAZAS', 'CAMELLONES', 'RECIPIENTES'], 'Técnica'),
      propagation: option(req.body.propagation, ['SEMILLAS', 'ESTACAS', 'ESQUEJES', 'PLANTULAS'], 'Propagación'),
      notes: str(req.body.notes, 'Notas', 300, true) || null
    }
  });

  await logAudit({
    userId: req.user.id,
    communityId: garden.communityId,
    action: 'CROP_CREATED',
    entityType: 'CROP',
    entityId: crop.id,
    details: { cell, plantName: plant.commonName },
    req
  });

  await incrementChallengeProgress(prisma, req.user.id, 'CROPS_PLANTED', 1);

  res.status(201).json({ crop });
}));

app.patch('/api/huertos/:id/cultivos/:cropId', requireAuth, wrap(async (req, res) => {
  const crop = await prisma.crop.findUnique({ where: { id: req.params.cropId }, include: { garden: true } });
  if (!crop || crop.gardenId !== req.params.id) fail(404, 'Cultivo no encontrado.');
  await resolveCommunityAccess(crop.garden.communityId, req.user, 'MANAGE_CROPS');

  const data = {};
  if (req.body.technique) data.technique = option(req.body.technique, ['SURCOS', 'TERRAZAS', 'CAMELLONES', 'RECIPIENTES'], 'Técnica');
  if (req.body.propagation) data.propagation = option(req.body.propagation, ['SEMILLAS', 'ESTACAS', 'ESQUEJES', 'PLANTULAS'], 'Propagación');
  if (req.body.notes !== undefined) data.notes = str(req.body.notes, 'Notas', 300, true) || null;

  const updated = await prisma.crop.update({ where: { id: crop.id }, data });
  await logAudit({ userId: req.user.id, communityId: crop.garden.communityId, action: 'CROP_UPDATED', entityType: 'CROP', entityId: crop.id, details: data, req });
  res.json({ crop: updated });
}));

app.delete('/api/huertos/:id/cultivos/:cropId', requireAuth, wrap(async (req, res) => {
  const crop = await prisma.crop.findUnique({
    where: { id: req.params.cropId },
    include: { garden: true, activities: { where: { status: 'APROBADA' }, select: { id: true } } }
  });
  if (!crop || crop.gardenId !== req.params.id) fail(404, 'Cultivo no encontrado.');
  await resolveCommunityAccess(crop.garden.communityId, req.user, 'MANAGE_CROPS');
  if (crop.activities.length > 0) {
    fail(409, 'No puedes retirar un cultivo que ya cuenta con evidencias aprobadas y puntos acreditados.');
  }
  await prisma.crop.delete({ where: { id: crop.id } });
  await logAudit({ userId: req.user.id, communityId: crop.garden.communityId, action: 'CROP_DELETED', entityType: 'CROP', entityId: crop.id, details: { cell: crop.cell }, req });
  res.json({ ok: true });
}));

// Reloj lunar
app.get('/api/reloj-lunar/actual', (req, res) => res.json({
  moon: moonPhase(),
  phases: MOON,
  upcoming: moonUpcoming(8)
}));

// Evidencias y bitácora fotográfica
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + (file.mimetype === 'image/png' ? '.png' : '.jpg'))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return cb(new ApiError(400, 'Solo se admiten fotos JPG o PNG.'));
    }
    cb(null, true);
  }
});

function checkImageSignature(file) {
  const fd = fs.openSync(file.path, 'r');
  let bytes = Buffer.alloc(12);
  try {
    fs.readSync(fd, bytes, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return file.mimetype === 'image/png' ? png : jpg;
}

app.post('/api/cultivos/:id/actividades', requireAuth, upload.single('photo'), wrap(async (req, res) => {
  try {
    const crop = await prisma.crop.findUnique({
      where: { id: req.params.id },
      include: { garden: true }
    });
    if (!crop) fail(404, 'Cultivo no encontrado.');

    const access = await resolveCommunityAccess(crop.garden.communityId, req.user, 'REGISTER_ACTIVITIES');

    if (req.file) {
      if (!access.permissions.includes('UPLOAD_EVIDENCE') && !access.isOwner && !access.isAdmin) {
        fail(403, 'No tienes permiso para subir evidencias fotográficas (UPLOAD_EVIDENCE).');
      }
      if (!checkImageSignature(req.file)) fail(400, 'El archivo no es una imagen JPG o PNG válida.');
    } else {
      fail(400, 'Adjunta una foto JPG o PNG (máximo 5 MB).');
    }

    const task = option(req.body.task, TASKS, 'Tipo de actividad');
    const harvestPart = task === 'COSECHA' ? (req.body.harvestPart ? str(req.body.harvestPart, 'Parte cosechada', 80) : null) : null;
    const harvestQuantity = task === 'COSECHA' && req.body.harvestQuantity ? number(req.body.harvestQuantity, 0.01, 10000, 'Cantidad cosechada') : null;
    const harvestUnit = task === 'COSECHA' && req.body.harvestUnit ? option(req.body.harvestUnit, ['g', 'kg', 'lb', 'atados', 'unidades'], 'Unidad') : null;
    const irrigationType = task === 'RIEGO' ? (req.body.irrigationType ? option(req.body.irrigationType, VALID_IRRIGATION, 'Tipo de riego') : (crop.garden.irrigation || 'GOTEO')) : null;

    const moon = moonPhase();
    const optimal = evaluateLunar(task, moon.id, harvestPart);

    const activity = await prisma.activity.create({
      data: {
        cropId: crop.id,
        volunteerId: req.user.id,
        task,
        harvestPart,
        harvestQuantity,
        harvestUnit,
        irrigationType,
        note: str(req.body.note, 'Descripción', 600),
        imageName: req.file.filename,
        phase: moon.id,
        lunarOptimal: optimal,
        factor: optimal ? 1.25 : 1
      }
    });

    await logAudit({
      userId: req.user.id,
      communityId: crop.garden.communityId,
      action: 'ACTIVITY_REGISTERED',
      entityType: 'ACTIVITY',
      entityId: activity.id,
      details: { task, cropId: crop.id },
      req
    });

    res.status(201).json({ activity });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    throw err;
  }
}));

app.get('/api/actividades', requireAuth, wrap(async (req, res) => {
  const where = req.user.role === 'ADMINISTRADOR' ? {} : {
    OR: [
      { volunteerId: req.user.id },
      { crop: { garden: { community: { ownerId: req.user.id } } } },
      { crop: { garden: { community: { members: { some: { userId: req.user.id, status: 'ACTIVO', permissions: { has: 'VIEW_LOGS' } } } } } } }
    ]
  };
  if (req.query.gardenId) where.AND = [...(where.AND || []), { crop: { gardenId: str(req.query.gardenId, 'Huerto', 60) } }];
  if (req.query.status) where.status = option(req.query.status, ['PENDIENTE', 'APROBADA', 'RECHAZADA'], 'Estado');
  if (req.query.pendingReview === 'true') {
    where.status = 'PENDIENTE';
    if (req.user.role !== 'ADMINISTRADOR') {
      where.AND = [
        ...(where.AND || []),
        { crop: { garden: { community: { ownerId: req.user.id } } } },
        { volunteerId: { not: req.user.id } }
      ];
    }
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      volunteer: { select: { name: true, id: true } },
      crop: {
        include: {
          plant: { select: { commonName: true, scientific: true, imageUrl: true } },
          garden: { select: { id: true, name: true, community: { select: { id: true, ownerId: true } } } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const mapped = activities.map(a => ({
    ...a,
    crop: {
      ...a.crop,
      garden: {
        ...a.crop.garden,
        community: {
          ...a.crop.garden.community,
          leaderId: a.crop.garden.community.ownerId
        }
      }
    }
  }));

  res.json({ activities: mapped });
}));

app.patch('/api/actividades/:id', requireAuth, wrap(async (req, res) => {
  const activity = await prisma.activity.findUnique({
    where: { id: req.params.id },
    include: { crop: { include: { garden: true } } }
  });
  if (!activity) fail(404, 'Actividad no encontrada.');
  if (activity.status !== 'PENDIENTE') fail(409, 'Solo se pueden editar actividades en estado pendiente.');

  const access = await resolveCommunityAccess(activity.crop.garden.communityId, req.user);
  const isAuthor = activity.volunteerId === req.user.id;
  const canEdit = isAuthor && (access.permissions.includes('EDIT_OWN_ACTIVITIES') || access.isOwner || access.isAdmin);
  if (!canEdit && !access.isAdmin) fail(403, 'No tienes permiso para modificar esta actividad.');

  const data = {};
  if (req.body.note) data.note = str(req.body.note, 'Descripción', 600);
  if (req.body.task) data.task = option(req.body.task, TASKS, 'Tipo de actividad');

  const updated = await prisma.activity.update({ where: { id: activity.id }, data });
  res.json({ activity: updated });
}));

app.patch('/api/actividades/:id/validar-maestro', requireAuth, wrap(async (req, res) => {
  const current = await prisma.activity.findUnique({
    where: { id: req.params.id },
    include: { crop: { include: { garden: { include: { community: true } } } } }
  });
  if (!current) fail(404, 'Actividad no encontrada.');

  const isGlobalAdmin = req.user.role === 'ADMINISTRADOR';
  const isCommunityOwner = current.crop.garden.community.ownerId === req.user.id;

  if (!isGlobalAdmin && !isCommunityOwner) {
    fail(403, 'Solo el propietario de la comunidad o el administrador pueden validar evidencias.');
  }

  // Prevención estricta: un usuario no puede autovalidarse sus propias evidencias para inflar puntos
  if (!isGlobalAdmin && current.volunteerId === req.user.id) {
    fail(403, 'Por transparencia comunitaria, no puedes autovalidar tus propias evidencias.');
  }

  const status = option(req.body.status, ['APROBADA', 'RECHAZADA'], 'Estado');
  const reviewNote = str(req.body.reviewNote, 'Observación', 500, true);
  if (status === 'RECHAZADA' && !reviewNote) fail(400, 'El rechazo debe incluir una observación.');
  if (current.status !== 'PENDIENTE') fail(409, 'Esta evidencia ya fue revisada.');

  const activity = await prisma.$transaction(async (tx) => {
    const points = Number(process.env.POINTS_PER_ACTIVITY || 10) * current.factor;
    const changed = await tx.activity.updateMany({
      where: { id: current.id, status: 'PENDIENTE' },
      data: {
        status,
        reviewNote,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
        pointsAwarded: status === 'APROBADA' ? points : 0
      }
    });
    if (changed.count !== 1) fail(409, 'La evidencia ya fue procesada por otro usuario.');

    if (status === 'APROBADA') {
      const updatedUser = await tx.user.update({
        where: { id: current.volunteerId },
        data: { points: { increment: points } }
      });
      await tx.user.update({
        where: { id: updatedUser.id },
        data: { level: levelForPoints(updatedUser.points) }
      });
      const stage = current.task === 'COSECHA' ? 'COSECHA' : current.task === 'SIEMBRA' ? 'SIEMBRA' : ['RIEGO', 'CUIDADO'].includes(current.task) ? 'CRECIMIENTO' : null;
      if (stage) await tx.crop.update({ where: { id: current.cropId }, data: { stage } });

      await incrementChallengeProgress(tx, current.volunteerId, 'ACTIVITIES_APPROVED', 1);
      if (current.task === 'RIEGO') {
        await incrementChallengeProgress(tx, current.volunteerId, 'IRRIGATION_LOGGED', 1);
      } else if (current.task === 'COSECHA') {
        await incrementChallengeProgress(tx, current.volunteerId, 'HARVEST_LOGGED', 1);
      }
    }

    return tx.activity.findUnique({ where: { id: current.id } });
  });

  await logAudit({
    userId: req.user.id,
    communityId: current.crop.garden.communityId,
    action: 'ACTIVITY_VALIDATED',
    entityType: 'ACTIVITY',
    entityId: activity.id,
    details: { status, pointsAwarded: activity.pointsAwarded, volunteerId: current.volunteerId },
    req
  });

  res.json({ activity });
}));

// Ranking comunitario justo
app.get('/api/ranking', wrap(async (req, res) => {
  if (req.query.status) {
    const st = option(req.query.status, ['PENDIENTE', 'ACTIVO', 'OBSERVADO'], 'Estado');
    where = { AND: [where, { status: st }] };
  }

  const gardens = await prisma.garden.findMany({
    where: { status: 'ACTIVO' },
    include: {
      community: { select: { id: true, name: true, type: true } },
      crops: { select: { id: true, activities: { where: { status: 'APROBADA' }, select: { pointsAwarded: true } } } }
    }
  });

  const ranking = gardens.map(g => {
    const pts = g.crops.reduce((s, c) => s + c.activities.reduce((a, x) => a + x.pointsAwarded, 0), 0);
    return {
      id: g.id,
      name: g.name,
      community: g.community.name,
      type: g.community.type,
      activeCrops: g.crops.length,
      approvedPoints: pts,
      score: rankingScore(pts, g.crops.length)
    };
  }).filter(g => g.activeCrops > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'es'))
    .map((g, i) => ({ ...g, position: i + 1 }));

  res.json({ ranking });
}));

// Resumen / Dashboard
app.get('/api/dashboard', requireAuth, wrap(async (req, res) => {
  const isAdm = req.user.role === 'ADMINISTRADOR';
  const [communities, gardens, pending, approved, pendingInvitations] = await Promise.all([
    prisma.community.count({
      where: isAdm ? {} : {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id, status: 'ACTIVO' } } }
        ]
      }
    }),
    prisma.garden.count({
      where: isAdm ? {} : {
        OR: [
          { community: { ownerId: req.user.id } },
          { community: { members: { some: { userId: req.user.id, status: 'ACTIVO' } } } }
        ]
      }
    }),
    prisma.activity.count({ where: { volunteerId: req.user.id, status: 'PENDIENTE' } }),
    prisma.activity.count({ where: { volunteerId: req.user.id, status: 'APROBADA' } }),
    prisma.communityInvitation.count({
      where: {
        status: 'PENDIENTE',
        OR: [
          { invitedUserId: req.user.id },
          { invitedEmail: req.user.email.toLowerCase() }
        ]
      }
    })
  ]);

  res.json({
    communities,
    gardens,
    pending,
    approved,
    pendingInvitations,
    points: req.user.points,
    level: req.user.level,
    role: req.user.role
  });
}));

// Panel y acciones de administración global
app.get('/api/admin/usuarios', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      level: true,
      points: true,
      suspended: true,
      createdAt: true,
      _count: {
        select: {
          ownedCommunities: true,
          communities: true,
          activities: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ users });
}));

app.patch('/api/admin/usuarios/:id/suspender', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) fail(404, 'Usuario no encontrado.');
  if (target.id === req.user.id) fail(400, 'No puedes suspender tu propia cuenta de administrador.');

  const suspended = req.body.suspended !== undefined ? Boolean(req.body.suspended) : !target.suspended;
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { suspended }
  });

  await logAudit({
    userId: req.user.id,
    action: suspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
    entityType: 'USER',
    entityId: target.id,
    details: { email: target.email, suspended },
    req
  });

  res.json({ user: publicUser(updated), message: suspended ? 'Usuario suspendido.' : 'Usuario reactivado.' });
}));

app.get('/api/admin/auditoria', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      community: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ logs });
}));

// --- SABERES TRADICIONALES Y TALENTOS COMUNITARIOS ---
app.get('/api/talentos/mis-talentos', requireAuth, wrap(async (req, res) => {
  const talents = await prisma.userTalent.findMany({
    where: { userId: req.user.id },
    include: { reviewedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ talents });
}));

app.post('/api/talentos', requireAuth, wrap(async (req, res) => {
  const name = str(req.body.name, 'Nombre del saber o talento', 120);
  const category = option(req.body.category, Object.keys(TALENT_CATEGORIES), 'Categoría');
  const description = str(req.body.description, 'Descripción del saber', 800);
  const experience = str(req.body.experience, 'Trayectoria o experiencia', 500);
  const evidenceUrl = req.body.evidenceUrl ? str(req.body.evidenceUrl, 'Enlace de evidencia', 300, true) : null;

  const talent = await prisma.userTalent.create({
    data: {
      userId: req.user.id,
      name,
      category,
      description,
      experience,
      evidenceUrl,
      status: 'PENDIENTE'
    }
  });

  await logAudit({
    userId: req.user.id,
    action: 'TALENT_DECLARED',
    entityType: 'TALENT',
    entityId: talent.id,
    details: { name, category },
    req
  });

  res.status(201).json({ talent });
}));

app.delete('/api/talentos/:id', requireAuth, wrap(async (req, res) => {
  const talent = await prisma.userTalent.findUnique({ where: { id: req.params.id } });
  if (!talent) fail(404, 'Talento no encontrado.');
  if (talent.userId !== req.user.id && req.user.role !== 'ADMINISTRADOR') {
    fail(403, 'No tienes permiso para eliminar este talento.');
  }
  await prisma.userTalent.delete({ where: { id: talent.id } });
  res.json({ message: 'Talento eliminado correctamente.' });
}));

app.get('/api/talentos/pendientes', requireAuth, wrap(async (req, res) => {
  const isMaestroOrAdmin = req.user.role === 'ADMINISTRADOR' || req.user.level === 'MAESTRO';
  if (!isMaestroOrAdmin) {
    fail(403, 'Solo administradores o usuarios con nivel Maestro pueden validar talentos.');
  }

  const talents = await prisma.userTalent.findMany({
    where: { status: 'PENDIENTE' },
    include: { user: { select: { id: true, name: true, email: true, points: true, level: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ talents });
}));

app.patch('/api/talentos/:id/validar', requireAuth, wrap(async (req, res) => {
  const isMaestroOrAdmin = req.user.role === 'ADMINISTRADOR' || req.user.level === 'MAESTRO';
  if (!isMaestroOrAdmin) {
    fail(403, 'Solo administradores o usuarios con nivel Maestro pueden certificar talentos.');
  }

  const talent = await prisma.userTalent.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!talent) fail(404, 'Talento no encontrado.');
  if (talent.userId === req.user.id && req.user.role !== 'ADMINISTRADOR') {
    fail(403, 'No puedes autovalidar tus propios talentos.');
  }

  const status = option(req.body.status, ['VALIDADO', 'RECHAZADO'], 'Estado');
  const reviewNote = str(req.body.reviewNote, 'Observación o criterio', 500, true);
  if (status === 'RECHAZADO' && !reviewNote) fail(400, 'El rechazo debe incluir una observación.');

  const updated = await prisma.$transaction(async (tx) => {
    const updatedCount = await tx.userTalent.updateMany({
      where: { id: talent.id, status: 'PENDIENTE' },
      data: {
        status,
        reviewNote,
        reviewedById: req.user.id,
        reviewedAt: new Date()
      }
    });

    if (updatedCount.count === 0) {
      fail(409, 'Este talento ya se encuentra validado o procesado.');
    }

    if (status === 'VALIDADO') {
      const bonusPoints = 25;
      const u = await tx.user.update({
        where: { id: talent.userId },
        data: { points: { increment: bonusPoints } }
      });
      await tx.user.update({
        where: { id: u.id },
        data: { level: levelForPoints(u.points) }
      });
    }

    return tx.userTalent.findUnique({ where: { id: talent.id } });
  });

  await logAudit({
    userId: req.user.id,
    action: status === 'VALIDADO' ? 'TALENT_CERTIFIED' : 'TALENT_REJECTED',
    entityType: 'TALENT',
    entityId: talent.id,
    details: { status, candidateId: talent.userId },
    req
  });

  res.json({ talent: updated });
}));

// --- RETOS Y MISIONES COMUNITARIAS ---
app.get('/api/retos', requireAuth, wrap(async (req, res) => {
  const challenges = await prisma.challenge.findMany({
    where: { active: true },
    include: {
      userProgress: {
        where: { userId: req.user.id }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const mapped = challenges.map(c => {
    const p = c.userProgress[0];
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      targetType: c.targetType,
      targetCount: c.targetCount,
      pointsReward: c.pointsReward,
      startDate: c.startDate,
      endDate: c.endDate,
      progress: p ? p.progress : 0,
      completed: p ? p.completed : false,
      completedAt: p?.completedAt || null,
      rewardClaimed: p ? p.rewardClaimed : false,
      claimedAt: p?.claimedAt || null
    };
  });

  res.json({ challenges: mapped });
}));

app.post('/api/retos/:id/reclamar', requireAuth, wrap(async (req, res) => {
  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) fail(404, 'Reto no encontrado.');

  const result = await prisma.$transaction(async (tx) => {
    const userChallenge = await tx.userChallenge.findUnique({
      where: { userId_challengeId: { userId: req.user.id, challengeId: challenge.id } }
    });

    if (!userChallenge || !userChallenge.completed) {
      fail(400, 'Aún no has completado los objetivos de este reto.');
    }
    if (userChallenge.rewardClaimed) {
      fail(409, 'Ya has reclamado la recompensa de este reto anteriormente.');
    }

    const claimRes = await tx.userChallenge.updateMany({
      where: { id: userChallenge.id, rewardClaimed: false, completed: true },
      data: {
        rewardClaimed: true,
        claimedAt: new Date()
      }
    });

    if (claimRes.count === 0) {
      fail(409, 'La recompensa ya fue reclamada.');
    }

    const user = await tx.user.update({
      where: { id: req.user.id },
      data: { points: { increment: challenge.pointsReward } }
    });

    await tx.user.update({
      where: { id: user.id },
      data: { level: levelForPoints(user.points) }
    });

    return { userChallenge: { ...userChallenge, rewardClaimed: true, claimedAt: new Date() }, pointsAwarded: challenge.pointsReward, newTotalPoints: user.points };
  });

  await logAudit({
    userId: req.user.id,
    action: 'CHALLENGE_REWARD_CLAIMED',
    entityType: 'CHALLENGE',
    entityId: challenge.id,
    details: { title: challenge.title, pointsAwarded: challenge.pointsReward },
    req
  });

  res.json(result);
}));

app.post('/api/admin/retos', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const title = str(req.body.title, 'Título del reto', 120);
  const description = str(req.body.description, 'Descripción', 500);
  const category = option(req.body.category || 'ACTIVIDADES', CHALLENGE_CATEGORIES, 'Categoría');
  const targetType = option(req.body.targetType, CHALLENGE_TARGET_TYPES, 'Tipo de objetivo');
  const targetCount = integer(req.body.targetCount, 1, 1000, 'Cantidad objetivo');
  const pointsReward = number(req.body.pointsReward, 1, 500, 'Recompensa en puntos');
  const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(Date.now() + 30 * 86400000);

  const challenge = await prisma.challenge.create({
    data: {
      title,
      description,
      category,
      targetType,
      targetCount,
      pointsReward,
      endDate
    }
  });

  res.status(201).json({ challenge });
}));

app.patch('/api/admin/retos/:id', requireAuth, wrap(async (req, res) => {
  requireAdmin(req);
  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) fail(404, 'Reto no encontrado.');

  const data = {};
  if (req.body.title) data.title = str(req.body.title, 'Título', 120);
  if (req.body.description) data.description = str(req.body.description, 'Descripción', 500);
  if (req.body.active !== undefined) data.active = Boolean(req.body.active);
  if (req.body.pointsReward) data.pointsReward = number(req.body.pointsReward, 1, 500, 'Puntos');

  const updated = await prisma.challenge.update({ where: { id: challenge.id }, data });
  res.json({ challenge: updated });
}));

// --- FORO COMUNITARIO: LA ASAMBLEA ---
app.get('/api/foro/categorias', optionalAuth, wrap(async (req, res) => {
  const categories = await prisma.forumCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { posts: true } } }
  });
  res.json({ categories });
}));

app.get('/api/foro/publicaciones', optionalAuth, wrap(async (req, res) => {
  const where = {};
  if (req.query.categoryId) where.categoryId = str(req.query.categoryId, 'Categoría', 50);
  if (req.query.search) {
    const s = str(req.query.search, 'Búsqueda', 100);
    where.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { content: { contains: s, mode: 'insensitive' } }
    ];
  }

  const posts = await prisma.forumPost.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, level: true } },
      category: { select: { id: true, name: true, slug: true, icon: true } },
      _count: { select: { comments: true } }
    },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 50
  });

  res.json({ posts });
}));

app.get('/api/foro/publicaciones/:id', optionalAuth, wrap(async (req, res) => {
  const post = await prisma.forumPost.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, name: true, level: true, email: true } },
      category: true,
      comments: {
        include: { author: { select: { id: true, name: true, level: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  if (!post) fail(404, 'Publicación no encontrada.');

  prisma.forumPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});

  res.json({ post });
}));

app.post('/api/foro/publicaciones', requireAuth, wrap(async (req, res) => {
  const title = str(req.body.title, 'Título', 150);
  const categoryId = str(req.body.categoryId, 'Categoría', 50);
  const content = str(req.body.content, 'Contenido', 3000);

  const category = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
  if (!category) fail(404, 'Categoría de foro no válida.');

  const post = await prisma.forumPost.create({
    data: {
      authorId: req.user.id,
      categoryId: category.id,
      communityId: req.body.communityId ? str(req.body.communityId, 'Comunidad', 50) : null,
      title,
      content
    },
    include: {
      author: { select: { id: true, name: true, level: true } },
      category: true
    }
  });

  await logAudit({
    userId: req.user.id,
    action: 'FORUM_POST_CREATED',
    entityType: 'FORUM_POST',
    entityId: post.id,
    details: { title, categoryId: category.id },
    req
  });

  res.status(201).json({ post });
}));

app.put('/api/foro/publicaciones/:id', requireAuth, wrap(async (req, res) => {
  const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
  if (!post) fail(404, 'Publicación no encontrada.');
  if (post.authorId !== req.user.id && req.user.role !== 'ADMINISTRADOR') {
    fail(403, 'No tienes permiso para editar esta publicación.');
  }

  const data = {};
  if (req.body.title) data.title = str(req.body.title, 'Título', 150);
  if (req.body.content) data.content = str(req.body.content, 'Contenido', 3000);
  if (req.user.role === 'ADMINISTRADOR') {
    if (req.body.pinned !== undefined) data.pinned = Boolean(req.body.pinned);
    if (req.body.closed !== undefined) data.closed = Boolean(req.body.closed);
  }

  const updated = await prisma.forumPost.update({
    where: { id: post.id },
    data,
    include: { author: { select: { id: true, name: true } }, category: true }
  });
  res.json({ post: updated });
}));

app.delete('/api/foro/publicaciones/:id', requireAuth, wrap(async (req, res) => {
  const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
  if (!post) fail(404, 'Publicación no encontrada.');
  if (post.authorId !== req.user.id && req.user.role !== 'ADMINISTRADOR') {
    fail(403, 'No tienes permiso para eliminar esta publicación.');
  }

  await prisma.forumPost.delete({ where: { id: post.id } });
  res.json({ message: 'Publicación eliminada correctamente.' });
}));

app.post('/api/foro/publicaciones/:id/comentarios', requireAuth, wrap(async (req, res) => {
  const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
  if (!post) fail(404, 'Publicación no encontrada.');
  if (post.closed && req.user.role !== 'ADMINISTRADOR') {
    fail(400, 'Esta conversación está cerrada para nuevos comentarios.');
  }

  const content = str(req.body.content, 'Comentario', 1500);
  const comment = await prisma.forumComment.create({
    data: {
      postId: post.id,
      authorId: req.user.id,
      content
    },
    include: {
      author: { select: { id: true, name: true, level: true } }
    }
  });

  res.status(201).json({ comment });
}));

app.delete('/api/foro/comentarios/:id', requireAuth, wrap(async (req, res) => {
  const comment = await prisma.forumComment.findUnique({ where: { id: req.params.id } });
  if (!comment) fail(404, 'Comentario no encontrado.');
  if (comment.authorId !== req.user.id && req.user.role !== 'ADMINISTRADOR') {
    fail(403, 'No tienes permiso para eliminar este comentario.');
  }

  await prisma.forumComment.delete({ where: { id: comment.id } });
  res.json({ message: 'Comentario eliminado.' });
}));

// --- BODEGA COMUNITARIA E INVENTARIO: EL RESGUARDO ---
app.get('/api/comunidades/:cid/bodega/items', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'VIEW_COMMUNITY');
  const items = await prisma.inventoryItem.findMany({
    where: { communityId: access.community.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });

  const lowStock = items.filter(it => it.quantity <= it.minQuantity);
  res.json({ items, lowStockCount: lowStock.length });
}));

app.post('/api/comunidades/:cid/bodega/items', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'CREATE_GARDENS');
  const name = str(req.body.name, 'Nombre del insumo', 120);
  const category = option(req.body.category, Object.keys(INVENTORY_CATEGORIES), 'Categoría de inventario');
  const unit = str(req.body.unit, 'Unidad de medida', 30);
  const quantity = number(req.body.quantity ?? 0, 0, 100000, 'Cantidad inicial');
  const minQuantity = number(req.body.minQuantity ?? 0, 0, 100000, 'Stock mínimo de alerta');
  const location = req.body.location ? str(req.body.location, 'Ubicación física', 100, true) : null;
  const description = req.body.description ? str(req.body.description, 'Descripción', 400, true) : null;

  const item = await prisma.inventoryItem.create({
    data: {
      communityId: access.community.id,
      name,
      category,
      unit,
      quantity,
      minQuantity,
      location,
      description
    }
  });

  if (quantity > 0) {
    await prisma.inventoryMovement.create({
      data: {
        itemId: item.id,
        type: 'ENTRADA',
        quantity,
        balanceAfter: quantity,
        reason: 'Inventario inicial registrado',
        responsibleUserId: req.user.id
      }
    });
  }

  res.status(201).json({ item });
}));

app.post('/api/comunidades/:cid/bodega/items/:id/movimiento', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'REGISTER_ACTIVITIES');
  const item = await prisma.inventoryItem.findUnique({
    where: { id: req.params.id }
  });
  if (!item || item.communityId !== access.community.id) fail(404, 'Insumo no encontrado en la comunidad.');

  const type = option(req.body.type, INVENTORY_MOVEMENT_TYPES, 'Tipo de movimiento');
  const qty = number(req.body.quantity, 0.01, 100000, 'Cantidad');
  const reason = str(req.body.reason, 'Motivo o labor asociada', 300);

  const result = await prisma.$transaction(async (tx) => {
    const currentItem = await tx.inventoryItem.findUnique({
      where: { id: item.id }
    });
    if (!currentItem) fail(404, 'Insumo no encontrado en la comunidad.');

    let balanceAfter = currentItem.quantity;
    if (type === 'ENTRADA') {
      balanceAfter += qty;
    } else if (type === 'SALIDA') {
      if (currentItem.quantity < qty) {
        fail(400, `Stock insuficiente: disponible ${currentItem.quantity} ${currentItem.unit}, intentas retirar ${qty} ${currentItem.unit}.`);
      }
      balanceAfter -= qty;
    } else if (type === 'AJUSTE') {
      balanceAfter = qty;
    }

    const updatedItem = await tx.inventoryItem.update({
      where: { id: currentItem.id },
      data: { quantity: balanceAfter }
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        itemId: currentItem.id,
        type,
        quantity: qty,
        balanceAfter,
        reason,
        responsibleUserId: req.user.id
      },
      include: { responsibleUser: { select: { id: true, name: true } } }
    });

    return { item: updatedItem, movement };
  });

  res.status(201).json(result);
}));

app.get('/api/comunidades/:cid/bodega/movimientos', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'VIEW_COMMUNITY');
  const movements = await prisma.inventoryMovement.findMany({
    where: { item: { communityId: access.community.id } },
    include: {
      item: { select: { id: true, name: true, category: true, unit: true } },
      responsibleUser: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ movements });
}));

// Lotes de Secado y Conservación Postcosecha
app.get('/api/comunidades/:cid/bodega/secados', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'VIEW_COMMUNITY');
  const batches = await prisma.dryingBatch.findMany({
    where: { communityId: access.community.id },
    include: {
      plant: { select: { id: true, commonName: true, scientific: true } },
      responsibleUser: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ batches });
}));

app.post('/api/comunidades/:cid/bodega/secados', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'REGISTER_ACTIVITIES');
  const plantId = str(req.body.plantId, 'Planta', 60);
  const plant = await prisma.plant.findUnique({ where: { id: plantId } });
  if (!plant) fail(404, 'Especie botánica no encontrada.');

  const harvestDate = req.body.harvestDate ? new Date(req.body.harvestDate) : new Date();
  const initialWeightGrams = req.body.initialWeightGrams ? number(req.body.initialWeightGrams, 1, 100000, 'Peso inicial fresco (g)') : null;
  const conditions = req.body.conditions ? str(req.body.conditions, 'Condiciones de secado', 300, true) : 'Sombra, ventilación natural andina, 18-22°C';
  const notes = req.body.notes ? str(req.body.notes, 'Notas de lote', 400, true) : null;

  const countToday = await prisma.dryingBatch.count();
  const dateStr = harvestDate.toISOString().slice(0, 10).replace(/-/g, '');
  const lotNumber = `SEC-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

  const batch = await prisma.dryingBatch.create({
    data: {
      communityId: access.community.id,
      plantId: plant.id,
      cropId: req.body.cropId ? str(req.body.cropId, 'Cultivo', 60, true) : null,
      lotNumber,
      harvestDate,
      dryingStartDate: new Date(),
      initialWeightGrams,
      conditions,
      notes,
      responsibleUserId: req.user.id
    },
    include: {
      plant: { select: { id: true, commonName: true, scientific: true } },
      responsibleUser: { select: { id: true, name: true } }
    }
  });

  res.status(201).json({ batch });
}));

app.patch('/api/comunidades/:cid/bodega/secados/:id', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'REGISTER_ACTIVITIES');
  const batch = await prisma.dryingBatch.findUnique({ where: { id: req.params.id } });
  if (!batch || batch.communityId !== access.community.id) fail(404, 'Lote de secado no encontrado.');

  const data = {};
  if (req.body.status) data.status = option(req.body.status, DRYING_STATUSES, 'Estado de secado');
  if (req.body.dryWeightGrams !== undefined && req.body.dryWeightGrams !== '') {
    data.dryWeightGrams = number(req.body.dryWeightGrams, 0.1, 100000, 'Peso seco final (g)');
  }
  if (req.body.notes) data.notes = str(req.body.notes, 'Notas', 400, true);
  if (data.status === 'FINALIZADO' && !batch.dryingEndDate) {
    data.dryingEndDate = new Date();
  }

  const updated = await prisma.dryingBatch.update({
    where: { id: batch.id },
    data,
    include: {
      plant: { select: { id: true, commonName: true, scientific: true } },
      responsibleUser: { select: { id: true, name: true } }
    }
  });
  res.json({ batch: updated });
}));

app.get('/api/comunidades/:cid/bodega/secados/:id/etiqueta', requireAuth, wrap(async (req, res) => {
  const access = await resolveCommunityAccess(req.params.cid, req.user, 'VIEW_COMMUNITY');
  const batch = await prisma.dryingBatch.findUnique({
    where: { id: req.params.id },
    include: {
      plant: true,
      community: true,
      responsibleUser: { select: { id: true, name: true, email: true } }
    }
  });
  if (!batch || batch.communityId !== access.community.id) fail(404, 'Lote de secado no encontrado.');

  const harvestStr = batch.harvestDate.toISOString().slice(0, 10);
  const dryStr = batch.dryingEndDate ? batch.dryingEndDate.toISOString().slice(0, 10) : 'En proceso';
  const label = {
    lotNumber: batch.lotNumber,
    product: batch.plant.commonName,
    scientific: batch.plant.scientific,
    harvestPart: batch.plant.harvestPart || 'Hojas y sumidades floridas',
    netWeight: '100 g',
    communityName: batch.community.name,
    parish: batch.community.parish || 'Parroquia Comunitaria',
    province: batch.community.province || 'Ecuador',
    harvestDate: harvestStr,
    packingDate: dryStr,
    expiryDate: new Date(batch.harvestDate.getTime() + 365 * 86400000).toISOString().slice(0, 10),
    conditions: batch.conditions || 'Conservar en lugar fresco, seco y oscuro',
    responsible: batch.responsibleUser.name,
    standard: 'Norma Técnica MSP 2017 — Plantas Medicinales Ancestrales',
    qrPayload: `KAWSAPACHA:LOTE=${batch.lotNumber}:PLANTA=${batch.plant.scientific}:COMUNIDAD=${batch.community.id}`
  };

  res.json({ label });
}));

// Fallbacks y manejo de errores
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'La foto supera el máximo de 5 MB.' : 'No se pudo procesar el archivo.' });
  }
  if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe un registro con ese nombre, correo o casilla.' });
  if (error.code === 'P2025') return res.status(404).json({ error: 'Registro no encontrado.' });
  if (error.status) return res.status(error.status).json({ error: error.message });
  console.error('[ERROR]', error);
  return res.status(500).json({ error: 'Ocurrió un error interno. Vuelve a intentarlo.' });
});

const PORT = Number(process.env.PORT || 3000);
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Kawsapacha MVP disponible en puerto ${PORT}`));
}

module.exports = { app, prisma };
