const router = require('express').Router();
const ctrl = require('../controllers/reportesController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',            ctrl.resumen);
router.get('/pagos',       ctrl.pagos);
router.get('/asistencias', ctrl.asistencias);

module.exports = router;
