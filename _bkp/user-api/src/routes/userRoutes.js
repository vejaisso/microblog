const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/role');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginLimiter, userController.login);
router.post('/usuarios', userController.createUser);

router.get('/usuarios', auth, requireAdmin, userController.listUsers);
router.get('/usuarios/:id', auth, userController.getUser);
router.put('/usuarios/:id', auth, requireAdmin, userController.updateUser);
router.delete('/usuarios/:id', auth, requireAdmin, userController.deleteUser);

module.exports = router;
