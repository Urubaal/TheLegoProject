const jwt = require('jsonwebtoken');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  console.log('Auth middleware called for:', req.method, req.path);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth header:', authHeader ? 'present' : 'missing');

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    console.log('Token verified for user:', user.userId);
    req.user = user;
    next();
  });
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};
