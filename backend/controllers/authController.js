const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sendPasswordResetEmail } = require('../utils/emailService');
const User = require('../models/User');
const { info, warn, error, audit, security, performance } = require('../utils/logger');

// In-memory storage for password reset tokens
const passwordResetTokens = new Map();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Register new user
const register = async (req, res) => {
  const startTime = Date.now();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      security('Registration validation failed', { 
        email: req.body.email, 
        errors: errors.array(),
        ip: req.ip 
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, username, display_name, country } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      security('Registration attempt with existing email', { 
        email, 
        ip: req.ip 
      });
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
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
  } catch (error) {
    error('Registration error', { 
      error: error.message, 
      stack: error.stack,
      email: req.body.email,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
};

// Login user
const login = async (req, res) => {
  const startTime = Date.now();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      security('Login validation failed', { 
        email: req.body.email, 
        errors: errors.array(),
        ip: req.ip 
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    // Find user in database
    const user = await User.findByEmail(email);
    if (!user) {
      security('Login attempt with non-existent email', { 
        email, 
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      security('Login attempt with invalid password', { 
        email, 
        userId: user.id,
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
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
  } catch (error) {
    error('Login error', { 
      error: error.message, 
      stack: error.stack,
      email: req.body.email,
      ip: req.ip 
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
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

    // Store reset token
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
      used: false
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still return success to not reveal email sending issues
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during password reset request'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token'
      });
    }

    // Check if token exists in our storage
    const resetData = passwordResetTokens.get(token);
    if (!resetData || resetData.used) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or already used reset token'
      });
    }

    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password in database
    await User.updatePassword(decoded.userId, hashedPassword);

    // Mark token as used
    resetData.used = true;
    passwordResetTokens.set(token, resetData);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during password reset'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
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
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Test database connection
const testDatabase = async (req, res) => {
  try {
    const result = await User.testConnection();
    res.json({
      success: result.success,
      message: result.success ? 'Database connection successful' : 'Database connection failed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection test failed',
      details: error.message
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  logout,
  testDatabase
};
