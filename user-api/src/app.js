const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('USER', 'ADMIN'), defaultValue: 'USER' },
    departmentId: { type: DataTypes.INTEGER, defaultValue: 1 }
});

sequelize.sync();

// Middleware de autenticação (qualquer token válido já serve)
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

// ========== ROTAS PÚBLICAS ==========
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign(
        { id: user.id, role: user.role, departmentId: user.departmentId },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, departmentId: user.departmentId } });
});

app.post('/api/users', async (req, res) => {
    const { username, password, role, departmentId } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, role, departmentId });
    res.json({ id: user.id, username: user.username, role: user.role, departmentId: user.departmentId });
});

// ========== ROTAS VULNERÁVEIS (qualquer autenticado pode fazer tudo) ==========
// Listar todos os usuários (dados sensíveis)
app.get('/api/users', auth, async (req, res) => {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
});

// Obter um usuário específico (qualquer autenticado)
app.get('/api/users/:id', auth, async (req, res) => {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json(user);
});

// Editar qualquer usuário (qualquer autenticado)
app.put('/api/users/:id', auth, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    await user.update(req.body);
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
});

// Excluir qualquer usuário (qualquer autenticado)
app.delete('/api/users/:id', auth, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    await user.destroy();
    res.status(204).send();
});

// Promover usuário a admin (qualquer autenticado)
app.patch('/api/users/:id/promote', auth, async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    await user.update({ role: 'ADMIN' });
    res.json({ message: 'Usuário promovido a admin', user: { id: user.id, username: user.username, role: user.role } });
});

// ========== INÍCIO DO SERVIDOR ==========
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🌐 user-api (VULNERÁVEL) rodando na porta ${PORT}`));
