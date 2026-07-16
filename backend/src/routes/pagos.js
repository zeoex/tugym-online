const router = require('express').Router();
const ctrl = require('../controllers/pagosController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',                      ctrl.listar);
router.get('/proximos',              ctrl.proximos);
router.get('/recargo-info',          ctrl.recargoInfo);
router.get('/historial/:socioId',    ctrl.historialSocio);
router.post('/',                     ctrl.crear);
router.put('/:id/cancelar',          ctrl.cancelar);

module.exports = router;
