const { Pool } = require('pg');
const { error, info, debug } = require('../utils/logger');

// Database connection pool with optimized settings
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  // Connection pooling configuration for performance
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // Adjust based on environment
  min: 2, // Minimum connections to keep alive
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection could not be established
  acquireTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be acquired
  // Force UTC timestamps and handle timezone in application
  options: '-c timezone=UTC',
  // Additional performance settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Statement timeout for long-running queries
  statement_timeout: 30000,
  // Query timeout
  query_timeout: 10000
});

// Pool error handling
pool.on('error', (err) => {
  error('Database pool error', {
    error: err.message,
    stack: err.stack
  });
});

pool.on('connect', () => {
  info('Database pool connected');
});

pool.on('acquire', () => {
  debug('Database connection acquired');
});

pool.on('remove', () => {
  debug('Database connection removed');
});

// Helper function to convert UTC to Poland time for display
const formatPolishTime = (utcDate) => {
  return new Date(utcDate).toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

class User {
  static async create(userData) {
    const { email, password, username, display_name, first_name, last_name, country } = userData;
    
    // Split display_name into first_name and last_name if provided
    const nameParts = (display_name || first_name || '').split(' ');
    const firstName = nameParts[0] || email.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const query = `
      INSERT INTO users (email, password_hash, username, first_name, last_name, created_at, updated_at, is_active)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6)
      RETURNING id, email, username, first_name, last_name, created_at, is_active
    `;
    const values = [email, password, username || email.split('@')[0], firstName, lastName, true];
    
    try {
      console.log('Creating user with Poland timezone');
      const result = await pool.query(query, values);
      console.log('User created with created_at:', result.rows[0].created_at);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async updatePassword(id, hashedPassword) {
    const query = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
    const values = [hashedPassword, id];
    
    try {
      await pool.query(query, values);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async updateLastLogin(id) {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw', 
          updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw' 
      WHERE id = $1
      RETURNING last_login, updated_at
    `;
    const values = [id];
    
    try {
      console.log('Executing updateLastLogin query for user:', id);
      const result = await pool.query(query, values);
      console.log('UpdateLastLogin result:', result.rowCount, 'rows affected');
      if (result.rows[0]) {
        console.log('New last_login:', result.rows[0].last_login);
        console.log('New updated_at:', result.rows[0].updated_at);
      }
      return true;
    } catch (error) {
      console.error('Error updating last_login:', error);
      throw error;
    }
  }

  static async updateEmailVerification(id, isVerified) {
    const query = 'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2';
    const values = [isVerified, id];
    
    try {
      await pool.query(query, values);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(id, profileData) {
    const { username, display_name, country } = profileData;
    const query = `
      UPDATE users 
      SET username = $1, display_name = $2, country = $3, updated_at = NOW() 
      WHERE id = $4
      RETURNING id, email, username, display_name, country, created_at, is_active
    `;
    const values = [username, display_name, country, id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const values = [username];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      return { success: true, timestamp: result.rows[0].now };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = User;
