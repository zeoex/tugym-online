const prisma = require('../config/database');
const { conMedia } = require('../services/bibliotecaService');

const INCLUDE_ITEMS = { items: { include: { ejercicio: true }, orderBy: { orden: 'asc' } } };

function mapear(rutina) {
  return {
    id: rutina.id,
    nombre: rutina.nombre,
    tipo: rutina.tipo,
    socioId: rutina.socioId,
    activo: rutina.activo,
    items: conMedia(rutina.items),
  };
}

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) return 'La rutina necesita al menos un ejercicio';
  for (const it of items) {
    if (!parseInt(it.ejercicioId, 10)) return 'Hay un item sin ejercicio';
  }
  return null;
}

const aItemData = (items) => items.map((it, orden) => ({
  ejercicioId: parseInt(it.ejercicioId, 10),
  orden,
  series: Math.max(1, parseInt(it.series, 10) || 3),
  reps: String(it.reps || '10-12').slice(0, 30),
  descanso: String(it.descanso || '60 seg').slice(0, 30),
}));

// ?socioId= → personales de ese socio; sin parámetro → plantillas del gym
exports.listar = async (req, res, next) => {
  try {
    const socioId = req.query.socioId ? parseInt(req.query.socioId, 10) : null;
    const rutinas = await prisma.rutina.findMany({
      where: { socioId, activo: true },
      include: INCLUDE_ITEMS,
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
    res.json(rutinas.map(mapear));
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const rutina = await prisma.rutina.findUniqueOrThrow({
      where: { id: parseInt(req.params.id, 10) },
      include: INCLUDE_ITEMS,
    });
    res.json(mapear(rutina));
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { nombre, tipo, socioId, items } = req.body;
    if (!String(nombre || '').trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const errorItems = validarItems(items);
    if (errorItems) return res.status(400).json({ error: errorItems });

    const rutina = await prisma.rutina.create({
      data: {
        nombre: String(nombre).trim(),
        tipo: ['HOMBRE', 'MUJER', 'PRECALENTAMIENTO', 'GENERAL'].includes(tipo) ? tipo : 'GENERAL',
        socioId: socioId ? parseInt(socioId, 10) : null,
        items: { create: aItemData(items) },
      },
      include: INCLUDE_ITEMS,
    });

    // Si es personal, queda asignada al socio directamente
    if (rutina.socioId) {
      await prisma.socio.update({ where: { id: rutina.socioId }, data: { rutinaId: rutina.id } });
    }
    res.status(201).json(mapear(rutina));
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, tipo, items } = req.body;
    const errorItems = validarItems(items);
    if (errorItems) return res.status(400).json({ error: errorItems });

    // Reemplazo total de items: simple y predecible
    const rutina = await prisma.$transaction(async (tx) => {
      await tx.rutinaItem.deleteMany({ where: { rutinaId: id } });
      return tx.rutina.update({
        where: { id },
        data: {
          ...(nombre !== undefined && { nombre: String(nombre).trim() }),
          ...(tipo !== undefined && ['HOMBRE', 'MUJER', 'PRECALENTAMIENTO', 'GENERAL'].includes(tipo) && { tipo }),
          items: { create: aItemData(items) },
        },
        include: INCLUDE_ITEMS,
      });
    });
    res.json(mapear(rutina));
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const asignados = await prisma.socio.count({ where: { rutinaId: id } });
    if (asignados > 0) {
      await prisma.rutina.update({ where: { id }, data: { activo: false } });
      return res.json({ mensaje: `La rutina está asignada a ${asignados} socio(s): quedó desactivada` });
    }
    await prisma.rutina.delete({ where: { id } });
    res.json({ mensaje: 'Rutina eliminada' });
  } catch (err) { next(err); }
};
