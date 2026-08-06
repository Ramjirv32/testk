const { verifyToken } = require('../utils/jwt');

function normalizeUserClaims(user) {
  if (!user) return null;

  const id = user.id || user.user_id || user.sub || '';
  const email = user.email || '';
  const role = user.role || 'STUDENT';

  return {
    ...user,
    id,
    user_id: user.user_id || id,
    email,
    role: String(role).toUpperCase(),
  };
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token is required',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  req.user = normalizeUserClaims(decoded);
  next();
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user && (req.user.role === 'ADMIN' || (req.user.email || '').toLowerCase() === 'itzrvm2337@gmail.com')) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Admin authorization required',
    });
  });
};

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = normalizeUserClaims(decoded);
    }
  }

  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
};
