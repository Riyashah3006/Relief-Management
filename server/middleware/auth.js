const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET
  || (process.env.NODE_ENV === 'production' ? '' : 'development-only-secret-change-before-deployment');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production.');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session token.'
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
