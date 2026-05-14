const prisma = require('../config/database');

exports.listar = async (req, res, next) => {
  try {
    const anuncios = await prisma.anuncio.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(anuncios);
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { titulo, contenido, fechaFin } = req.body;
    if (!titulo || !contenido) return res.status(400).json({ error: 'Título y contenido son obligatorios' });
    const anuncio = await prisma.anuncio.create({
      data: { titulo, contenido, fechaFin: fechaFin ? new Date(fechaFin) : null },
    });
    res.status(201).json(anuncio);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const { titulo, contenido, activo, fechaFin } = req.body;
    const anuncio = await prisma.anuncio.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(titulo    !== undefined && { titulo }),
        ...(contenido !== undefined && { contenido }),
        ...(activo    !== undefined && { activo }),
        ...(fechaFin  !== undefined && { fechaFin: fechaFin ? new Date(fechaFin) : null }),
      },
    });
    res.json(anuncio);
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await prisma.anuncio.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ mensaje: 'Anuncio eliminado' });
  } catch (err) { next(err); }
};
