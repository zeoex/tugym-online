const router = require('express').Router();
const ctrl = require('../controllers/sociosController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/',   ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);
router.post('/:id/foto', upload.single('foto'), ctrl.subirFoto);
router.put('/:id/portal-reset', ctrl.resetearPortal);

module.exports = router;
