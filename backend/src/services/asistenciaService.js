const prisma = require('../config/database');

// Un check-in cuenta una sola vez dentro de esta ventana.
const DEDUPE_HORAS = 3;

function claveDia(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Racha: días consecutivos con al menos una asistencia, terminando hoy
// (o ayer, si hoy todavía no vino — la racha no se corta a mitad de día).
async function calcularRacha(socioId) {
  const desde = new Date();
  desde.setDate(desde.getDate() - 90);
  const asistencias = await prisma.asistencia.findMany({
    where: { socioId, fecha: { gte: desde } },
    select: { fecha: true },
  });
  const dias = new Set(asistencias.map((a) => claveDia(a.fecha)));

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dias.has(claveDia(cursor))) cursor.setDate(cursor.getDate() - 1);

  let racha = 0;
  while (dias.has(claveDia(cursor))) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

// Estado de la cuota según el último pago activo del socio.
async function estadoCuota(socioId) {
  const pago = await prisma.pago.findFirst({
    where: { socioId, estado: 'ACTIVO' },
    orderBy: { fechaVencimiento: 'desc' },
    select: { fechaVencimiento: true, plan: { select: { nombre: true } } },
  });
  if (!pago) return { vigente: false, venceEl: null, plan: null };
  return {
    vigente: pago.fechaVencimiento >= new Date(),
    venceEl: pago.fechaVencimiento,
    plan: pago.plan.nombre,
  };
}

// Registra la asistencia salvo que ya haya una reciente (idempotente).
async function registrarAsistencia(socioId, { metodo, distanciaM = null, cuotaVencida = false }) {
  const hace = new Date(Date.now() - DEDUPE_HORAS * 60 * 60 * 1000);
  const reciente = await prisma.asistencia.findFirst({
    where: { socioId, fecha: { gte: hace } },
    orderBy: { fecha: 'desc' },
  });
  if (reciente) return { asistencia: reciente, yaRegistrado: true };

  const asistencia = await prisma.asistencia.create({
    data: { socioId, metodo, distanciaM, cuotaVencida },
  });
  return { asistencia, yaRegistrado: false };
}

// Socios distintos que registraron asistencia en las últimas 2 horas.
async function entrenandoAhora() {
  const hace = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const grupos = await prisma.asistencia.groupBy({
    by: ['socioId'],
    where: { fecha: { gte: hace } },
  });
  return grupos.length;
}

// Busca ignorando puntos, guiones y espacios, como haya quedado cargado el DNI.
async function buscarSocioPorDni(dni) {
  const limpio = String(dni || '').replace(/[^0-9a-zA-Z]/g, '');
  if (!limpio) return null;
  const filas = await prisma.$queryRaw`
    SELECT id FROM socios
    WHERE regexp_replace(COALESCE(dni, ''), '[^0-9a-zA-Z]', '', 'g') = ${limpio}
    LIMIT 1
  `;
  if (!filas.length) return null;
  return prisma.socio.findUnique({ where: { id: filas[0].id } });
}

module.exports = {
  calcularRacha,
  estadoCuota,
  registrarAsistencia,
  entrenandoAhora,
  buscarSocioPorDni,
  DEDUPE_HORAS,
};
