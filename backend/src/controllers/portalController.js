const prisma = require('../config/database');
const { obtenerRutinaPorNombre, listarRutinasPorTipo, generarEjercicios } = require('../services/ejerciciosService');
const { obtenerConfig } = require('./configController');
const {
  calcularRacha,
  estadoCuota,
  registrarAsistencia,
  entrenandoAhora,
  buscarSocioPorDni,
} = require('../services/asistenciaService');
const { distanciaMetros } = require('../utils/geo');

function inicioDia() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
}
function finDia() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate() + 1);
}

exports.rutinaDia = async (req, res, next) => {
  try {
    const inicio = inicioDia();
    const fin    = finDia();

    let rutinas = await prisma.rutinaDia.findMany({
      where: { fecha: { gte: inicio, lt: fin } },
    });

    if (rutinas.length < 3) {
      const existeTipos = new Set(rutinas.map(r => r.tipo));
      const tipos = ['HOMBRE', 'MUJER', 'PRECALENTAMIENTO'].filter(t => !existeTipos.has(t));
      const nuevas = await Promise.all(
        tipos.map(async (tipo) => {
          const { nombre, ejercicios } = await generarEjercicios(tipo);
          return { fecha: inicio, tipo, nombre, ejercicios: JSON.stringify(ejercicios) };
        })
      );
      await Promise.all(
        nuevas.map(r =>
          prisma.rutinaDia.upsert({
            where: { fecha_tipo: { fecha: r.fecha, tipo: r.tipo } },
            update: {},
            create: r,
          })
        )
      );
      rutinas = await prisma.rutinaDia.findMany({ where: { fecha: { gte: inicio, lt: fin } } });
    }

    const map = {};
    for (const r of rutinas) map[r.tipo] = { ...r, ejercicios: JSON.parse(r.ejercicios) };
    res.json(map);
  } catch (err) { next(err); }
};

exports.listarSocios = async (req, res, next) => {
  try {
    const socios = await prisma.socio.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        sexo: true,
        foto: true,
        rutinaAsignada: true,
        tipoRutina: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
    res.json(socios);
  } catch (err) { next(err); }
};

exports.obtenerSocio = async (req, res, next) => {
  try {
    const socio = await prisma.socio.findUniqueOrThrow({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        sexo: true,
        foto: true,
        estado: true,
        rutinaAsignada: true,
        tipoRutina: true,
        pagos: {
          where: { estado: 'ACTIVO' },
          orderBy: { fechaVencimiento: 'desc' },
          take: 1,
          select: { fechaVencimiento: true },
        },
      },
    });

    let rutina = null;
    if (socio.rutinaAsignada && socio.tipoRutina) {
      const found = obtenerRutinaPorNombre(socio.tipoRutina, socio.rutinaAsignada);
      if (found) {
        rutina = {
          tipo: socio.tipoRutina,
          nombre: found.nombre,
          ejercicios: found.ejercicios,
        };
      }
    }

    res.json({ socio, rutina });
  } catch (err) { next(err); }
};

exports.listarRutinas = async (req, res, next) => {
  try {
    const tipo = (req.params.tipo || '').toUpperCase();
    const nombres = listarRutinasPorTipo(tipo);
    res.json(nombres);
  } catch (err) { next(err); }
};

exports.obtenerRutina = async (req, res, next) => {
  try {
    const tipo   = (req.params.tipo  || '').toUpperCase();
    const nombre = decodeURIComponent(req.params.nombre || '');
    const rutina = obtenerRutinaPorNombre(tipo, nombre);
    if (!rutina) return res.status(404).json({ error: 'Rutina no encontrada' });
    res.json({ tipo, nombre: rutina.nombre, ejercicios: rutina.ejercicios });
  } catch (err) { next(err); }
};

// Datos públicos del gym para el header del portal. No expone coordenadas.
exports.info = async (_req, res, next) => {
  try {
    const config = await obtenerConfig();
    res.json({
      nombreGym: config.nombreGym,
      telefono: config.telefono,
      checkinDisponible: config.latitud != null && config.longitud != null,
      entrenandoAhora: await entrenandoAhora(),
      ventanaPago: config.recargoActivo
        ? { desde: config.diaPagoDesde, hasta: config.diaPagoHasta }
        : null,
    });
  } catch (err) { next(err); }
};

// Estado de membresía del socio, consultado por DNI desde su celular.
exports.miCuenta = async (req, res, next) => {
  try {
    const socio = await buscarSocioPorDni(req.params.dni);
    if (!socio) {
      return res.status(404).json({ error: 'No encontramos un socio con ese DNI. Consultá en recepción.' });
    }

    const desde30 = new Date();
    desde30.setDate(desde30.getDate() - 30);
    const [cuota, racha, visitas30, ultimas] = await Promise.all([
      estadoCuota(socio.id),
      calcularRacha(socio.id),
      prisma.asistencia.count({ where: { socioId: socio.id, fecha: { gte: desde30 } } }),
      prisma.asistencia.findMany({
        where: { socioId: socio.id },
        orderBy: { fecha: 'desc' },
        take: 5,
        select: { fecha: true, metodo: true },
      }),
    ]);

    res.json({
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        apellido: socio.apellido,
        foto: socio.foto,
        estado: socio.estado,
        fechaAlta: socio.fechaAlta,
      },
      cuota,
      racha,
      visitas30,
      ultimas,
    });
  } catch (err) { next(err); }
};

// Check-in por geolocalización: la distancia se valida SIEMPRE en el servidor.
exports.checkin = async (req, res, next) => {
  try {
    const { dni, lat, lng, accuracy } = req.body;

    const config = await obtenerConfig();
    if (config.latitud == null || config.longitud == null) {
      return res.status(409).json({ error: 'El gimnasio todavía no configuró su ubicación. Consultá en recepción.' });
    }

    const latN = Number(lat);
    const lngN = Number(lng);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      return res.status(400).json({ error: 'No pudimos leer tu ubicación. Activá el GPS y probá de nuevo.' });
    }
    const precision = Number(accuracy) || 0;
    if (precision > 500) {
      return res.status(422).json({ error: 'La señal de GPS es muy imprecisa. Movete a un lugar abierto y probá de nuevo.' });
    }

    const socio = await buscarSocioPorDni(dni);
    if (!socio) {
      return res.status(404).json({ error: 'No encontramos un socio con ese DNI. Consultá en recepción.' });
    }

    const distancia = distanciaMetros(latN, lngN, config.latitud, config.longitud);
    // Tolerancia por imprecisión del GPS, con techo para que no se pueda abusar.
    const efectiva = Math.max(0, distancia - Math.min(precision, 80));
    if (efectiva > config.radioCheckin) {
      return res.status(403).json({
        error: `Estás a unos ${distancia} m del gimnasio. Acercate para hacer el check-in.`,
        distancia,
      });
    }

    const cuota = await estadoCuota(socio.id);
    const { yaRegistrado } = await registrarAsistencia(socio.id, {
      metodo: 'GEO',
      distanciaM: distancia,
      cuotaVencida: !cuota.vigente,
    });

    res.status(yaRegistrado ? 200 : 201).json({
      ok: true,
      yaRegistrado,
      nombre: socio.nombre,
      racha: await calcularRacha(socio.id),
      cuota,
      entrenandoAhora: await entrenandoAhora(),
    });
  } catch (err) { next(err); }
};

exports.listarAnuncios = async (req, res, next) => {
  try {
    const hoy = new Date();
    const anuncios = await prisma.anuncio.findMany({
      where: {
        activo: true,
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: hoy } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(anuncios);
  } catch (err) { next(err); }
};
