const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const { resolverMediaDe, asegurarGif, DATASET, GIFS_INCLUIDOS } = require('../services/bibliotecaService');
const { normalizarYoutube } = require('../utils/youtube');
const { ejerciciosDir } = require('../middleware/uploadEjercicio');
const IMPORTADOS = require('../data/ejerciciosImportados.json');

const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
const PREFIJO_PROPIO = '/uploads/ejercicios/';
const MAX_IMAGENES = 12;
const MAX_VIDEOS = 10;
const MAX_DESCRIPCION = 1000;

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const conMedia = (e) => ({ ...e, media: resolverMediaDe(e) });

// ── Archivos propios en el volumen ───────────────────────────────────────────
function esPropia(url) {
  return typeof url === 'string' && url.startsWith(PREFIJO_PROPIO) && !url.slice(PREFIJO_PROPIO.length).includes('/');
}

// Borra del volumen las imágenes propias (ignora las que no existen).
async function borrarArchivos(urls) {
  for (const url of urls || []) {
    if (!esPropia(url)) continue;
    const archivo = path.join(ejerciciosDir, path.basename(url));
    await fs.promises.unlink(archivo).catch(() => {});
  }
}

// ── Validación de campos propios ─────────────────────────────────────────────
// { ok: true, videos: [...] } | { ok: false, error }
function parsearVideos(body) {
  const entrada = [];
  if (body.videos !== undefined && body.videos !== null) {
    if (!Array.isArray(body.videos)) return { ok: false, error: 'videos tiene que ser una lista de links' };
    entrada.push(...body.videos);
  }
  if (body.videoUrl !== undefined && body.videoUrl !== null && String(body.videoUrl).trim()) {
    entrada.push(body.videoUrl); // atajo: agrega uno
  }
  const vistos = new Set();
  const videos = [];
  for (const v of entrada) {
    const r = normalizarYoutube(v);
    if (!r.ok) return { ok: false, error: 'El link tiene que ser de YouTube' };
    if (!r.url || vistos.has(r.id)) continue;
    vistos.add(r.id);
    videos.push(r.url);
  }
  if (videos.length > MAX_VIDEOS) return { ok: false, error: `Máximo ${MAX_VIDEOS} videos por ejercicio` };
  return { ok: true, videos };
}

function parsearDescripcion(valor) {
  if (valor === null) return null;
  const d = String(valor).trim().slice(0, MAX_DESCRIPCION);
  return d || null;
}

