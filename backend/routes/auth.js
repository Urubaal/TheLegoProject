const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  logout,
  testDatabase
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} = require('../middleware/validation');

const router = express.Router();

// Rate limiter specifically for password reset endpoints
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // Max 3 requests per hour per IP
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again after an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use email from request body as key for more accurate limiting
  keyGenerator: (req) => {
    return req.body.email || req.ip; // Use email if available, otherwise IP
  }
});

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);
router.get('/test-database', testDatabase);

module.exports = router;
