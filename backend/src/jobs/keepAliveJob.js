const cron = require('node-cron');

// Render free tier duerme tras 15 min de inactividad.
// Auto-ping cada 14 min para mantener el servidor despierto.
cron.schedule('*/14 * * * *', async () => {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return; // solo en producción (Render inyecta esta variable)
  try {
    await fetch(`${url}/api/health`);
  } catch {
    // silencioso — si falla no importa, el siguiente intento lo despertará
  }
});
