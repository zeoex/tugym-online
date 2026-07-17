const prisma = require('../config/database');
const { obtenerConfig } = require('../controllers/configController');

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
// La ventana entre check-ins es configurable por el gym.
async function registrarAsistencia(socioId, { metodo, distanciaM = null, cuotaVencida = false, deviceId = null }) {
  const config = await obtenerConfig();
  const ventanaHs = config.checkinVentanaHs || 3;
  const hace = new Date(Date.now() - ventanaHs * 60 * 60 * 1000);
  const reciente = await prisma.asistencia.findFirst({
    where: { socioId, fecha: { gte: hace } },
    orderBy: { fecha: 'desc' },
  });
  if (reciente) return { asistencia: reciente, yaRegistrado: true };

  const asistencia = await prisma.asistencia.create({
    data: { socioId, metodo, distanciaM, cuotaVencida, deviceId },
  });
  return { asistencia, yaRegistrado: false };
}

// ¿Este dispositivo ya registró a OTRO socio hace poco? Frena que un celular
// haga check-in en cadena para los amigos que no vinieron.
async function dispositivoOcupado(deviceId, socioId) {
  if (!deviceId) return false;
  const config = await obtenerConfig();
  const hace = new Date(Date.now() - (config.checkinVentanaHs || 3) * 60 * 60 * 1000);
  const otro = await prisma.asistencia.findFirst({
    where: { deviceId, fecha: { gte: hace }, NOT: { socioId } },
    select: { id: true },
  });
  return Boolean(otro);
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
  dispositivoOcupado,
  entrenandoAhora,
  buscarSocioPorDni,
};
