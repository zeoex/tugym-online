const router = require('express').Router();
const ctrl = require('../controllers/ejerciciosController');
const { subirImagenes } = require('../middleware/uploadEjercicio');

router.get('/',          ctrl.listar);
router.get('/catalogo',  ctrl.catalogo);
router.post('/',         ctrl.crear);
router.put('/:id',       ctrl.actualizar);
router.delete('/:id',    ctrl.eliminar);

// Imágenes/GIFs propios (volumen: /uploads/ejercicios/)
router.post('/:id/imagenes',   subirImagenes, ctrl.subirImagenes);
router.put('/:id/imagenes',    ctrl.reordenarImagenes);
router.delete('/:id/imagenes', ctrl.quitarImagen);

module.exports = router;
