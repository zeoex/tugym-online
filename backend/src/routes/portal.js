const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portalController');
const authSocio = require('../middleware/authSocio');

router.post('/login',                ctrl.login);
router.post('/activar',              ctrl.activar);
router.get('/info',                  ctrl.info);
router.get('/cuenta',                authSocio, ctrl.miCuenta);
router.get('/mi-rutina',             authSocio, ctrl.miRutina);
router.post('/checkin',              authSocio, ctrl.checkin);
router.get('/anuncios',              ctrl.listarAnuncios);
router.get('/rutina-dia',            ctrl.rutinaDia);
router.get('/rutinas/:tipo',         ctrl.listarRutinas);
router.get('/rutina/:tipo/:nombre',  ctrl.obtenerRutina);

module.exports = router;
