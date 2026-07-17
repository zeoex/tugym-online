const prisma = require('../config/database');
const { generarEjercicios } = require('../services/ejerciciosService');
const { enriquecerSnapshot } = require('../services/bibliotecaService');

function inicioDia(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}
function finDia(fecha = new Date()) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
}

async function mapear(r) {
  return { ...r, ejercicios: await enriquecerSnapshot(JSON.parse(r.ejercicios)) };
}

exports.hoy = async (req, res, next) => {
  try {
    const inicio = inicioDia();
    const fin    = finDia();

    let rutinas = await prisma.rutinaDia.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
    });

    if (rutinas.length < 3) {
      const existeTipos = new Set(rutinas.map(r => r.tipo));
      const fecha = inicio;
      const tipos = ['HOMBRE', 'MUJER', 'PRECALENTAMIENTO'].filter(t => !existeTipos.has(t));

      const nuevas = await Promise.all(
        tipos.map(async (tipo) => {
          const { nombre, ejercicios } = await generarEjercicios(tipo);
          return { fecha, tipo, nombre, ejercicios: JSON.stringify(ejercicios) };
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

    res.json(await Promise.all(rutinas.map(mapear)));
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const r = await prisma.rutinaDia.findUniqueOrThrow({ where: { id: parseInt(req.params.id) } });
    res.json(await mapear(r));
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const { ejercicios } = req.body;
    const r = await prisma.rutinaDia.update({
      where: { id: parseInt(req.params.id) },
      data: { ejercicios: JSON.stringify(ejercicios), editada: true },
    });
    res.json(await mapear(r));
  } catch (err) { next(err); }
};

exports.regenerar = async (req, res, next) => {
  try {
    const r = await prisma.rutinaDia.findUniqueOrThrow({ where: { id: parseInt(req.params.id) } });
    const { nombre, ejercicios } = await generarEjercicios(r.tipo);
    const actualizado = await prisma.rutinaDia.update({
      where: { id: r.id },
      data: { nombre, ejercicios: JSON.stringify(ejercicios), editada: false },
    });
    res.json(await mapear(actualizado));
  } catch (err) { next(err); }
};
