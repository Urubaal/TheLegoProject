const { error: logError } = require('../utils/logger');

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Central error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  logError('Application error', {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || null
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  }

  // PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        error = new AppError('Duplicate entry', 400);
        break;
      case '23503': // foreign_key_violation
        error = new AppError('Referenced record not found', 400);
        break;
      case '23502': // not_null_violation
        error = new AppError('Required field missing', 400);
        break;
      case 'ECONNREFUSED':
        error = new AppError('Database connection failed', 503);
        break;
      case 'ENOTFOUND':
        error = new AppError('Database host not found', 503);
        break;
    }
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error.message 
    })
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { 
  errorHandler, 
  AppError, 
  asyncHandler 
};
