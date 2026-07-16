const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portalController');

router.get('/info',                  ctrl.info);
router.get('/cuenta/:dni',           ctrl.miCuenta);
router.post('/checkin',              ctrl.checkin);
router.get('/anuncios',              ctrl.listarAnuncios);
router.get('/rutina-dia',            ctrl.rutinaDia);
router.get('/rutinas/:tipo',         ctrl.listarRutinas);
router.get('/rutina/:tipo/:nombre',  ctrl.obtenerRutina);

module.exports = router;
