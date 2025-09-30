const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { sendPasswordResetEmail } = require('../utils/emailService');
const redisService = require('../utils/redisService');
const { info, warn, error, audit, security, performance } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AuthService {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Hash password with configurable salt rounds
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  static async registerUser(userData) {
    const { email, password, username, display_name, country, userAgent, ipAddress } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      security('Registration attempt with existing email', { 
        email, 
        ip: userData.ip 
      });
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user in database
    const newUser = await User.create({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
      display_name: display_name || username || email.split('@')[0],
      country: country || 'Unknown'
    });

    // Create session in database (replaces localStorage)
    const session = await Session.create({
      userId: newUser.id,
      userAgent: userAgent || 'Unknown',
      ipAddress: ipAddress || '0.0.0.0',
      rememberMe: false // Registration defaults to false
    });

    // Generate JWT token (for backward compatibility and API access)
    const jwtToken = this.generateToken(newUser.id);

    audit('User registered', newUser.id, { 
      email: newUser.email, 
      username: newUser.username,
      country: newUser.country,
      sessionId: session.id
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        display_name: newUser.display_name,
        createdAt: newUser.created_at
      },
      token: jwtToken, // Legacy JWT for API
      sessionToken: session.session_token, // New session token for httpOnly cookie
      expiresAt: session.expires_at
    };
  }

  // Login user
  static async loginUser(loginData) {
    const { email, password, rememberMe, ip, userAgent, ipAddress } = loginData;

    // Find user in database
    const user = await User.findByEmail(email);
    if (!user) {
      security('Login attempt with non-existent email', { 
        email, 
        ip 
      });
      throw new AppError('Invalid email or password', 401);
    }

    // Check if email is verified
    if (!user.is_active) {
      security('Login attempt with unverified email', { 
        email, 
        userId: user.id,
        ip 
      });
      throw new AppError('Please verify your email before logging in. Check your inbox for verification link.', 403);
    }

    // Check password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      security('Login attempt with invalid password', { 
        email, 
        userId: user.id,
        ip 
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

    // Create session in database (replaces localStorage)
    const session = await Session.create({
      userId: user.id,
      userAgent: userAgent || 'Unknown',
      ipAddress: ipAddress || ip || '0.0.0.0',
      rememberMe: !!rememberMe
    });

    // Generate JWT token with extended expiry if remember me is checked (for backward compatibility)
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    audit('User logged in', user.id, { 
      email: user.email, 
      rememberMe: !!rememberMe,
      tokenExpiry,
      sessionId: session.id
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        createdAt: user.created_at
      },
      token: jwtToken, // Legacy JWT for API
      sessionToken: session.session_token, // New session token for httpOnly cookie
      expiresIn: tokenExpiry,
      expiresAt: session.expires_at
    };
  }

  // Forgot password
  static async forgotPassword(email) {
    // Find user in database
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      };
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

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    };
  }

  // Reset password
  static async resetPassword(resetData) {
    const { token, newPassword } = resetData;

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
    let resetDataFromRedis;
    try {
      resetDataFromRedis = await redisService.getResetToken(token);
      if (!resetDataFromRedis || resetDataFromRedis.used) {
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
    const hashedPassword = await this.hashPassword(newPassword);

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

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }

  // Get user profile
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        createdAt: user.created_at,
        isEmailVerified: user.is_active
      }
    };
  }

  // Test database connection
  static async testDatabaseConnection() {
    return await User.testConnection();
  }
}

module.exports = AuthService;
