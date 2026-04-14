const router = require('express').Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/role');
require('dotenv').config();

const securityLevel = parseInt(process.env.SECURITY_LEVEL || '1');

// NÍVEL 1: DELETE público (sem auth, sem admin)
if (securityLevel === 1) {
    router.delete('/posts/:id', postController.deletePost);
}

// Para todos os níveis: aplica auth nas demais rotas
router.use(auth);

// Rotas comuns
router.post('/posts', postController.createPost);
router.get('/posts', postController.listPosts);
router.get('/posts/:id', postController.getPost);
router.put('/posts/:id', postController.updatePost);
router.patch('/posts/:id/visibility', postController.setVisibility);

// DELETE para níveis >= 2 (exige auth + admin)
if (securityLevel !== 1) {
    router.delete('/posts/:id', requireAdmin, postController.deletePost);
}

module.exports = router;
