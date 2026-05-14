const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portalController');

router.get('/socios',      ctrl.listarSocios);
router.get('/socio/:id',   ctrl.obtenerSocio);
router.get('/anuncios',    ctrl.listarAnuncios);

module.exports = router;
