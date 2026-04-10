exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
  }
  next();
};
