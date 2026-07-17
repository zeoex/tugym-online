const prisma = require('../config/database');
const { obtenerConfig } = require('./configController');

exports.stats = async (req, res, next) => {
  try {
    const config = await obtenerConfig();
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    // Días de anticipación configurables desde el centro de configuración.
    const enXdias = new Date(); enXdias.setDate(hoy.getDate() + (config.diasAviso || 3));

    const [sociosActivos, sociosVencidos, pagosHoy, proximosVencer, vencidosHoy] = await Promise.all([
      prisma.socio.count({ where: { estado: 'ACTIVO' } }),
      prisma.socio.count({
        where: {
          OR: [
            { estado: 'VENCIDO' },
            {
              AND: [
                { estado: 'ACTIVO' },
                { pagos: { some: { estado: 'ACTIVO', fechaVencimiento: { lt: hoy } } } },
                { NOT: { pagos: { some: { estado: 'ACTIVO', fechaVencimiento: { gte: hoy } } } } },
              ],
            },
          ],
        },
      }),
      prisma.pago.aggregate({
        where: { fechaPago: { gte: inicioDia } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.pago.count({
        where: { estado: 'ACTIVO', fechaVencimiento: { lte: enXdias, gte: hoy } },
      }),
      prisma.pago.count({
        where: { estado: 'ACTIVO', fechaVencimiento: { lt: hoy } },
      }),
    ]);

    res.json({
      sociosActivos,
      sociosVencidos,
      recaudacionDia: pagosHoy._sum.monto ?? 0,
      pagosDia: pagosHoy._count,
      proximosVencer,
      vencidosHoy,
      diasAviso: config.diasAviso || 3,
    });
  } catch (err) { next(err); }
};
