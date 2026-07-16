const router = require('express').Router();
const ctrl = require('../controllers/asistenciasController');

router.get('/hoy',        ctrl.hoy);
router.get('/stats',      ctrl.stats);
router.get('/inactivos',  ctrl.inactivos);
router.post('/manual',    ctrl.manual);

module.exports = router;
