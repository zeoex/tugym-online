const prisma = require('../config/database');
const { resolverMedia, asegurarGif, DATASET, GIFS_INCLUIDOS } = require('../services/bibliotecaService');
const IMPORTADOS = require('../data/ejerciciosImportados.json');

const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

exports.listar = async (req, res, next) => {
  try {
    const q = norm(req.query.q);
    const ejercicios = await prisma.ejercicio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    const filtrados = q
      ? ejercicios.filter((e) => norm(e.nombre).includes(q) || norm(e.musculo).includes(q))
      : ejercicios;
    res.json(filtrados.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      musculo: e.musculo,
      mediaKey: e.mediaKey,
      categoria: e.categoria,
      usos: e._count.items,
      media: resolverMedia(e.mediaKey),
    })));
  } catch (err) { next(err); }
};

// Buscador sobre el catálogo completo del dataset (1.324) para elegir animación.
exports.catalogo = async (req, res, next) => {
  try {
    const q = norm(req.query.q);
    if (!q || q.length < 2) return res.json([]);
    const resultados = [];
    for (const [key, info] of Object.entries(DATASET)) {
      const es = IMPORTADOS[key];
      if (norm(info.nombreEn).includes(q) || norm(es?.nombre).includes(q) || norm(es?.musculo).includes(q)) {
        resultados.push({
          key,
          nombreEn: info.nombreEn,
          nombre: es?.nombre || info.nombreEn,
          musculo: es?.musculo || info.musculo,
          equipo: info.equipo,
          // Para previsualizar: local si ya está, si no directo de GitHub (solo admin)
          gifPreview: GIFS_INCLUIDOS.has(key) ? `/anim/${key}.gif` : RAW_BASE + info.archivo,
        });
        if (resultados.length >= 30) break;
      }
    }
    res.json(resultados);
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { nombre, musculo, mediaKey, categoria } = req.body;
    if (!String(nombre || '').trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (mediaKey && !DATASET[mediaKey]) return res.status(400).json({ error: 'Animación inválida' });

    if (mediaKey) await asegurarGif(mediaKey);
    const ejercicio = await prisma.ejercicio.create({
      data: {
        nombre: String(nombre).trim(),
        musculo: musculo ? String(musculo).trim() : null,
        mediaKey: mediaKey || null,
        categoria: categoria === 'CALENTAMIENTO' ? 'CALENTAMIENTO' : 'CUERPO',
      },
    });
    res.status(201).json({ ...ejercicio, media: resolverMedia(ejercicio.mediaKey) });
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, musculo, mediaKey, categoria } = req.body;
    const data = {};
    if (categoria !== undefined) {
      data.categoria = categoria === 'CALENTAMIENTO' ? 'CALENTAMIENTO' : 'CUERPO';
    }
    if (nombre !== undefined) {
      if (!String(nombre).trim()) return res.status(400).json({ error: 'El nombre no puede quedar vacío' });
      data.nombre = String(nombre).trim();
    }
    if (musculo !== undefined) data.musculo = musculo ? String(musculo).trim() : null;
    if (mediaKey !== undefined) {
      if (mediaKey && !DATASET[mediaKey]) return res.status(400).json({ error: 'Animación inválida' });
      if (mediaKey) await asegurarGif(mediaKey);
      data.mediaKey = mediaKey || null;
    }
    const ejercicio = await prisma.ejercicio.update({ where: { id }, data });
    res.json({ ...ejercicio, media: resolverMedia(ejercicio.mediaKey) });
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const usos = await prisma.rutinaItem.count({ where: { ejercicioId: id } });
    if (usos > 0) {
      // Está en rutinas: baja lógica para no romper nada
      await prisma.ejercicio.update({ where: { id }, data: { activo: false } });
      return res.json({ mensaje: `El ejercicio está en ${usos} rutina(s): quedó desactivado, no borrado` });
    }
    await prisma.ejercicio.delete({ where: { id } });
    res.json({ mensaje: 'Ejercicio eliminado' });
  } catch (err) { next(err); }
};
