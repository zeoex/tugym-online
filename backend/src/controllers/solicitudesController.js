const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { buscarSocioPorDni } = require('../services/asistenciaService');

const SEXOS = ['MASCULINO', 'FEMENINO', 'OTROS'];
const ESTADOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Helpers ──────────────────────────────────────────────────────────

// El hash de la contraseña elegida nunca sale en una respuesta.
function sinPin(solicitud) {
  if (!solicitud) return solicitud;
  const { pinHash, ...resto } = solicitud;
  return resto;
}

function socioSinPin(socio) {
  if (!socio) return socio;
  const { pinHash, ...resto } = socio;
  return { ...resto, portalActivado: Boolean(pinHash) };
}

const normalizarDni = (dni) => String(dni ?? '').replace(/[.\-\s]/g, '');

const limpiarTexto = (v, max = 200) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};

// Valida y normaliza los datos personales (compartido entre alta pública y
// overrides de aprobación). Devuelve { error } o { data }.
function validarDatos(body, { parcial = false } = {}) {
  const data = {};

  for (const campo of ['nombre', 'apellido']) {
    const v = body[campo];
    if (v === undefined && parcial) continue;
    const s = String(v ?? '').trim();
    if (s.length < 2 || s.length > 60) {
      const etiqueta = campo === 'nombre' ? 'El nombre' : 'El apellido';
      return { error: `${etiqueta} es obligatorio (entre 2 y 60 caracteres)` };
    }
    data[campo] = s;
  }

  if (body.email !== undefined) {
    const email = limpiarTexto(body.email, 120);
    if (email && !EMAIL_RE.test(email)) return { error: 'El email no tiene un formato válido' };
    data.email = email ? email.toLowerCase() : null;
  }

  if (body.telefono !== undefined) data.telefono = limpiarTexto(body.telefono, 40);

  if (body.sexo !== undefined && body.sexo !== null && body.sexo !== '') {
    const sexo = String(body.sexo).trim().toUpperCase();
    if (!SEXOS.includes(sexo)) return { error: 'El sexo debe ser MASCULINO, FEMENINO u OTROS' };
    data.sexo = sexo;
  }

  if (body.fechaNac !== undefined) {
    if (body.fechaNac === null || body.fechaNac === '') {
      data.fechaNac = null;
    } else {
      const f = new Date(body.fechaNac);
      if (isNaN(f.getTime())) return { error: 'La fecha de nacimiento no es válida' };
      if (f > new Date()) return { error: 'La fecha de nacimiento no puede ser futura' };
      data.fechaNac = f;
    }
  }

  return { data };
}

// ── Público: POST /api/portal/solicitudes ────────────────────────────
exports.crear = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { error, data } = validarDatos(body);
    if (error) return res.status(400).json({ error });

    const dni = normalizarDni(body.dni);
    if (!/^\d{7,8}$/.test(dni)) {
      return res.status(400).json({ error: 'El DNI debe tener 7 u 8 números, sin puntos' });
    }

    const password = String(body.password ?? '');
    if (password.length < 4 || password.length > 64) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 4 y 64 caracteres' });
    }

    if (await buscarSocioPorDni(dni)) {
      return res.status(409).json({ error: 'Ese DNI ya es socio del gym. Ingresá con tu contraseña.', yaSocio: true });
    }

    const pendiente = await prisma.solicitudSocio.findFirst({
      where: { dni, estado: 'PENDIENTE' },
      select: { id: true },
    });
    if (pendiente) {
      return res.json({ ok: true, yaPendiente: true, mensaje: 'Tu solicitud ya está en revisión. Te avisamos cuando esté lista.' });
    }

    const pinHash = await bcrypt.hash(password, 10);
    await prisma.solicitudSocio.create({
      data: {
        ...data,
        dni,
        mensaje: limpiarTexto(body.mensaje, 500),
        pinHash,
      },
    });

    res.status(201).json({
      ok: true,
      mensaje: 'Recibimos tu solicitud. Cuando el gym la apruebe vas a poder ingresar con tu DNI y la contraseña que elegiste.',
    });
  } catch (err) { next(err); }
};

