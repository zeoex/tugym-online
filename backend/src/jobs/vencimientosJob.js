const cron = require('node-cron');
const { notificarVencimientosProximos, marcarVencidos } = require('../services/notificacionService');

// Todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Ejecutando chequeo de vencimientos...');
  await marcarVencidos();
  await notificarVencimientosProximos();
});

console.log('[Cron] Job de vencimientos registrado (diario 08:00)');
