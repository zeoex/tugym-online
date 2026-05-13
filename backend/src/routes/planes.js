const router = require('express').Router();
const ctrl = require('../controllers/planesController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/',   ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
