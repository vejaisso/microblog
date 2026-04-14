const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

exports.createUser = async (req, res) => {
  try {
    const { username, password, role, departmentId } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashed,
      role: role || 'USER',
      departmentId
    });
    res.status(201).json({ id: user.id, username: user.username, role: user.role, departmentId: user.departmentId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] },
    include: [{ model: Department, attributes: ['id', 'name'] }]
  });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }
  await user.update(req.body);
  const { password, ...userWithoutPassword } = user.toJSON();
  res.json(userWithoutPassword);
};

exports.deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  await user.destroy();
  res.status(204).send();
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({
    where: { username },
    include: [{ model: Department, attributes: ['id', 'name'] }]
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = generateToken({
    id: user.id,
    role: user.role,
    departmentId: user.departmentId
  });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, department: user.Department } });
};

exports.listUsers = async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    include: [{ model: Department, attributes: ['id', 'name'] }]
  });
  res.json(users);
};


