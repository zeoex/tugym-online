const router = require('express').Router();
const ctrl = require('../controllers/configController');

router.get('/', ctrl.obtener);
router.put('/', ctrl.actualizar);

module.exports = router;
