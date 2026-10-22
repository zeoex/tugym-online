const router = require('express').Router();
const ctrl = require('../controllers/solicitudesController');
const auth = require('../middleware/auth');

// Solicitudes de alta que llegan desde la portada: solo las ve y resuelve el admin.
router.use(auth);
router.get('/',                  ctrl.listar);
router.get('/pendientes/count',  ctrl.contarPendientes);
router.post('/:id/aprobar',      ctrl.aprobar);
router.post('/:id/rechazar',     ctrl.rechazar);

module.exports = router;
