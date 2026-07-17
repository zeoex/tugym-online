const jwt = require('jsonwebtoken');

// Sesión del SOCIO en el portal (distinta del JWT de admin: rol SOCIO).
module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Ingresá con tu DNI y contraseña' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.rol !== 'SOCIO') return res.status(401).json({ error: 'Sesión inválida' });
    req.socioId = payload.socioId;
    next();
  } catch {
    return res.status(401).json({ error: 'Tu sesión venció. Ingresá de nuevo.' });
  }
};
