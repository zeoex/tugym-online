const prisma = require('../config/database');

function inicioDia(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}
function finDia(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
}

exports.hoy = async (req, res, next) => {
  try {
    const inicio = inicioDia();
    const fin    = finDia();
    const caja   = await prisma.cajaDia.findFirst({ where: { fecha: { gte: inicio, lt: fin } } });
    res.json(caja || null);
  } catch (err) { next(err); }
};

exports.abrir = async (req, res, next) => {
  try {
    const inicio = inicioDia();
    const fin    = finDia();
    const existe = await prisma.cajaDia.findFirst({ where: { fecha: { gte: inicio, lt: fin } } });
    if (existe) return res.status(400).json({ error: 'Ya existe una caja abierta hoy' });

    const caja = await prisma.cajaDia.create({
      data: {
        fecha: inicio,
        montoApertura: parseFloat(req.body.montoApertura) || 0,
        observaciones: req.body.observaciones || null,
        estado: 'ABIERTA',
      },
    });
    res.status(201).json(caja);
  } catch (err) { next(err); }
};

exports.cerrar = async (req, res, next) => {
  try {
    const caja = await prisma.cajaDia.findUniqueOrThrow({ where: { id: parseInt(req.params.id) } });
    if (caja.estado === 'CERRADA') return res.status(400).json({ error: 'La caja ya está cerrada' });

    const actualizada = await prisma.cajaDia.update({
      where: { id: caja.id },
      data: {
        montoCierre: parseFloat(req.body.montoCierre) || 0,
        observaciones: req.body.observaciones || caja.observaciones,
        estado: 'CERRADA',
      },
    });
    res.json(actualizada);
  } catch (err) { next(err); }
};

exports.resumen = async (req, res, next) => {
  try {
    const caja = await prisma.cajaDia.findUniqueOrThrow({ where: { id: parseInt(req.params.id) } });

    const inicio = inicioDia(new Date(caja.fecha));
    const fin    = finDia(new Date(caja.fecha));

    const pagos = await prisma.pago.findMany({
      where: { fechaPago: { gte: inicio, lt: fin } },
      include: { socio: { select: { nombre: true, apellido: true } }, plan: { select: { nombre: true } } },
      orderBy: { fechaPago: 'asc' },
    });

    const totalPagos = pagos.reduce((acc, p) => acc + p.monto, 0);
    const porMetodo  = pagos.reduce((acc, p) => {
      acc[p.metodoPago] = (acc[p.metodoPago] || 0) + p.monto;
      return acc;
    }, {});

    res.json({
      caja,
      pagos,
      totalPagos,
      porMetodo,
      diferencia: caja.montoCierre != null
        ? caja.montoCierre - (caja.montoApertura + totalPagos)
        : null,
    });
  } catch (err) { next(err); }
};

exports.listar = async (req, res, next) => {
  try {
    const cajas = await prisma.cajaDia.findMany({ orderBy: { fecha: 'desc' }, take: 30 });
    res.json(cajas);
  } catch (err) { next(err); }
};
