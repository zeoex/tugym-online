const prisma = require('../config/database');
const {
  parsearFechaLocal, claveDia, claveMes, formatoLocal,
  rangoLocal, listarDias, listarMeses,
} = require('../utils/fechasLocales');

const MAX_DIAS = 731;
const TOPE_DETALLE = 5000;

const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const r1 = (n) => Math.round((n + Number.EPSILON) * 10) / 10;
const pct = (parte, total) => (total > 0 ? r1((parte / total) * 100) : 0);
const variacion = (actual, anterior) => (anterior > 0 ? r1(((actual - anterior) / anterior) * 100) : null);
const nombreSocio = (s) => `${s.apellido}, ${s.nombre}`;

// Lee ?desde&hasta (inclusivos, hora local). Default: del 1° del mes a hoy.
// Devuelve { inicio, fin (exclusivo), dias, desde, hasta } o lanza con status 400.
function leerPeriodo(query) {
  const hoy = new Date();
  const desde = query.desde ? parsearFechaLocal(query.desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hasta = query.hasta ? parsearFechaLocal(query.hasta) : hoy;
  if (!desde || !hasta) throw Object.assign(new Error('Formato de fecha inválido (YYYY-MM-DD)'), { status: 400 });
  if (desde > hasta) throw Object.assign(new Error('"desde" no puede ser posterior a "hasta"'), { status: 400 });
  const { inicio, fin, dias } = rangoLocal(desde, hasta);
  if (dias > MAX_DIAS) throw Object.assign(new Error(`El rango no puede superar ${MAX_DIAS} días`), { status: 400 });
  return { inicio, fin, dias, desde: claveDia(inicio), hasta: claveDia(new Date(fin.getTime() - 1)) };
}

// Pagos cancelados no son recaudación: quedan fuera de los agregados (en el
// detalle exportable sí van, con su estado, para que se vean).
const SIN_CANCELADOS = { estado: { not: 'CANCELADO' } };

exports.resumen = async (req, res, next) => {
  try {
    const periodo = leerPeriodo(req.query);
    const { inicio, fin, dias } = periodo;
    // Período inmediatamente anterior, del mismo largo en días.
    const inicioAnt = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - dias);
    const finAnt = inicio;

    const [pagos, pagosAnt, asistencias, asistenciasAnt, nuevos, nuevosAnt, porEstado, cajas] = await Promise.all([
      prisma.pago.findMany({
        where: { ...SIN_CANCELADOS, fechaPago: { gte: inicio, lt: fin } },
        select: {
          monto: true, recargo: true, fechaPago: true, metodoPago: true, socioId: true,
          plan: { select: { id: true, nombre: true, tipo: true } },
        },
      }),
      prisma.pago.aggregate({
        where: { ...SIN_CANCELADOS, fechaPago: { gte: inicioAnt, lt: finAnt } },
        _sum: { monto: true }, _count: { _all: true },
      }),
      prisma.asistencia.findMany({
        where: { fecha: { gte: inicio, lt: fin } },
        select: { fecha: true, socioId: true },
      }),
      prisma.asistencia.count({ where: { fecha: { gte: inicioAnt, lt: finAnt } } }),
      prisma.socio.findMany({
        where: { fechaAlta: { gte: inicio, lt: fin } },
        select: { fechaAlta: true },
      }),
      prisma.socio.count({ where: { fechaAlta: { gte: inicioAnt, lt: finAnt } } }),
      prisma.socio.groupBy({ by: ['estado'], _count: { _all: true } }),
      prisma.cajaDia.findMany({
        where: { fecha: { gte: inicio, lt: fin } },
        orderBy: { fecha: 'desc' },
        select: { fecha: true, montoApertura: true, montoCierre: true, estado: true },
      }),
    ]);

    // --- Series vacías con ceros para cada día / mes / hora del rango ---
    const porDia = new Map(listarDias(inicio, fin).map((f) => [f, { fecha: f, monto: 0, pagos: 0, asistencias: 0, nuevosSocios: 0 }]));
    const porMes = new Map(listarMeses(inicio, fin).map((m) => [m, { mes: m, monto: 0, pagos: 0, asistencias: 0 }]));
    const porHora = Array.from({ length: 24 }, (_, hora) => ({ hora, asistencias: 0 }));
    const efectivoPorDia = new Map(); // para la caja
    const totalPorDia = new Map();

    // --- Pagos ---
    let recaudado = 0;
    let recargos = 0;
    const sociosPagaron = new Set();
    const medios = new Map();
    const planes = new Map();
    const tipos = new Map();
    const acumular = (mapa, clave, base, p) => {
      const e = mapa.get(clave) || { ...base, cantidad: 0, monto: 0 };
      e.cantidad++;
      e.monto += p.monto;
      mapa.set(clave, e);
    };

    for (const p of pagos) {
      recaudado += p.monto;
      recargos += p.recargo || 0;
      sociosPagaron.add(p.socioId);
      acumular(medios, p.metodoPago, { metodo: p.metodoPago }, p);
      acumular(planes, p.plan.id, { planId: p.plan.id, plan: p.plan.nombre, tipo: p.plan.tipo }, p);
      acumular(tipos, p.plan.tipo, { tipo: p.plan.tipo }, p);

      const dia = claveDia(p.fechaPago);
      const d = porDia.get(dia);
      if (d) { d.monto += p.monto; d.pagos++; }
      const m = porMes.get(claveMes(p.fechaPago));
      if (m) { m.monto += p.monto; m.pagos++; }
      totalPorDia.set(dia, (totalPorDia.get(dia) || 0) + p.monto);
      if (p.metodoPago === 'EFECTIVO') efectivoPorDia.set(dia, (efectivoPorDia.get(dia) || 0) + p.monto);
    }

    // --- Asistencias ---
    const sociosAsistieron = new Set();
    for (const a of asistencias) {
      sociosAsistieron.add(a.socioId);
      porHora[a.fecha.getHours()].asistencias++;
      const d = porDia.get(claveDia(a.fecha));
      if (d) d.asistencias++;
      const m = porMes.get(claveMes(a.fecha));
      if (m) m.asistencias++;
    }

    // --- Nuevos socios ---
    for (const s of nuevos) {
      const d = porDia.get(claveDia(s.fechaAlta));
      if (d) d.nuevosSocios++;
    }

    const conPorcentaje = (lista) => lista
      .map((e) => ({ ...e, monto: r2(e.monto), porcentaje: pct(e.monto, recaudado) }))
      .sort((a, b) => b.monto - a.monto);

    const estadoCount = (estado) => porEstado.find((e) => e.estado === estado)?._count._all || 0;
    const recaudadoAnt = r2(pagosAnt._sum.monto || 0);
    const pagosAntCount = pagosAnt._count._all;

    res.json({
      periodo: { desde: periodo.desde, hasta: periodo.hasta, dias },
      totales: {
        recaudado: r2(recaudado),
        pagos: pagos.length,
        recargos: r2(recargos),
        ticketPromedio: pagos.length ? r2(recaudado / pagos.length) : 0,
        sociosQuePagaron: sociosPagaron.size,
        nuevosSocios: nuevos.length,
        asistencias: asistencias.length,
        sociosQueAsistieron: sociosAsistieron.size,
        sociosActivos: estadoCount('ACTIVO'),
        sociosVencidos: estadoCount('VENCIDO'),
      },
      comparativa: {
        anterior: { recaudado: recaudadoAnt, pagos: pagosAntCount, asistencias: asistenciasAnt, nuevosSocios: nuevosAnt },
        variacion: {
          recaudado: variacion(recaudado, recaudadoAnt),
          pagos: variacion(pagos.length, pagosAntCount),
          asistencias: variacion(asistencias.length, asistenciasAnt),
          nuevosSocios: variacion(nuevos.length, nuevosAnt),
        },
      },
      porMedioPago: conPorcentaje([...medios.values()]),
      porPlan: conPorcentaje([...planes.values()]),
      porTipoPlan: conPorcentaje([...tipos.values()]),
      porDia: [...porDia.values()].map((d) => ({ ...d, monto: r2(d.monto) })),
      porMes: [...porMes.values()].map((m) => ({ ...m, monto: r2(m.monto) })),
      porHora,
      caja: cajas.map((c) => {
        const dia = claveDia(c.fecha);
        const cobradoEfectivo = r2(efectivoPorDia.get(dia) || 0);
        const esperado = r2(c.montoApertura + cobradoEfectivo);
        return {
          fecha: dia,
          montoApertura: r2(c.montoApertura),
          montoCierre: c.montoCierre != null ? r2(c.montoCierre) : null,
          estado: c.estado,
          cobradoEfectivo,
          cobradoTotal: r2(totalPorDia.get(dia) || 0),
          esperado,
          diferencia: c.montoCierre != null ? r2(c.montoCierre - esperado) : null,
        };
      }),
    });
  } catch (err) { next(err); }
};

