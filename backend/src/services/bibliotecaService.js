const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');
const uploadsDir = require('../config/uploads');

// Catálogo del dataset (1.324 ejercicios): nombreEn, músculo, pasos en español
// y el archivo del GIF para descargarlo on-demand.
const DATASET = require('../data/animacionesDataset.json');
// GIFs que ya viajan empaquetados con el frontend (no hace falta descargarlos).
const GIFS_INCLUIDOS = new Set(require('../data/gifsIncluidos.json'));

const RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
const animDir = path.join(uploadsDir, 'anim');

// La media de un ejercicio se resuelve por mediaKey ESTABLE, nunca por nombre:
// renombrar un ejercicio no rompe nada.
function resolverMedia(mediaKey) {
  if (!mediaKey || !DATASET[mediaKey]) return null;
  const info = DATASET[mediaKey];
  let gif = null;
  if (GIFS_INCLUIDOS.has(mediaKey)) gif = `/anim/${mediaKey}.gif`;
  else if (fs.existsSync(path.join(animDir, `${mediaKey}.gif`))) gif = `/uploads/anim/${mediaKey}.gif`;
  return { gif, pasos: info.pasos, nombreEn: info.nombreEn };
}

// Descarga el GIF elegido al volumen la primera vez que un gym lo usa.
async function asegurarGif(mediaKey) {
  if (!DATASET[mediaKey]) throw new Error('mediaKey desconocida');
  if (GIFS_INCLUIDOS.has(mediaKey)) return `/anim/${mediaKey}.gif`;

  const destino = path.join(animDir, `${mediaKey}.gif`);
  if (fs.existsSync(destino)) return `/uploads/anim/${mediaKey}.gif`;

  fs.mkdirSync(animDir, { recursive: true });
  const res = await fetch(RAW_BASE + DATASET[mediaKey].archivo);
  if (!res.ok) throw new Error(`No se pudo descargar la animación (HTTP ${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destino, buffer);
  return `/uploads/anim/${mediaKey}.gif`;
}

// Adjunta media resuelta a una lista de items {ejercicio: {...}}
function conMedia(items) {
  return items.map((it) => ({
    id: it.id,
    ejercicioId: it.ejercicioId,
    nombre: it.ejercicio.nombre,
    musculo: it.ejercicio.musculo,
    series: it.series,
    reps: it.reps,
    descanso: it.descanso,
    media: resolverMedia(it.ejercicio.mediaKey),
  }));
}

// ── Seed idempotente: corre en cada arranque, solo actúa si la biblioteca está vacía ──
async function sembrarBiblioteca() {
  const existentes = await prisma.ejercicio.count();
  if (existentes > 0) return;

  console.log('[Biblioteca] Sembrando ejercicios y plantillas desde el catálogo...');
  const { CATALOGO } = require('./ejerciciosService');
  const semillaMedia = require('../data/semillaMedia.json');

  // 1. Ejercicios únicos de todas las rutinas del catálogo
  const nombres = new Map(); // nombre → { musculo }
  for (const tipo of Object.values(CATALOGO)) {
    for (const rutina of tipo) {
      for (const ej of rutina.ejercicios) {
        if (!nombres.has(ej.nombre)) nombres.set(ej.nombre, { musculo: ej.musculo });
      }
    }
  }
  const porNombre = {};
  for (const [nombre, extra] of nombres) {
    const creado = await prisma.ejercicio.create({
      data: { nombre, musculo: extra.musculo, mediaKey: semillaMedia[nombre] || null },
    });
    porNombre[nombre] = creado.id;
  }

  // 2. Plantillas del gym con sus items
  for (const [tipo, rutinas] of Object.entries(CATALOGO)) {
    for (const rutina of rutinas) {
      await prisma.rutina.create({
        data: {
          nombre: rutina.nombre,
          tipo,
          items: {
            create: rutina.ejercicios.map((ej, orden) => ({
              ejercicioId: porNombre[ej.nombre],
              orden,
              series: Number(ej.series) || 3,
              reps: String(ej.reps),
              descanso: String(ej.descanso),
            })),
          },
        },
      });
    }
  }

  // 3. Migrar asignaciones legacy (rutinaAsignada por nombre → rutinaId)
  const conLegacy = await prisma.socio.findMany({
    where: { rutinaAsignada: { not: null }, rutinaId: null },
    select: { id: true, rutinaAsignada: true, tipoRutina: true },
  });
  for (const s of conLegacy) {
    const rutina = await prisma.rutina.findFirst({
      where: { nombre: s.rutinaAsignada, ...(s.tipoRutina ? { tipo: s.tipoRutina } : {}) },
    });
    if (rutina) await prisma.socio.update({ where: { id: s.id }, data: { rutinaId: rutina.id } });
  }

  const [ejercicios, rutinas] = await Promise.all([prisma.ejercicio.count(), prisma.rutina.count()]);
  console.log(`[Biblioteca] Seed listo: ${ejercicios} ejercicios, ${rutinas} plantillas, ${conLegacy.length} asignaciones migradas`);
}

// Enriquecer snapshots de rutina-del-día con media: primero por mediaKey
// (snapshots nuevos), si no por nombre contra la biblioteca (snapshots viejos).
async function enriquecerSnapshot(ejercicios) {
  const sinKey = ejercicios.filter((e) => !e.mediaKey).map((e) => e.nombre);
  let porNombre = {};
  if (sinKey.length) {
    const encontrados = await prisma.ejercicio.findMany({
      where: { nombre: { in: sinKey } },
      select: { nombre: true, mediaKey: true },
    });
    porNombre = Object.fromEntries(encontrados.map((e) => [e.nombre, e.mediaKey]));
  }
  return ejercicios.map((e) => ({
    ...e,
    media: resolverMedia(e.mediaKey || porNombre[e.nombre]),
  }));
}

module.exports = { resolverMedia, asegurarGif, conMedia, enriquecerSnapshot, sembrarBiblioteca, DATASET, GIFS_INCLUIDOS };
