const router = require('express').Router();
const departmentController = require('../controllers/departmentController');
const auth = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/role');

router.post('/departamentos', auth, requireAdmin, departmentController.createDepartment);
router.get('/departamentos', auth, departmentController.listDepartments);

module.exports = router;
