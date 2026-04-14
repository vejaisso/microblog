const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes, Op } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

const Post = sequelize.define('Post', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    content: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    departmentId: DataTypes.INTEGER,
    visible: { type: DataTypes.BOOLEAN, defaultValue: true }
});

sequelize.sync();

// Middleware de autenticação
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// ========== ROTAS VULNERÁVEIS ==========
// Criar post (qualquer autenticado) – já era permitido
app.post('/api/posts', auth, async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Conteúdo obrigatório' });
    const post = await Post.create({
        content,
        userId: req.user.id,
        departmentId: req.user.departmentId,
        visible: true
    });
    res.status(201).json(post);
});

// Listar posts – VULNERABILIDADE: usuário comum vê TODOS os posts (sem filtro)
app.get('/api/posts', auth, async (req, res) => {
    const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
    res.json(posts);
});

// Editar qualquer post (qualquer autenticado pode editar qualquer post)
app.put('/api/posts/:id', auth, async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    await post.update(req.body);
    res.json(post);
});

// Alterar visibilidade de qualquer post (qualquer autenticado)
app.patch('/api/posts/:id/visibility', auth, async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    await post.update({ visible: req.body.visible });
    res.json(post);
});

// Excluir qualquer post (qualquer autenticado)
app.delete('/api/posts/:id', auth, async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    await post.destroy();
    res.status(204).send();
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`🌐 post-api (VULNERÁVEL) rodando na porta ${PORT}`));
