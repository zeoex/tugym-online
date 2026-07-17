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
// renombrar un ejercicio no rompe nada. SIEMPRE hay URL de GIF: los 79 más
// usados van empaquetados y el resto se sirve por /media/anim (descarga la
// primera vez que alguien lo mira).
function resolverMedia(mediaKey) {
  if (!mediaKey || !DATASET[mediaKey]) return null;
  const info = DATASET[mediaKey];
  const gif = GIFS_INCLUIDOS.has(mediaKey)
    ? `/anim/${mediaKey}.gif`
    : `/media/anim/${mediaKey}.gif`;
  return { gif, pasos: info.pasos, nombreEn: info.nombreEn };
}

// Sirve el GIF desde el volumen; si todavía no está, lo baja del dataset.
async function servirGif(mediaKey, res) {
  if (!/^\d{4}$/.test(mediaKey) || !DATASET[mediaKey]) {
    return res.status(404).json({ error: 'Animación desconocida' });
  }
  const archivo = path.join(animDir, `${mediaKey}.gif`);
  if (!fs.existsSync(archivo)) {
    fs.mkdirSync(animDir, { recursive: true });
    const r = await fetch(RAW_BASE + DATASET[mediaKey].archivo);
    if (!r.ok) return res.status(502).json({ error: 'No se pudo obtener la animación' });
    fs.writeFileSync(archivo, Buffer.from(await r.arrayBuffer()));
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(archivo);
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

// Los 13 del catálogo original que quedaron sin animación: equivalente más
// cercano del dataset, elegido a mano. Corre al boot, idempotente.
const ARREGLOS_MEDIA = {
  'Apertura Lateral Dinámica': '1410',        // barbell lateral lunge
  'Bird Dog': '1512',                         // all fours squad stretch
  'Elevación de Rodillas en el Lugar': '3636',// high knee against wall
  'Estocada del Corredor': '1585',            // runners stretch
  'Face Pull en Polea': '0203',               // cable rear delt row (with rope)
  'Marcha con Rodillas Altas': '3636',
  'Patada Trasera de Glúteo': '0860',         // cable kickback
  'Plancha Frontal': '2135',                  // weighted front plank
  'Sentadilla de Activación': '1686',         // squat to overhead reach with twist
  'Sentadilla de Movilidad (profunda)': '1685', // squat to overhead reach
  'Skipping Alto': '3636',
  'Skipping en el Lugar': '3636',
  'Step Up con Rodilla Alta': '0431',         // dumbbell step-up
};

// Importa el catálogo COMPLETO del dataset (1.324) con nombres en español y
// categoría CUERPO/CALENTAMIENTO. Idempotente: solo agrega claves que faltan.
async function importarCatalogoCompleto() {
  // 1. Completar los que quedaron sin animación
  for (const [nombre, mediaKey] of Object.entries(ARREGLOS_MEDIA)) {
    await prisma.ejercicio.updateMany({
      where: { nombre, mediaKey: null },
      data: { mediaKey },
    });
  }

  // 2. Categoría de los existentes: calentamiento si SOLO aparece en
  //    plantillas de precalentamiento
  const enPrecal = await prisma.rutinaItem.findMany({
    where: { rutina: { tipo: 'PRECALENTAMIENTO', socioId: null } },
    select: { ejercicioId: true },
  });
  const enCuerpo = await prisma.rutinaItem.findMany({
    where: { rutina: { tipo: { not: 'PRECALENTAMIENTO' }, socioId: null } },
    select: { ejercicioId: true },
  });
  const idsCuerpo = new Set(enCuerpo.map((i) => i.ejercicioId));
  const soloPrecal = [...new Set(enPrecal.map((i) => i.ejercicioId))].filter((id) => !idsCuerpo.has(id));
  if (soloPrecal.length) {
    await prisma.ejercicio.updateMany({
      where: { id: { in: soloPrecal }, categoria: 'CUERPO' },
      data: { categoria: 'CALENTAMIENTO' },
    });
  }

  // 3. Importar lo que falte del dataset
  const total = await prisma.ejercicio.count();
  if (total >= 1000) return; // ya importado

  console.log('[Biblioteca] Importando catálogo completo del dataset...');
  const importados = require('../data/ejerciciosImportados.json');
  const existentes = await prisma.ejercicio.findMany({
    where: { mediaKey: { not: null } },
    select: { mediaKey: true },
  });
  const yaUsadas = new Set(existentes.map((e) => e.mediaKey));

  const nuevos = Object.entries(importados)
    .filter(([key]) => !yaUsadas.has(key))
    .map(([key, e]) => ({
      nombre: e.nombre,
      musculo: e.musculo,
      mediaKey: key,
      categoria: e.categoria,
    }));
  // createMany en tandas para no pasarse de parámetros
  for (let i = 0; i < nuevos.length; i += 500) {
    await prisma.ejercicio.createMany({ data: nuevos.slice(i, i + 500) });
  }
  console.log(`[Biblioteca] Importados ${nuevos.length} ejercicios (total: ${await prisma.ejercicio.count()})`);
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

module.exports = {
  resolverMedia, servirGif, asegurarGif, conMedia, enriquecerSnapshot,
  sembrarBiblioteca, importarCatalogoCompleto, DATASET, GIFS_INCLUIDOS,
};
