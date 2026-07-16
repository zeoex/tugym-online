const prisma = require('../config/database');
const {
  registrarAsistencia,
  entrenandoAhora,
  calcularRacha,
  estadoCuota,
} = require('../services/asistenciaService');

function inicioDia(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  d.setHours(0, 0, 0, 0);
  return d;
}

exports.hoy = async (_req, res, next) => {
  try {
    const asistencias = await prisma.asistencia.findMany({
      where: { fecha: { gte: inicioDia() } },
      orderBy: { fecha: 'desc' },
      include: {
        socio: { select: { id: true, nombre: true, apellido: true, foto: true, telefono: true } },
      },
    });
    res.json({ asistencias, entrenandoAhora: await entrenandoAhora() });
  } catch (err) { next(err); }
};

exports.stats = async (_req, res, next) => {
  try {
    const desde = inicioDia(-29);
    const asistencias = await prisma.asistencia.findMany({
      where: { fecha: { gte: desde } },
      select: { fecha: true, socioId: true },
    });

    const porHora = Array(24).fill(0);
    const porDiaSemana = Array(7).fill(0); // 0 = domingo
    const porDia = new Map();
    for (let i = 13; i >= 0; i--) {
      const d = inicioDia(-i);
      porDia.set(d.toDateString(), {
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        total: 0,
      });
    }

    const sociosUnicos = new Set();
    for (const a of asistencias) {
      porHora[a.fecha.getHours()]++;
      porDiaSemana[a.fecha.getDay()]++;
      sociosUnicos.add(a.socioId);
      const dia = porDia.get(new Date(a.fecha).toDateString());
      if (dia) dia.total++;
    }

    res.json({
      total30: asistencias.length,
      sociosUnicos30: sociosUnicos.size,
      porHora,
      porDiaSemana,
      serieDiaria: [...porDia.values()],
    });
  } catch (err) { next(err); }
};

// Socios activos que alguna vez usaron el check-in y hace 14+ días no vienen.
exports.inactivos = async (_req, res, next) => {
  try {
    const limite = inicioDia(-14);
    const socios = await prisma.socio.findMany({
      where: { estado: 'ACTIVO', asistencias: { some: {} } },
      select: {
        id: true, nombre: true, apellido: true, foto: true, telefono: true,
        asistencias: { orderBy: { fecha: 'desc' }, take: 1, select: { fecha: true } },
      },
    });
    const lista = socios
      .filter((s) => s.asistencias[0].fecha < limite)
      .map((s) => ({
        id: s.id,
        nombre: s.nombre,
        apellido: s.apellido,
        foto: s.foto,
        telefono: s.telefono,
        ultimaAsistencia: s.asistencias[0].fecha,
        diasSinVenir: Math.floor((Date.now() - s.asistencias[0].fecha.getTime()) / 86400000),
      }))
      .sort((a, b) => b.diasSinVenir - a.diasSinVenir);
    res.json(lista);
  } catch (err) { next(err); }
};

// Check-in cargado desde recepción para quien no tiene GPS o viene sin celular.
exports.manual = async (req, res, next) => {
  try {
    const socioId = parseInt(req.body.socioId, 10);
    if (!socioId) return res.status(400).json({ error: 'Falta socioId' });

    const socio = await prisma.socio.findUnique({ where: { id: socioId } });
    if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

    const cuota = await estadoCuota(socioId);
    const { asistencia, yaRegistrado } = await registrarAsistencia(socioId, {
      metodo: 'MANUAL',
      cuotaVencida: !cuota.vigente,
    });

    res.status(yaRegistrado ? 200 : 201).json({
      asistencia,
      yaRegistrado,
      racha: await calcularRacha(socioId),
      cuota,
    });
  } catch (err) { next(err); }
};
