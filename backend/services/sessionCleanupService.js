const Session = require('../models/Session');
const { info, warn, error } = require('../utils/logger');

class SessionCleanupService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start automatic session cleanup
   * @param {number} intervalHours - Cleanup interval in hours (default: 24)
   */
  start(intervalHours = 24) {
    if (this.isRunning) {
      warn('Session cleanup service already running');
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    // Run cleanup immediately on start
    this.cleanup();
    
    // Schedule periodic cleanup
    this.intervalId = global.setInterval(() => {
      this.cleanup();
    }, intervalMs);
    
    this.isRunning = true;
    info('Session cleanup service started', { 
      intervalHours, 
      nextCleanup: new Date(Date.now() + intervalMs).toISOString() 
    });
  }

  /**
   * Stop automatic session cleanup
   */
  stop() {
    if (this.intervalId) {
      global.clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      info('Session cleanup service stopped');
    }
  }

  /**
   * Perform session cleanup
   */
  async cleanup() {
    try {
      info('Starting session cleanup...');
      
      const deletedCount = await Session.cleanupExpired();
      
      info('Session cleanup completed', { 
        deletedSessions: deletedCount,
        timestamp: new Date().toISOString()
      });
      
      return deletedCount;
    } catch (err) {
      error('Session cleanup failed', { 
        error: err.message, 
        stack: err.stack 
      });
      return 0;
    }
  }

  /**
   * Get cleanup status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    };
  }
}

// Export singleton instance
module.exports = new SessionCleanupService();