// ── Admin: GET /api/solicitudes?estado= ──────────────────────────────
exports.listar = async (req, res, next) => {
  try {
    const estado = String(req.query.estado || 'PENDIENTE').toUpperCase();
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido: usá PENDIENTE, APROBADA o RECHAZADA' });
    }
    const solicitudes = await prisma.solicitudSocio.findMany({
      where: { estado },
      orderBy: { createdAt: 'desc' },
      include: { socio: { select: { id: true, nombre: true, apellido: true } } },
    });
    res.json(solicitudes.map(sinPin));
  } catch (err) { next(err); }
};

// ── Admin: GET /api/solicitudes/pendientes/count ─────────────────────
exports.contarPendientes = async (_req, res, next) => {
  try {
    const total = await prisma.solicitudSocio.count({ where: { estado: 'PENDIENTE' } });
    res.json({ total });
  } catch (err) { next(err); }
};

async function obtenerPendiente(id, res) {
  if (!Number.isInteger(id)) {
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return null;
  }
  const solicitud = await prisma.solicitudSocio.findUnique({ where: { id } });
  if (!solicitud) {
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return null;
  }
  if (solicitud.estado !== 'PENDIENTE') {
    res.status(409).json({ error: 'La solicitud ya fue resuelta' });
    return null;
  }
  return solicitud;
}

// ── Admin: POST /api/solicitudes/:id/aprobar ─────────────────────────
// Crea el Socio con el pinHash de la solicitud: el portal le anda de una.
exports.aprobar = async (req, res, next) => {
  try {
    const solicitud = await obtenerPendiente(parseInt(req.params.id), res);
    if (!solicitud) return;

    const body = req.body || {};
    const { error, data: overrides } = validarDatos(body, { parcial: true });
    if (error) return res.status(400).json({ error });

    const dni = normalizarDni(solicitud.dni);
    const email = overrides.email !== undefined ? overrides.email : solicitud.email;

    if (await buscarSocioPorDni(dni)) {
      return res.status(409).json({ error: 'Ya existe un socio con ese DNI' });
    }
    if (email) {
      const otro = await prisma.socio.findUnique({ where: { email }, select: { id: true } });
      if (otro) return res.status(409).json({ error: 'Ya existe un socio con ese email' });
    }

    const ahora = new Date();
    const resultado = await prisma.$transaction(async (tx) => {
      const socio = await tx.socio.create({
        data: {
          nombre:        overrides.nombre        ?? solicitud.nombre,
          apellido:      overrides.apellido      ?? solicitud.apellido,
          dni,
          email,
          telefono:      overrides.telefono      !== undefined ? overrides.telefono : solicitud.telefono,
          sexo:          overrides.sexo          ?? solicitud.sexo,
          fechaNac:      overrides.fechaNac      !== undefined ? overrides.fechaNac : solicitud.fechaNac,
          observaciones: limpiarTexto(body.observaciones, 1000),
          estado:        'ACTIVO',
          fechaAlta:     ahora,
          pinHash:       solicitud.pinHash,
        },
      });
      const actualizada = await tx.solicitudSocio.update({
        where: { id: solicitud.id },
        data: { estado: 'APROBADA', resueltaAt: ahora, socioId: socio.id },
        include: { socio: { select: { id: true, nombre: true, apellido: true } } },
      });
      return { socio, solicitud: actualizada };
    });

    res.status(201).json({ socio: socioSinPin(resultado.socio), solicitud: sinPin(resultado.solicitud) });
  } catch (err) {
    // Carrera: alguien creó el socio entre la verificación y la transacción.
    if (err.code === 'P2002') {
      const campo = (err.meta?.target || []).join(',');
      const cual = campo.includes('email') ? 'email' : 'DNI';
      return res.status(409).json({ error: `Ya existe un socio con ese ${cual}` });
    }
    next(err);
  }
};

// ── Admin: POST /api/solicitudes/:id/rechazar ────────────────────────
exports.rechazar = async (req, res, next) => {
  try {
    const solicitud = await obtenerPendiente(parseInt(req.params.id), res);
    if (!solicitud) return;

    const actualizada = await prisma.solicitudSocio.update({
      where: { id: solicitud.id },
      data: {
        estado: 'RECHAZADA',
        resueltaAt: new Date(),
        motivoRechazo: limpiarTexto((req.body || {}).motivo, 500),
      },
    });
    res.json({ solicitud: sinPin(actualizada) });
  } catch (err) { next(err); }
};
