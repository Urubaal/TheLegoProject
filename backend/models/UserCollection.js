const { Pool } = require('pg');
const { error, info, debug } = require('../utils/logger');

// Database connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  options: '-c timezone=UTC',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 30000,
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

class UserCollection {
  static async addToCollection(userId, setNumber, collectionType, quantity = 1, paidPrice = null, condition = 'new', notes = '') {
    // collectionType: 'owned' or 'wanted'
    const query = `
      INSERT INTO user_collections (
        user_id, set_number, collection_type, quantity, paid_price, 
        condition, notes, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 
              CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw', 
              CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw')
      ON CONFLICT (user_id, set_number, collection_type) 
      DO UPDATE SET 
        quantity = EXCLUDED.quantity,
        paid_price = EXCLUDED.paid_price,
        condition = EXCLUDED.condition,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw'
      RETURNING *
    `;
    
    const values = [userId, setNumber, collectionType, quantity, paidPrice, condition, notes];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async removeFromCollection(userId, setNumber, collectionType) {
    const query = `
      DELETE FROM user_collections 
      WHERE user_id = $1 AND set_number = $2 AND collection_type = $3
    `;
    
    const values = [userId, setNumber, collectionType];
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getUserCollection(userId, collectionType = null) {
    let query = `
      SELECT 
        uc.*,
        ls.name,
        ls.theme,
        ls.subtheme,
        ls.year,
        ls.pieces,
        ls.minifigs,
        ls.retail_price,
        ls.image_url,
        ls.availability
      FROM user_collections uc
      LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
      WHERE uc.user_id = $1
    `;
    
    const values = [userId];
    
    if (collectionType) {
      query += ' AND uc.collection_type = $2';
      values.push(collectionType);
    }
    
    query += ' ORDER BY uc.created_at DESC';
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getCollectionItem(userId, setNumber, collectionType) {
    const query = `
      SELECT 
        uc.*,
        ls.name,
        ls.theme,
        ls.subtheme,
        ls.year,
        ls.pieces,
        ls.minifigs,
        ls.retail_price,
        ls.image_url,
        ls.availability
      FROM user_collections uc
      LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
      WHERE uc.user_id = $1 AND uc.set_number = $2 AND uc.collection_type = $3
    `;
    
    const values = [userId, setNumber, collectionType];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateCollectionItem(userId, setNumber, collectionType, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'user_id' && key !== 'set_number' && key !== 'collection_type') {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    fields.push('updated_at = CURRENT_TIMESTAMP AT TIME ZONE \'Europe/Warsaw\'');
    values.push(userId, setNumber, collectionType);

    const query = `
      UPDATE user_collections 
      SET ${fields.join(', ')} 
      WHERE user_id = $${paramCount + 1} AND set_number = $${paramCount + 2} AND collection_type = $${paramCount + 3}
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getCollectionStats(userId) {
    const query = `
      SELECT 
        COUNT(CASE WHEN collection_type = 'owned' THEN 1 END) as owned_sets,
        COUNT(CASE WHEN collection_type = 'wanted' THEN 1 END) as wanted_sets,
        SUM(CASE WHEN collection_type = 'owned' THEN quantity ELSE 0 END) as total_owned_quantity,
        SUM(CASE WHEN collection_type = 'owned' AND paid_price IS NOT NULL THEN paid_price * quantity ELSE 0 END) as total_paid_value,
        AVG(CASE WHEN collection_type = 'owned' AND paid_price IS NOT NULL THEN paid_price ELSE NULL END) as avg_paid_price,
        SUM(CASE WHEN collection_type = 'owned' THEN ls.retail_price * quantity ELSE 0 END) as total_retail_value
      FROM user_collections uc
      LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
      WHERE uc.user_id = $1
    `;
    
    const values = [userId];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getCollectionByTheme(userId, theme) {
    const query = `
      SELECT 
        uc.*,
        ls.name,
        ls.theme,
        ls.subtheme,
        ls.year,
        ls.pieces,
        ls.minifigs,
        ls.retail_price,
        ls.image_url
      FROM user_collections uc
      LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
      WHERE uc.user_id = $1 AND ls.theme ILIKE $2
      ORDER BY ls.year DESC, ls.set_number
    `;
    
    const values = [userId, `%${theme}%`];
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async searchUserCollection(userId, searchTerm, collectionType = null) {
    let query = `
      SELECT 
        uc.*,
        ls.name,
        ls.theme,
        ls.subtheme,
        ls.year,
        ls.pieces,
        ls.minifigs,
        ls.retail_price,
        ls.image_url
      FROM user_collections uc
      LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
      WHERE uc.user_id = $1 
        AND (ls.name ILIKE $2 OR ls.set_number ILIKE $2 OR ls.theme ILIKE $2)
    `;
    
    const values = [userId, `%${searchTerm}%`];
    
    if (collectionType) {
      query += ' AND uc.collection_type = $3';
      values.push(collectionType);
    }
    
    query += ' ORDER BY ls.name';
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Check if user has a specific set in collection
  static async hasSetInCollection(userId, setNumber, collectionType) {
    const query = `
      SELECT * FROM user_collections 
      WHERE user_id = $1 AND set_number = $2 AND collection_type = $3
    `;
    
    const values = [userId, setNumber, collectionType];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Get recent additions to collection
  static async getRecentAdditions(userId, limit = 10) {
    const query = `
      SELECT 
        uc.*,
        ls.name,
        ls.theme,
        ls.year,
        ls.retail_price,
        ls.image_url
      FROM user_collections uc
      LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
      WHERE uc.user_id = $1
      ORDER BY uc.created_at DESC
      LIMIT $2
    `;
    
    const values = [userId, limit];
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Delete user's entire collection (for account deletion)
  static async deleteUserCollection(userId) {
    const query = 'DELETE FROM user_collections WHERE user_id = $1';
    const values = [userId];
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserCollection;