const router = require('express').Router();
const { login, me, cambiarPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.get('/me', auth, me);
router.put('/password', auth, cambiarPassword);

module.exports = router;
