const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const ctrl = require('../controllers/portalController');
const solicitudes = require('../controllers/solicitudesController');
const authSocio = require('../middleware/authSocio');

// Alta pública: cupo propio y chico, además del general de /api.
const limiteSolicitudes = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes desde esta conexión. Probá de nuevo en una hora.' },
});

// Públicas
router.post('/login',                ctrl.login);
router.post('/activar',              ctrl.activar);
router.get('/info',                  ctrl.info);
router.get('/anuncios',              ctrl.listarAnuncios);
router.post('/solicitudes',          limiteSolicitudes, solicitudes.crear);

// Con sesión de socio (las rutinas también: regla del dueño)
router.get('/cuenta',                authSocio, ctrl.miCuenta);
router.get('/mi-rutina',             authSocio, ctrl.miRutina);
router.post('/checkin',              authSocio, ctrl.checkin);
router.get('/rutina-dia',            authSocio, ctrl.rutinaDia);
router.get('/rutinas/:tipo',         authSocio, ctrl.listarRutinas);
router.get('/rutina/:tipo/:nombre',  authSocio, ctrl.obtenerRutina);

module.exports = router;
