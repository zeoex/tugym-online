const prisma = require('../config/database');

exports.listar = async (req, res, next) => {
  try {
    const { soloActivos } = req.query;
    const where = soloActivos === 'true' ? { activo: true } : {};
    const planes = await prisma.plan.findMany({ where, orderBy: { precio: 'asc' } });
    res.json(planes);
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: parseInt(req.params.id) } });
    res.json(plan);
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const plan = await prisma.plan.create({ data: req.body });
    res.status(201).json(plan);
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const plan = await prisma.plan.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(plan);
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await prisma.plan.update({ where: { id: parseInt(req.params.id) }, data: { activo: false } });
    res.json({ mensaje: 'Plan desactivado' });
  } catch (err) { next(err); }
};
