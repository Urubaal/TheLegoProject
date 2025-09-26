const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
});

class User {
  static async create(userData) {
    const { email, password, username, display_name, country } = userData;
    const query = `
      INSERT INTO users (email, password_hash, username, display_name, country, created_at, is_active)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      RETURNING id, email, username, display_name, country, created_at, is_active
    `;
    const values = [email, password, username, display_name || username, country, true];
    
    try {
      const result = await pool.query(query, values);
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
