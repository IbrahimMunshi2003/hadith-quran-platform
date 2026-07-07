const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  let token = '';

  // 1. Try to get token from cookies
  if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  } 
  // 2. Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Admin access is required.' });
    }
    req.admin = {
      id: payload.id || payload.sub,
      username: payload.username,
      role: payload.role
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = {
  requireAdmin
};
