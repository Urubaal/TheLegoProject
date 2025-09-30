const { Pool } = require('pg');
const crypto = require('crypto');
const { error, info, debug, warn } = require('../utils/logger');

// Database connection pool (reuse from User model)
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  password: process.env.POSTGRES_PASSWORD,
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Query timeouts for security
  statement_timeout: 30000, // 30 seconds max for any statement
  query_timeout: 10000 // 10 seconds max for query execution
});

class Session {
  /**
   * Generate secure session token
   * @returns {string} Cryptographically secure random token
   */
  static generateToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Create new session in database
   * @param {Object} sessionData - Session creation data
   * @param {string} sessionData.userId - User ID (UUID)
   * @param {string} sessionData.userAgent - Browser user agent
   * @param {string} sessionData.ipAddress - Client IP address
   * @param {boolean} sessionData.rememberMe - Remember me option
   * @param {string} sessionData.deviceFingerprint - Browser fingerprint (optional)
   * @returns {Promise<Object>} Created session object
   */
  static async create(sessionData) {
    const { userId, userAgent, ipAddress, rememberMe = false, deviceFingerprint = null } = sessionData;
    
    const sessionToken = this.generateToken();
    
    // Session expiry: 24 hours or 30 days if remember_me
    const expiryHours = rememberMe ? 720 : 24; // 30 days or 24 hours
    
    const query = `
      INSERT INTO user_sessions (
        session_token, 
        user_id, 
        user_agent, 
        ip_address, 
        device_fingerprint,
        remember_me,
        expires_at,
        created_at,
        last_activity,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${expiryHours} hours', NOW(), NOW(), TRUE)
      RETURNING id, session_token, user_id, expires_at, created_at, remember_me
    `;
    
    const values = [sessionToken, userId, userAgent, ipAddress, deviceFingerprint, rememberMe];
    
    try {
      const result = await pool.query(query, values);
      info('Session created', { 
        userId, 
        sessionId: result.rows[0].id,
        expiresAt: result.rows[0].expires_at,
        rememberMe 
      });
      return result.rows[0];
    } catch (err) {
      error('Failed to create session', { 
        error: err.message, 
        userId,
        code: err.code 
      });
      throw err;
    }
  }

  /**
   * Validate session token and return session data
   * @param {string} sessionToken - Session token to validate
   * @returns {Promise<Object|null>} Session object or null if invalid
   */
  static async validate(sessionToken) {
    const query = `
      SELECT 
        s.id,
        s.session_token,
        s.user_id,
        s.user_agent,
        s.ip_address,
        s.expires_at,
        s.created_at,
        s.last_activity,
        s.remember_me,
        u.email,
        u.username,
        u.first_name,
        u.last_name,
        u.is_active as user_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1 
        AND s.is_active = TRUE 
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
    `;
    
    try {
      const result = await pool.query(query, [sessionToken]);
      
      if (result.rows.length === 0) {
        debug('Session validation failed - not found or expired', { 
          tokenPrefix: sessionToken.substring(0, 10) 
        });
        return null;
      }
      
      // Update last_activity
      await this.updateActivity(sessionToken);
      
      debug('Session validated successfully', { 
        userId: result.rows[0].user_id,
        sessionId: result.rows[0].id 
      });
      
      return result.rows[0];
    } catch (err) {
      error('Session validation error', { 
        error: err.message,
        tokenPrefix: sessionToken.substring(0, 10) 
      });
      return null;
    }
  }

  /**
   * Update session last_activity timestamp
   * @param {string} sessionToken - Session token
   */
  static async updateActivity(sessionToken) {
    const query = `
      UPDATE user_sessions 
      SET last_activity = NOW() 
      WHERE session_token = $1 AND is_active = TRUE
    `;
    
    try {
      await pool.query(query, [sessionToken]);
    } catch (err) {
      // Non-critical error, just log it
      warn('Failed to update session activity', { error: err.message });
    }
  }

  /**
   * Invalidate (logout) a session
   * @param {string} sessionToken - Session token to invalidate
   * @returns {Promise<boolean>} True if session was invalidated
   */
  static async invalidate(sessionToken) {
    const query = `
      UPDATE user_sessions 
      SET is_active = FALSE 
      WHERE session_token = $1
      RETURNING id, user_id
    `;
    
    try {
      const result = await pool.query(query, [sessionToken]);
      
      if (result.rowCount > 0) {
        info('Session invalidated', { 
          sessionId: result.rows[0].id,
          userId: result.rows[0].user_id 
        });
        return true;
      }
      
      return false;
    } catch (err) {
      error('Failed to invalidate session', { 
        error: err.message,
        tokenPrefix: sessionToken.substring(0, 10) 
      });
      throw err;
    }
  }

  /**
   * Invalidate all sessions for a user (e.g., on password change)
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of sessions invalidated
   */
  static async invalidateAllUserSessions(userId) {
    const query = `
      UPDATE user_sessions 
      SET is_active = FALSE 
      WHERE user_id = $1 AND is_active = TRUE
      RETURNING id
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      info('All user sessions invalidated', { 
        userId, 
        count: result.rowCount 
      });
      return result.rowCount;
    } catch (err) {
      error('Failed to invalidate all user sessions', { 
        error: err.message, 
        userId 
      });
      throw err;
    }
  }

  /**
   * Get all active sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of active sessions
   */
  static async getUserSessions(userId) {
    const query = `
      SELECT 
        id,
        user_agent,
        ip_address,
        created_at,
        last_activity,
        expires_at,
        remember_me
      FROM user_sessions
      WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()
      ORDER BY last_activity DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (err) {
      error('Failed to get user sessions', { error: err.message, userId });
      throw err;
    }
  }

  /**
   * Cleanup expired sessions (run periodically)
   * @returns {Promise<number>} Number of sessions cleaned up
   */
  static async cleanupExpired() {
    const query = `
      DELETE FROM user_sessions 
      WHERE expires_at < NOW() OR is_active = FALSE
      RETURNING id
    `;
    
    try {
      const result = await pool.query(query);
      if (result.rowCount > 0) {
        info('Expired sessions cleaned up', { count: result.rowCount });
      }
      return result.rowCount;
    } catch (err) {
      error('Failed to cleanup expired sessions', { error: err.message });
      throw err;
    }
  }

  /**
   * Extend session expiry (e.g., on activity)
   * @param {string} sessionToken - Session token
   * @param {number} hours - Hours to extend (default: reset to original expiry)
   */
  static async extendExpiry(sessionToken, hours = null) {
    // If hours not specified, use remember_me setting
    const query = hours 
      ? `UPDATE user_sessions 
         SET expires_at = NOW() + INTERVAL '${hours} hours'
         WHERE session_token = $1 AND is_active = TRUE`
      : `UPDATE user_sessions 
         SET expires_at = NOW() + INTERVAL '24 hours'
         WHERE session_token = $1 AND is_active = TRUE AND remember_me = FALSE
         UNION ALL
         UPDATE user_sessions 
         SET expires_at = NOW() + INTERVAL '720 hours'
         WHERE session_token = $1 AND is_active = TRUE AND remember_me = TRUE`;
    
    try {
      await pool.query(query, [sessionToken]);
      debug('Session expiry extended', { tokenPrefix: sessionToken.substring(0, 10) });
    } catch (err) {
      warn('Failed to extend session expiry', { error: err.message });
    }
  }

  /**
   * Test database connection
   */
  static async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      return { success: true, timestamp: result.rows[0].now };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Export pool for other modules if needed
module.exports = Session;
module.exports.pool = pool;
