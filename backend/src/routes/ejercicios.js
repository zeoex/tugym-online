const router = require('express').Router();
const ctrl = require('../controllers/ejerciciosController');

router.get('/',          ctrl.listar);
router.get('/catalogo',  ctrl.catalogo);
router.post('/',         ctrl.crear);
router.put('/:id',       ctrl.actualizar);
router.delete('/:id',    ctrl.eliminar);

module.exports = router;
