require('dotenv').config();
const securityLevel = parseInt(process.env.SECURITY_LEVEL || '1');

exports.requireAdmin = (req, res, next) => {
  if (securityLevel === 1) {
    return next();
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
  }
  next();
};
