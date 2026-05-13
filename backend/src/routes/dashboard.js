const router = require('express').Router();
const { stats } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/stats', auth, stats);

module.exports = router;
