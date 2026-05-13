const prisma = require('../config/database');

const calcularVencimiento = (plan) => {
  const d = new Date();
  d.setDate(d.getDate() + plan.duracionDias);
  return d;
};

exports.listar = async (req, res, next) => {
  try {
    const { socioId, estado, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(socioId && { socioId: parseInt(socioId) }),
      ...(estado  && { estado }),
    };
    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { fechaPago: 'desc' },
        include: { socio: { select: { nombre: true, apellido: true } }, plan: true },
      }),
      prisma.pago.count({ where }),
    ]);
    res.json({ datos: pagos, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { socioId, planId, metodoPago, observaciones, monto: montoOverride } = req.body;
    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: parseInt(planId) } });
    const fechaVencimiento = calcularVencimiento(plan);

    const pago = await prisma.pago.create({
      data: {
        socioId: parseInt(socioId),
        planId: parseInt(planId),
        monto: montoOverride ?? plan.precio,
        fechaVencimiento,
        metodoPago: metodoPago || 'EFECTIVO',
        observaciones,
        estado: 'ACTIVO',
      },
      include: { socio: true, plan: true },
    });

    await prisma.socio.update({ where: { id: parseInt(socioId) }, data: { estado: 'ACTIVO' } });

    res.status(201).json(pago);
  } catch (err) { next(err); }
};

exports.cancelar = async (req, res, next) => {
  try {
    const pago = await prisma.pago.update({
      where: { id: parseInt(req.params.id) },
      data: { estado: 'CANCELADO' },
    });
    res.json(pago);
  } catch (err) { next(err); }
};

exports.proximos = async (req, res, next) => {
  try {
    const dias = parseInt(req.query.dias || 3);
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    const pagos = await prisma.pago.findMany({
      where: { estado: 'ACTIVO', fechaVencimiento: { lte: limite, gte: new Date() } },
      include: { socio: true, plan: true },
      orderBy: { fechaVencimiento: 'asc' },
    });
    res.json(pagos);
  } catch (err) { next(err); }
};

exports.historialSocio = async (req, res, next) => {
  try {
    const pagos = await prisma.pago.findMany({
      where: { socioId: parseInt(req.params.socioId) },
      include: { plan: true },
      orderBy: { fechaPago: 'desc' },
    });
    res.json(pagos);
  } catch (err) { next(err); }
};