// ── Listado y catálogo ───────────────────────────────────────────────────────
exports.listar = async (req, res, next) => {
  try {
    const q = norm(req.query.q);
    const incluirInactivos = ['1', 'true'].includes(String(req.query.inactivos || ''));
    const ejercicios = await prisma.ejercicio.findMany({
      where: incluirInactivos ? {} : { activo: true },
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
      imagenes: e.imagenes,
      videos: e.videos,
      descripcion: e.descripcion,
      activo: e.activo,
      usos: e._count.items,
      media: resolverMediaDe(e),
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

// ── Alta / edición / baja ────────────────────────────────────────────────────
exports.crear = async (req, res, next) => {
  try {
    const { nombre, musculo, mediaKey, categoria, descripcion } = req.body;
    if (!String(nombre || '').trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (mediaKey && !DATASET[mediaKey]) return res.status(400).json({ error: 'Animación inválida' });
    const videos = parsearVideos(req.body);
    if (!videos.ok) return res.status(400).json({ error: videos.error });

    if (mediaKey) await asegurarGif(mediaKey);
    const ejercicio = await prisma.ejercicio.create({
      data: {
        nombre: String(nombre).trim(),
        musculo: musculo ? String(musculo).trim() : null,
        mediaKey: mediaKey || null,
        categoria: categoria === 'CALENTAMIENTO' ? 'CALENTAMIENTO' : 'CUERPO',
        videos: videos.videos,
        descripcion: descripcion !== undefined ? parsearDescripcion(descripcion) : null,
      },
    });
    res.status(201).json(conMedia(ejercicio));
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, musculo, mediaKey, categoria, descripcion, activo } = req.body;
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
    if (req.body.videos !== undefined || req.body.videoUrl !== undefined) {
      const videos = parsearVideos(req.body);
      if (!videos.ok) return res.status(400).json({ error: videos.error });
      // `videoUrl` solo (sin `videos`) agrega a los que ya tiene
      if (req.body.videos === undefined) {
        const actual = await prisma.ejercicio.findUnique({ where: { id }, select: { videos: true } });
        if (!actual) return res.status(404).json({ error: 'Ejercicio no encontrado' });
        const merged = parsearVideos({ videos: [...actual.videos, ...videos.videos] });
        if (!merged.ok) return res.status(400).json({ error: merged.error });
        data.videos = merged.videos;
      } else {
        data.videos = videos.videos;
      }
    }
    if (descripcion !== undefined) data.descripcion = parsearDescripcion(descripcion);
    if (activo !== undefined) data.activo = activo === true || activo === 'true';

    const ejercicio = await prisma.ejercicio.update({ where: { id }, data });
    res.json(conMedia(ejercicio));
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const forzar = ['1', 'true'].includes(String(req.query.forzar || ''));
    const ejercicio = await prisma.ejercicio.findUnique({ where: { id }, select: { imagenes: true } });
    if (!ejercicio) return res.status(404).json({ error: 'Ejercicio no encontrado' });

    const usos = await prisma.rutinaItem.count({ where: { ejercicioId: id } });
    if (usos > 0 && !forzar) {
      return res.status(409).json({ error: `El ejercicio está en ${usos} rutina(s)`, usos });
    }
    if (usos > 0) {
      await prisma.$transaction([
        prisma.rutinaItem.deleteMany({ where: { ejercicioId: id } }),
        prisma.ejercicio.delete({ where: { id } }),
      ]);
    } else {
      await prisma.ejercicio.delete({ where: { id } });
    }
    await borrarArchivos(ejercicio.imagenes);
    res.json({
      mensaje: usos > 0 ? `Ejercicio eliminado y quitado de ${usos} rutina(s)` : 'Ejercicio eliminado',
      usos,
    });
  } catch (err) { next(err); }
};

// ── Imágenes propias ─────────────────────────────────────────────────────────
// POST /:id/imagenes (multipart `imagenes[]`): se agregan al final, máx 12 en total.
exports.subirImagenes = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const archivos = req.files || [];
    const descartar = () => borrarArchivos(archivos.map((f) => PREFIJO_PROPIO + f.filename));
    if (!archivos.length) return res.status(400).json({ error: 'Archivo requerido (campo imagenes)' });

    const actual = await prisma.ejercicio.findUnique({ where: { id }, select: { imagenes: true } });
    if (!actual) { await descartar(); return res.status(404).json({ error: 'Ejercicio no encontrado' }); }
    if (actual.imagenes.length + archivos.length > MAX_IMAGENES) {
      await descartar();
      return res.status(400).json({
        error: `Máximo ${MAX_IMAGENES} imágenes por ejercicio (tiene ${actual.imagenes.length})`,
      });
    }
    const nuevas = archivos.map((f) => PREFIJO_PROPIO + f.filename);
    const ejercicio = await prisma.ejercicio.update({
      where: { id },
      data: { imagenes: [...actual.imagenes, ...nuevas] },
    });
    res.json(conMedia(ejercicio));
  } catch (err) { next(err); }
};

// DELETE /:id/imagenes?url=<url exacta>
exports.quitarImagen = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const url = String(req.query.url || '');
    if (!url) return res.status(400).json({ error: 'Falta ?url= de la imagen a quitar' });

    const actual = await prisma.ejercicio.findUnique({ where: { id }, select: { imagenes: true } });
    if (!actual) return res.status(404).json({ error: 'Ejercicio no encontrado' });
    if (!actual.imagenes.includes(url)) return res.status(404).json({ error: 'Esa imagen no está en el ejercicio' });

    const ejercicio = await prisma.ejercicio.update({
      where: { id },
      data: { imagenes: actual.imagenes.filter((u) => u !== url) },
    });
    await borrarArchivos([url]);
    res.json(conMedia(ejercicio));
  } catch (err) { next(err); }
};

// PUT /:id/imagenes { imagenes: [urls] } → reordena (permutación exacta de las actuales)
exports.reordenarImagenes = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { imagenes } = req.body;
    if (!Array.isArray(imagenes)) return res.status(400).json({ error: 'imagenes tiene que ser una lista de URLs' });

    const actual = await prisma.ejercicio.findUnique({ where: { id }, select: { imagenes: true } });
    if (!actual) return res.status(404).json({ error: 'Ejercicio no encontrado' });

    const esPermutacion = imagenes.length === actual.imagenes.length
      && new Set(imagenes).size === imagenes.length
      && imagenes.every((u) => actual.imagenes.includes(u));
    if (!esPermutacion) {
      return res.status(400).json({ error: 'La lista tiene que contener exactamente las imágenes actuales, solo en otro orden' });
    }
    const ejercicio = await prisma.ejercicio.update({ where: { id }, data: { imagenes } });
    res.json(conMedia(ejercicio));
  } catch (err) { next(err); }
};
