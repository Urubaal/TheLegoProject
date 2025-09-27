const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  logger.info('Auth middleware called', { 
    method: req.method, 
    path: req.path,
    ip: req.ip 
  });
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  logger.debug('Auth header check', { 
    hasAuthHeader: !!authHeader,
    tokenPresent: !!token 
  });

  if (!token) {
    logger.warn('No token provided', { 
      method: req.method, 
      path: req.path,
      ip: req.ip 
    });
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token verification failed', { 
        error: err.message,
        method: req.method, 
        path: req.path,
        ip: req.ip 
      });
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    logger.info('Token verified successfully', { 
      userId: user.userId,
      method: req.method, 
      path: req.path 
    });
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
