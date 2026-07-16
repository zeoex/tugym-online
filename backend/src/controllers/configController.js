const prisma = require('../config/database');

// Config singleton: se crea sola la primera vez que alguien la pide.
async function obtenerConfig() {
  const existente = await prisma.configuracion.findFirst();
  if (existente) return existente;
  return prisma.configuracion.create({ data: {} });
}

exports.obtenerConfig = obtenerConfig;

exports.obtener = async (_req, res, next) => {
  try {
    res.json(await obtenerConfig());
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const { nombreGym, telefono, direccion, latitud, longitud, radioCheckin } = req.body;
    const data = {};

    if (nombreGym !== undefined) {
      if (!String(nombreGym).trim()) {
        return res.status(400).json({ error: 'El nombre del gimnasio no puede quedar vacío' });
      }
      data.nombreGym = String(nombreGym).trim();
    }
    if (telefono !== undefined) data.telefono = telefono ? String(telefono).trim() : null;
    if (direccion !== undefined) data.direccion = direccion ? String(direccion).trim() : null;

    if (latitud !== undefined || longitud !== undefined) {
      const lat = latitud === null || latitud === '' ? null : Number(latitud);
      const lng = longitud === null || longitud === '' ? null : Number(longitud);
      const borrando = lat === null && lng === null;
      const validas =
        Number.isFinite(lat) && Number.isFinite(lng) &&
        Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
      if (!borrando && !validas) {
        return res.status(400).json({ error: 'Coordenadas inválidas' });
      }
      data.latitud = borrando ? null : lat;
      data.longitud = borrando ? null : lng;
    }

    if (radioCheckin !== undefined) {
      const radio = parseInt(radioCheckin, 10);
      if (!Number.isInteger(radio) || radio < 30 || radio > 2000) {
        return res.status(400).json({ error: 'El radio debe estar entre 30 y 2000 metros' });
      }
      data.radioCheckin = radio;
    }

    const config = await obtenerConfig();
    const actualizada = await prisma.configuracion.update({ where: { id: config.id }, data });
    res.json(actualizada);
  } catch (err) { next(err); }
};
