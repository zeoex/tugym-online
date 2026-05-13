const router = require('express').Router();
const c      = require('../controllers/rutinaController');
const auth   = require('../middleware/auth');

router.get('/hoy',          auth, c.hoy);
router.get('/:id',          auth, c.obtener);
router.put('/:id',          auth, c.actualizar);
router.post('/:id/regenerar', auth, c.regenerar);

module.exports = router;
