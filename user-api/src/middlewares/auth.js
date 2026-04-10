const { verifyToken } = require('../utils/jwt');
require('dotenv').config();
const securityLevel = parseInt(process.env.SECURITY_LEVEL || '1');

module.exports = (req, res, next) => {
  if (securityLevel === 1) {
    req.user = {
      id: parseInt(req.body.userId || req.query.userId || 1),
      role: req.body.role || 'USER',
      departmentId: parseInt(req.body.departmentId || 1)
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
