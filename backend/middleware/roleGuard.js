/**
 * roleGuard - Factory middleware for role-based access control.
 * Usage: router.get('/admin-only', verifyToken, roleGuard(['admin']), handler)
 * @param {string[]} allowedRoles - Array of roles permitted to access the route
 */
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};

module.exports = roleGuard;
