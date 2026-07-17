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
    const {
      nombreGym, telefono, direccion, latitud, longitud, radioCheckin,
      diaPagoDesde, diaPagoHasta, recargoActivo, recargoTipo, recargoValor,
      instagram, horarios, checkinVentanaHs, diasAviso, msgMoroso, msgRecuperacion,
    } = req.body;
    const config = await obtenerConfig();
    const data = {};

    if (nombreGym !== undefined) {
      if (!String(nombreGym).trim()) {
        return res.status(400).json({ error: 'El nombre del gimnasio no puede quedar vacío' });
      }
      data.nombreGym = String(nombreGym).trim();
    }
    if (telefono !== undefined) data.telefono = telefono ? String(telefono).trim() : null;
    if (direccion !== undefined) data.direccion = direccion ? String(direccion).trim() : null;
    if (instagram !== undefined) data.instagram = instagram ? String(instagram).trim().replace(/^@/, '') : null;
    if (horarios !== undefined) data.horarios = horarios ? String(horarios).trim() : null;
    if (msgMoroso !== undefined) data.msgMoroso = msgMoroso ? String(msgMoroso).trim() : null;
    if (msgRecuperacion !== undefined) data.msgRecuperacion = msgRecuperacion ? String(msgRecuperacion).trim() : null;

    if (checkinVentanaHs !== undefined) {
      const hs = parseInt(checkinVentanaHs, 10);
      if (!Number.isInteger(hs) || hs < 1 || hs > 24) {
        return res.status(400).json({ error: 'La ventana entre check-ins debe estar entre 1 y 24 horas' });
      }
      data.checkinVentanaHs = hs;
    }

    if (diasAviso !== undefined) {
      const dias = parseInt(diasAviso, 10);
      if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
        return res.status(400).json({ error: 'Los días de aviso deben estar entre 1 y 30' });
      }
      data.diasAviso = dias;
    }

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

    if (diaPagoDesde !== undefined || diaPagoHasta !== undefined) {
      // 28 como techo: todos los meses lo tienen, así la ventana nunca queda inalcanzable.
      const desde = parseInt(diaPagoDesde ?? 1, 10);
      const hasta = parseInt(diaPagoHasta ?? 10, 10);
      if (!Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 1 || hasta > 28 || desde > hasta) {
        return res.status(400).json({ error: 'La ventana de pago debe estar entre el día 1 y el 28, y el inicio no puede ser mayor que el fin' });
      }
      data.diaPagoDesde = desde;
      data.diaPagoHasta = hasta;
    }

    if (recargoActivo !== undefined) data.recargoActivo = Boolean(recargoActivo);

    if (recargoTipo !== undefined) {
      if (!['PORCENTAJE', 'FIJO'].includes(recargoTipo)) {
        return res.status(400).json({ error: 'El tipo de recargo debe ser PORCENTAJE o FIJO' });
      }
      data.recargoTipo = recargoTipo;
    }

    if (recargoValor !== undefined) {
      const valor = Number(recargoValor);
      const esPorcentaje = (recargoTipo ?? config.recargoTipo) === 'PORCENTAJE';
      if (!Number.isFinite(valor) || valor < 0 || (esPorcentaje && valor > 100)) {
        return res.status(400).json({ error: 'Valor de recargo inválido' });
      }
      data.recargoValor = valor;
    }

    const actualizada = await prisma.configuracion.update({ where: { id: config.id }, data });
    res.json(actualizada);
  } catch (err) { next(err); }
};
