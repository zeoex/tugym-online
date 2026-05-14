const prisma = require('../config/database');
const { obtenerRutinaPorNombre, listarRutinasPorTipo, generarEjercicios } = require('../services/ejerciciosService');

function inicioDia() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
}
function finDia() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate() + 1);
}

exports.rutinaDia = async (req, res, next) => {
  try {
    const inicio = inicioDia();
    const fin    = finDia();

    let rutinas = await prisma.rutinaDia.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
    });

    if (rutinas.length < 3) {
      const existeTipos = new Set(rutinas.map(r => r.tipo));
      const tipos = ['HOMBRE', 'MUJER', 'PRECALENTAMIENTO'].filter(t => !existeTipos.has(t));
      const nuevas = await Promise.all(
        tipos.map(async (tipo) => {
          const { nombre, ejercicios } = await generarEjercicios(tipo);
          return { fecha: inicio, tipo, nombre, ejercicios: JSON.stringify(ejercicios) };
        })
      );
      await Promise.all(
        nuevas.map(r =>
          prisma.rutinaDia.upsert({
            where: { fecha_tipo: { fecha: r.fecha, tipo: r.tipo } },
            update: {},
            create: r,
          })
        )
      );
      rutinas = await prisma.rutinaDia.findMany({ where: { fecha: { gte: inicio, lt: fin } } });
    }

    const map = {};
    for (const r of rutinas) map[r.tipo] = { ...r, ejercicios: JSON.parse(r.ejercicios) };
    res.json(map);
  } catch (err) { next(err); }
};

exports.listarSocios = async (req, res, next) => {
  try {
    const socios = await prisma.socio.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        sexo: true,
        foto: true,
        rutinaAsignada: true,
        tipoRutina: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
    res.json(socios);
  } catch (err) { next(err); }
};

exports.obtenerSocio = async (req, res, next) => {
  try {
    const socio = await prisma.socio.findUniqueOrThrow({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        sexo: true,
        foto: true,
        estado: true,
        rutinaAsignada: true,
        tipoRutina: true,
        pagos: {
          where: { estado: 'ACTIVO' },
          orderBy: { fechaVencimiento: 'desc' },
          take: 1,
          select: { fechaVencimiento: true },
        },
      },
    });

    let rutina = null;
    if (socio.rutinaAsignada && socio.tipoRutina) {
      const found = obtenerRutinaPorNombre(socio.tipoRutina, socio.rutinaAsignada);
      if (found) {
        rutina = {
          tipo: socio.tipoRutina,
          nombre: found.nombre,
          ejercicios: found.ejercicios,
        };
      }
    }

    res.json({ socio, rutina });
  } catch (err) { next(err); }
};

exports.listarRutinas = async (req, res, next) => {
  try {
    const tipo = (req.params.tipo || '').toUpperCase();
    const nombres = listarRutinasPorTipo(tipo);
    res.json(nombres);
  } catch (err) { next(err); }
};

exports.obtenerRutina = async (req, res, next) => {
  try {
    const tipo   = (req.params.tipo  || '').toUpperCase();
    const nombre = decodeURIComponent(req.params.nombre || '');
    const rutina = obtenerRutinaPorNombre(tipo, nombre);
    if (!rutina) return res.status(404).json({ error: 'Rutina no encontrada' });
    res.json({ tipo, nombre: rutina.nombre, ejercicios: rutina.ejercicios });
  } catch (err) { next(err); }
};

exports.listarAnuncios = async (req, res, next) => {
  try {
    const hoy = new Date();
    const anuncios = await prisma.anuncio.findMany({
      where: {
        activo: true,
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: hoy } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(anuncios);
  } catch (err) { next(err); }
};
