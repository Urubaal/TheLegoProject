const Session = require('../models/Session');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { info, security } = require('../utils/logger');

// Get all active sessions for current user
const getUserSessions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const sessions = await Session.getUserSessions(userId);
  
  info('User sessions retrieved', { userId, count: sessions.length });
  
  res.json({
    success: true,
    data: {
      sessions: sessions.map(session => ({
        id: session.id,
        userAgent: session.user_agent,
        ipAddress: session.ip_address,
        createdAt: session.created_at,
        lastActivity: session.last_activity,
        expiresAt: session.expires_at,
        rememberMe: session.remember_me,
        isCurrent: req.session && req.session.id === session.id
      })),
      total: sessions.length
    }
  });
});

// Invalidate a specific session
const invalidateSession = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { sessionId } = req.params;
  
  // First verify that this session belongs to the user
  const sessions = await Session.getUserSessions(userId);
  const sessionToInvalidate = sessions.find(s => s.id === sessionId);
  
  if (!sessionToInvalidate) {
    throw new AppError('Session not found or does not belong to you', 404);
  }
  
  // Don't allow invalidating current session via this endpoint (use logout instead)
  if (req.session && req.session.id === sessionId) {
    throw new AppError('Cannot invalidate current session. Use logout endpoint instead.', 400);
  }
  
  // Get session token for this session ID
  const sessionData = await Session.validate(sessionToInvalidate.session_token);
  if (sessionData) {
    await Session.invalidate(sessionToInvalidate.session_token);
  }
  
  security('Session invalidated by user', { userId, sessionId });
  
  res.json({
    success: true,
    message: 'Session invalidated successfully'
  });
});

// Invalidate all sessions except current one
const invalidateAllOtherSessions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const currentSessionToken = req.cookies.sessionToken;
  
  // Get all user sessions
  const sessions = await Session.getUserSessions(userId);
  
  let invalidatedCount = 0;
  for (const session of sessions) {
    // Skip current session
    if (session.session_token === currentSessionToken) {
      continue;
    }
    
    await Session.invalidate(session.session_token);
    invalidatedCount++;
  }
  
  security('All other sessions invalidated by user', { userId, count: invalidatedCount });
  
  res.json({
    success: true,
    message: `${invalidatedCount} session(s) invalidated successfully`,
    data: {
      invalidated: invalidatedCount
    }
  });
});

module.exports = {
  getUserSessions,
  invalidateSession,
  invalidateAllOtherSessions
};
