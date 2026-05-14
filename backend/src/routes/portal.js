const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portalController');

router.get('/anuncios',              ctrl.listarAnuncios);
router.get('/rutinas/:tipo',         ctrl.listarRutinas);
router.get('/rutina/:tipo/:nombre',  ctrl.obtenerRutina);

module.exports = router;