// Detalle de pagos del período para exportar (todos los estados, con el estado a la vista).
exports.pagos = async (req, res, next) => {
  try {
    const { inicio, fin } = leerPeriodo(req.query);
    const filas = await prisma.pago.findMany({
      where: { fechaPago: { gte: inicio, lt: fin } },
      orderBy: { fechaPago: 'desc' },
      take: TOPE_DETALLE + 1,
      select: {
        id: true, fechaPago: true, monto: true, recargo: true, metodoPago: true,
        fechaVencimiento: true, estado: true, observaciones: true,
        socio: { select: { nombre: true, apellido: true, dni: true } },
        plan: { select: { nombre: true, tipo: true } },
      },
    });
    if (filas.length > TOPE_DETALLE) { res.set('X-Truncado', 'true'); filas.length = TOPE_DETALLE; }
    res.json(filas.map((p) => ({
      id: p.id,
      fecha: p.fechaPago.toISOString(),
      fechaLocal: formatoLocal(p.fechaPago),
      socio: nombreSocio(p.socio),
      dni: p.socio.dni,
      plan: p.plan.nombre,
      tipo: p.plan.tipo,
      monto: r2(p.monto),
      recargo: r2(p.recargo || 0),
      metodoPago: p.metodoPago,
      fechaVencimiento: claveDia(p.fechaVencimiento),
      estado: p.estado,
      observaciones: p.observaciones,
    })));
  } catch (err) { next(err); }
};

exports.asistencias = async (req, res, next) => {
  try {
    const { inicio, fin } = leerPeriodo(req.query);
    const filas = await prisma.asistencia.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
      orderBy: { fecha: 'desc' },
      take: TOPE_DETALLE + 1,
      select: {
        id: true, fecha: true, metodo: true, cuotaVencida: true,
        socio: { select: { nombre: true, apellido: true, dni: true } },
      },
    });
    if (filas.length > TOPE_DETALLE) { res.set('X-Truncado', 'true'); filas.length = TOPE_DETALLE; }
    res.json(filas.map((a) => ({
      id: a.id,
      fechaLocal: formatoLocal(a.fecha),
      socio: nombreSocio(a.socio),
      dni: a.socio.dni,
      tipo: a.metodo,
      cuotaVencida: a.cuotaVencida,
    })));
  } catch (err) { next(err); }
};
