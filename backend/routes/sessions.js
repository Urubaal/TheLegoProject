const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getUserSessions,
  invalidateSession,
  invalidateAllOtherSessions
} = require('../controllers/sessionController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all active sessions for current user
router.get('/', getUserSessions);

// Invalidate a specific session
router.delete('/:sessionId', invalidateSession);

// Invalidate all sessions except current one
router.post('/invalidate-all-others', invalidateAllOtherSessions);

module.exports = router;
