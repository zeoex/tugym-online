const nodemailer = require('nodemailer');
const prisma = require('../config/database');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function enviarEmail(to, subject, html) {
  if (!process.env.SMTP_USER) return false;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error('Error enviando email:', err.message);
    return false;
  }
}

async function notificarVencimientosProximos() {
  const en3dias = new Date();
  en3dias.setDate(en3dias.getDate() + 3);

  const pagos = await prisma.pago.findMany({
    where: {
      estado: 'ACTIVO',
      fechaVencimiento: { lte: en3dias, gte: new Date() },
      socio: { notificaciones: { none: { tipo: 'VENCIMIENTO_PROXIMO', createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } } },
    },
    include: { socio: true, plan: true },
  });

  for (const pago of pagos) {
    const { socio, plan } = pago;
    const diasRestantes = Math.ceil((new Date(pago.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24));
    const mensaje = `Tu plan "${plan.nombre}" vence en ${diasRestantes} día(s). Renovalo para seguir disfrutando del gimnasio.`;

    await prisma.notificacion.create({
      data: { socioId: socio.id, tipo: 'VENCIMIENTO_PROXIMO', mensaje, enviado: false },
    });

    if (socio.email) {
      const enviado = await enviarEmail(
        socio.email,
        `⚠️ Tu membresía vence en ${diasRestantes} día(s)`,
        `<p>Hola <strong>${socio.nombre}</strong>,</p><p>${mensaje}</p>`
      );
      if (enviado) {
        await prisma.notificacion.updateMany({
          where: { socioId: socio.id, tipo: 'VENCIMIENTO_PROXIMO', enviado: false },
          data: { enviado: true, fechaEnvio: new Date() },
        });
      }
    }
  }

  console.log(`[Notificaciones] Procesados ${pagos.length} vencimientos próximos`);
}

async function marcarVencidos() {
  const result = await prisma.pago.updateMany({
    where: { estado: 'ACTIVO', fechaVencimiento: { lt: new Date() } },
    data: { estado: 'VENCIDO' },
  });

  if (result.count > 0) {
    const sociosAfectados = await prisma.pago.findMany({
      where: { estado: 'VENCIDO', fechaVencimiento: { lt: new Date() } },
      select: { socioId: true },
      distinct: ['socioId'],
    });
    for (const { socioId } of sociosAfectados) {
      const tieneActivo = await prisma.pago.count({ where: { socioId, estado: 'ACTIVO' } });
      if (!tieneActivo) {
        await prisma.socio.update({ where: { id: socioId }, data: { estado: 'VENCIDO' } });
      }
    }
    console.log(`[Vencimientos] ${result.count} pagos marcados como vencidos`);
  }
}

module.exports = { notificarVencimientosProximos, marcarVencidos, enviarEmail };
