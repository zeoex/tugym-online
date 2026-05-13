const prisma = require('../config/database');

exports.stats = async (req, res, next) => {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const en3dias = new Date(); en3dias.setDate(hoy.getDate() + 3);

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
        where: { estado: 'ACTIVO', fechaVencimiento: { lte: en3dias, gte: hoy } },
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
    });
  } catch (err) { next(err); }
};
