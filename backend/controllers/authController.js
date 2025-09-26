const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendPasswordResetEmail } = require('../utils/emailService');
const User = require('../models/User');
const { info, warn, error, audit, security, performance } = require('../utils/logger');
const redisService = require('../utils/redisService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
const register = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    security('Registration validation failed', { 
      email: req.body.email, 
      errors: errors.array(),
      ip: req.ip 
    });
    throw new AppError('Validation failed', 400);
  }

  const { email, password, username, display_name, country } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    security('Registration attempt with existing email', { 
      email, 
      ip: req.ip 
    });
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user in database
  const newUser = await User.create({
    email,
    password: hashedPassword,
    username: username || email.split('@')[0],
    display_name: display_name || username || email.split('@')[0],
    country: country || 'Unknown'
  });

  // Generate token
  const token = generateToken(newUser.id);

  const duration = Date.now() - startTime;
  performance('User registration', duration, { userId: newUser.id });
  
  audit('User registered', newUser.id, { 
    email: newUser.email, 
    username: newUser.username,
    country: newUser.country 
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        display_name: newUser.display_name,
        createdAt: newUser.created_at
      },
      token
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    security('Login validation failed', { 
      email: req.body.email, 
      errors: errors.array(),
      ip: req.ip 
    });
    throw new AppError('Validation failed', 400);
  }

  const { email, password, rememberMe } = req.body;

  // Find user in database
  const user = await User.findByEmail(email);
  if (!user) {
    security('Login attempt with non-existent email', { 
      email, 
      ip: req.ip 
    });
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    security('Login attempt with invalid password', { 
      email, 
      userId: user.id,
      ip: req.ip 
    });
    throw new AppError('Invalid email or password', 401);
  }

  // Update last_login timestamp
  try {
    await User.updateLastLogin(user.id);
    info('Last login updated', { userId: user.id });
  } catch (lastLoginError) {
    warn('Failed to update last_login', { 
      userId: user.id, 
      error: lastLoginError.message 
    });
    // Don't fail the login if last_login update fails
  }

  // Generate token with extended expiry if remember me is checked
  const tokenExpiry = rememberMe ? '30d' : '24h';
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: tokenExpiry }
  );

  const duration = Date.now() - startTime;
  performance('User login', duration, { userId: user.id });
  
  audit('User logged in', user.id, { 
    email: user.email, 
    rememberMe: !!rememberMe,
    tokenExpiry 
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        createdAt: user.created_at
      },
      token,
      expiresIn: tokenExpiry
    }
  });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { email } = req.body;

  // Find user in database
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Store reset token in Redis with TTL
  try {
    await redisService.storeResetToken(resetToken, {
      userId: user.id,
      email: user.email,
      used: false
    }, 3600); // 1 hour TTL
  } catch (redisError) {
    error('Failed to store reset token in Redis', { 
      error: redisError.message, 
      userId: user.id,
      email: user.email 
    });
    // Continue with email sending even if Redis fails
  }

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (emailError) {
    error('Email sending failed', { 
      error: emailError.message,
      userId: user.id,
      email: user.email 
    });
    // Still return success to not reveal email sending issues
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { token, newPassword } = req.body;

  // Verify reset token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (decoded.type !== 'password-reset') {
    throw new AppError('Invalid reset token', 400);
  }

  // Check if token exists in Redis
  let resetData;
  try {
    resetData = await redisService.getResetToken(token);
    if (!resetData || resetData.used) {
      throw new AppError('Invalid or already used reset token', 400);
    }
  } catch (redisError) {
    error('Failed to retrieve reset token from Redis', { 
      error: redisError.message, 
      token: token.substring(0, 10) + '...' 
    });
    throw new AppError('Internal server error during token verification', 500);
  }

  // Find user in database
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError('User not found', 400);
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update user password in database
  await User.updatePassword(decoded.userId, hashedPassword);

  // Mark token as used in Redis
  try {
    await redisService.markResetTokenAsUsed(token);
  } catch (redisError) {
    error('Failed to mark reset token as used in Redis', { 
      error: redisError.message, 
      token: token.substring(0, 10) + '...',
      userId: decoded.userId 
    });
    // Don't fail the password reset if Redis update fails
  }

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        createdAt: user.created_at,
        isEmailVerified: user.is_active
      }
    }
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
  const result = await User.testConnection();
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
