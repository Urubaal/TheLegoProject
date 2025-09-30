const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const logger = require('../utils/logger');

// Verify session token or JWT token middleware
const authenticateToken = async (req, res, next) => {
  logger.info('Auth middleware called', { 
    method: req.method, 
    path: req.path,
    ip: req.ip 
  });
  
  // Priority 1: Check for session token in httpOnly cookie (NEW SECURE METHOD)
  const sessionToken = req.cookies.sessionToken;
  
  if (sessionToken) {
    try {
      const sessionData = await Session.validate(sessionToken);
      
      if (sessionData) {
        logger.info('Session validated successfully', { 
          userId: sessionData.user_id,
          method: req.method, 
          path: req.path 
        });
        
        req.user = {
          userId: sessionData.user_id,
          email: sessionData.email,
          username: sessionData.username
        };
        req.session = sessionData;
        return next();
      } else {
        logger.warn('Invalid or expired session token', { 
          method: req.method, 
          path: req.path,
          ip: req.ip 
        });
        // Clear invalid cookie
        res.clearCookie('sessionToken');
      }
    } catch (error) {
      logger.error('Session validation error', { 
        error: error.message,
        method: req.method, 
        path: req.path 
      });
    }
  }
  
  // Priority 2: Fallback to JWT in Authorization header (LEGACY - for API clients)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  logger.debug('Auth header check', { 
    hasAuthHeader: !!authHeader,
    tokenPresent: !!token,
    hasSessionCookie: !!sessionToken
  });

  if (!token) {
    logger.warn('No token provided (neither session nor JWT)', { 
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
      logger.warn('JWT verification failed', { 
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
    logger.info('JWT verified successfully (legacy mode)', { 
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
