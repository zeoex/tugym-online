const prisma = require('../config/database');

// Nunca devolver el hash de la contraseña del portal
function sinPin(socio) {
  if (!socio) return socio;
  const { pinHash, ...resto } = socio;
  return { ...resto, portalActivado: Boolean(pinHash) };
}

exports.listar = async (req, res, next) => {
  try {
    const { q = '', estado, page = 1, limit = 20, planId, venceProximo, fechaAltaDesde, fechaAltaHasta } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);
    en7Dias.setHours(23, 59, 59, 999);

    const pagoCondiciones = {};
    const parsedPlanId = parseInt(planId);
    if (planId && !isNaN(parsedPlanId)) pagoCondiciones.planId = parsedPlanId;
    if (venceProximo === 'true') {
      pagoCondiciones.estado = 'ACTIVO';
      pagoCondiciones.fechaVencimiento = { gte: hoy, lte: en7Dias };
    }

    const fechaDesdeDate = fechaAltaDesde ? new Date(fechaAltaDesde) : null;
    const fechaHastaDate = fechaAltaHasta ? new Date(fechaAltaHasta + 'T23:59:59.999Z') : null;
    const fechaDesdeValida = fechaDesdeDate && !isNaN(fechaDesdeDate.getTime());
    const fechaHastaValida = fechaHastaDate && !isNaN(fechaHastaDate.getTime());

    const where = {
      ...(estado && { estado }),
      ...(q && {
        OR: [
          { nombre:   { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { dni:      { contains: q, mode: 'insensitive' } },
          { email:    { contains: q, mode: 'insensitive' } },
        ],
      }),
      // single pagos.some so planId+venceProximo require one pago to satisfy both conditions
      ...(Object.keys(pagoCondiciones).length > 0 && { pagos: { some: pagoCondiciones } }),
      ...((fechaDesdeValida || fechaHastaValida) && {
        fechaAlta: {
          ...(fechaDesdeValida && { gte: fechaDesdeDate }),
          ...(fechaHastaValida && { lte: fechaHastaDate }),
        },
      }),
    };

    const [socios, total] = await Promise.all([
      prisma.socio.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: {
          pagos: { where: { estado: 'ACTIVO' }, orderBy: { fechaVencimiento: 'desc' }, take: 1 },
        },
      }),
      prisma.socio.count({ where }),
    ]);
    res.json({ datos: socios.map(sinPin), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const socio = await prisma.socio.findUniqueOrThrow({
      where: { id: parseInt(req.params.id) },
      include: { pagos: { include: { plan: true }, orderBy: { fechaPago: 'desc' } } },
    });
    res.json(sinPin(socio));
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const socio = await prisma.socio.create({ data: req.body });
    res.status(201).json(socio);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const { pinHash: _ignorar, portalActivado: _tampoco, ...data } = req.body;
    const socio = await prisma.socio.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(sinPin(socio));
  } catch (err) { next(err); }
};

// Recepción resetea el acceso al portal: el socio crea contraseña nueva al entrar.
exports.resetearPortal = async (req, res, next) => {
  try {
    await prisma.socio.update({
      where: { id: parseInt(req.params.id) },
      data: { pinHash: null },
    });
    res.json({ mensaje: 'Acceso reseteado: el socio creará su contraseña la próxima vez que entre al portal' });
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await prisma.socio.update({
      where: { id: parseInt(req.params.id) },
      data: { estado: 'INACTIVO' },
    });
    res.json({ mensaje: 'Socio dado de baja' });
  } catch (err) { next(err); }
};

exports.subirFoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const foto = `/uploads/${req.file.filename}`;
    await prisma.socio.update({ where: { id: parseInt(req.params.id) }, data: { foto } });
    res.json({ foto });
  } catch (err) { next(err); }
};
