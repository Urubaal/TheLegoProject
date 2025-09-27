const express = require('express');
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

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);
router.get('/test-database', testDatabase);

module.exports = router;
