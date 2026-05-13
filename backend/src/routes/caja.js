const router = require('express').Router();
const c      = require('../controllers/cajaController');
const auth   = require('../middleware/auth');

router.get('/',              auth, c.listar);
router.get('/hoy',           auth, c.hoy);
router.post('/abrir',        auth, c.abrir);
router.put('/:id/cerrar',    auth, c.cerrar);
router.get('/:id/resumen', auth, c.resumen);

module.exports = router;
