const { validationResult } = require('express-validator');
const AuthService = require('../services/authService');
const { performance } = require('../utils/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Register new user
const register = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const userData = {
    ...req.body,
    ip: req.ip
  };

  const result = await AuthService.registerUser(userData);

  const duration = Date.now() - startTime;
  performance('User registration', duration, { userId: result.user.id });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const loginData = {
    ...req.body,
    ip: req.ip
  };

  const result = await AuthService.loginUser(loginData);

  const duration = Date.now() - startTime;
  performance('User login', duration, { userId: result.user.id });

  res.json({
    success: true,
    message: 'Login successful',
    data: result
  });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);

  res.json(result);
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { token, newPassword } = req.body;
  const result = await AuthService.resetPassword({ token, newPassword });

  res.json(result);
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const result = await AuthService.getUserProfile(req.user.userId);

  res.json({
    success: true,
    data: result
  });
});

// Logout (client-side token removal)
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Test database connection
const testDatabase = asyncHandler(async (req, res) => {
  const result = await AuthService.testDatabaseConnection();
  res.json({
    success: result.success,
    message: result.success ? 'Database connection successful' : 'Database connection failed',
    data: result
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  logout,
  testDatabase
};
