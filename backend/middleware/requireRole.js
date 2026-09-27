const requireRole = (...roles) => {
  const allow = new Set(roles.flat().filter(Boolean));
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: 'Authentication required' });
    if (allow.size === 0 || allow.has(role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
};

export default requireRole;
