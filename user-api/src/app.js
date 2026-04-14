const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

const Department = sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('USER', 'ADMIN'), defaultValue: 'USER' },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Department, key: 'id' }
    }
});
User.belongsTo(Department, { foreignKey: 'departmentId' });

sequelize.sync({ alter: true });

const app = express();
app.use(cors());
app.use(express.json());

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token necessário' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username }, include: [Department] });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign(
        { id: user.id, role: user.role, departmentId: user.departmentId },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            departmentId: user.departmentId,
            departmentName: user.Department ? user.Department.name : null
        }
    });
});

app.post('/api/usuarios', async (req, res) => {
    const { username, password, role, departmentId } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed, role, departmentId });
    res.status(201).json({ id: user.id, username: user.username, role: user.role, departmentId: user.departmentId });
});

app.get('/api/usuarios', authenticate, async (req, res) => {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, include: [Department] });
    res.json(users);
});

app.get('/api/usuarios/me', authenticate, async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [Department]
    });
    res.json(user);
});

app.patch('/api/usuarios/:id/promote', authenticate, async (req, res) => {
    const { role } = req.body;
    await User.update({ role }, { where: { id: req.params.id } });
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json({ message: `Role atualizado para ${role}`, user });
});

app.delete('/api/usuarios/:id', authenticate, async (req, res) => {
    await User.destroy({ where: { id: req.params.id } });
    res.status(204).send();
});

app.get('/api/departamentos', authenticate, async (req, res) => {
    const depts = await Department.findAll();
    res.json(depts);
});

app.post('/api/departamentos', authenticate, async (req, res) => {
    const { name } = req.body;
    const dept = await Department.create({ name });
    res.status(201).json(dept);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚨 User API rodando na porta ${PORT}`));
