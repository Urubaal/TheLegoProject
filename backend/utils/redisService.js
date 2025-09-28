const redis = require('redis');
const { error, warn, info } = require('./logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              warn('Redis max retry attempts reached', { retries });
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', (err) => {
        error('Redis client error', { error: err.message, stack: err.stack });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        warn('Redis client connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      return true;
    } catch (err) {
      error('Failed to connect to Redis', { error: err.message, stack: err.stack });
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        info('Redis client disconnected');
      } catch (err) {
        error('Error disconnecting Redis client', { error: err.message });
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  async isHealthy() {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      await this.client.ping();
      return true;
    } catch (err) {
      error('Redis health check failed', { error: err.message });
      return false;
    }
  }

  // Password reset token methods
  async storeResetToken(token, data, ttlSeconds = 3600) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const key = `reset:${token}`;
      const value = JSON.stringify({
        ...data,
        createdAt: new Date().toISOString()
      });
      
      await this.client.set(key, value, { EX: ttlSeconds });
      info('Password reset token stored', { 
        token: token.substring(0, 10) + '...', 
        ttl: ttlSeconds,
        userId: data.userId 
      });
      return true;
    } catch (err) {
      error('Failed to store reset token', { error: err.message, token: token.substring(0, 10) + '...' });
      throw err;
    }
  }

  async getResetToken(token) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const key = `reset:${token}`;
      const value = await this.client.get(key);
      
      if (!value) {
        return null;
      }

      const data = JSON.parse(value);
      info('Password reset token retrieved', { 
        token: token.substring(0, 10) + '...',
        userId: data.userId 
      });
      return data;
    } catch (err) {
      error('Failed to get reset token', { error: err.message, token: token.substring(0, 10) + '...' });
      throw err;
    }
  }

  async markResetTokenAsUsed(token) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const key = `reset:${token}`;
      const data = await this.getResetToken(token);
      
      if (!data) {
        return false;
      }

      data.used = true;
      data.usedAt = new Date().toISOString();
      
      // Update the token with used flag
      await this.client.set(key, JSON.stringify(data), { EX: 300 }); // Keep for 5 minutes after use
      
      info('Password reset token marked as used', { 
        token: token.substring(0, 10) + '...',
        userId: data.userId 
      });
      return true;
    } catch (err) {
      error('Failed to mark reset token as used', { error: err.message, token: token.substring(0, 10) + '...' });
      throw err;
    }
  }

  async deleteResetToken(token) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const key = `reset:${token}`;
      const result = await this.client.del(key);
      
      if (result > 0) {
        info('Password reset token deleted', { token: token.substring(0, 10) + '...' });
        return true;
      }
      return false;
    } catch (err) {
      error('Failed to delete reset token', { error: err.message, token: token.substring(0, 10) + '...' });
      throw err;
    }
  }

  // Generic key-value operations
  async set(key, value, ttlSeconds = null) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      if (ttlSeconds) {
        await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
      return true;
    } catch (err) {
      error('Failed to set key', { error: err.message, key });
      throw err;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      error('Failed to get key', { error: err.message, key });
      throw err;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (err) {
      error('Failed to delete key', { error: err.message, key });
      throw err;
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;
