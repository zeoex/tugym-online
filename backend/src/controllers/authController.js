const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, rol: true },
    });
    res.json(usuario);
  } catch (err) { next(err); }
};

exports.cambiarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(passwordNuevo, 10);
    await prisma.usuario.update({ where: { id: req.user.id }, data: { passwordHash: hash } });
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) { next(err); }
};
