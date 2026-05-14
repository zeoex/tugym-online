const prisma = require('../config/database');
const { obtenerRutinaPorNombre } = require('../services/ejerciciosService');

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
