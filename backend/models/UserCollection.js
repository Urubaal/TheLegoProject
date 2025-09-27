const { Pool } = require('pg');

// Database connection pool with optimized settings
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  // Connection pooling configuration for performance
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  acquireTimeoutMillis: 60000, // Return error after 60 seconds if connection could not be acquired
  // Additional performance settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

class UserCollection {
  // =============================================
  // OWNED SETS METHODS
  // =============================================
  
  static async addOwnedSet(userId, setData) {
    const { 
      lego_set_id, 
      set_number, 
      set_name, 
      condition_status = 'new', 
      purchase_price, 
      purchase_currency = 'PLN',
      notes 
    } = setData;
    
    const query = `
      INSERT INTO user_owned_sets 
      (user_id, lego_set_id, set_number, set_name, condition_status, purchase_price, purchase_currency, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, set_number) 
      DO UPDATE SET 
        lego_set_id = EXCLUDED.lego_set_id,
        set_name = EXCLUDED.set_name,
        condition_status = EXCLUDED.condition_status,
        purchase_price = EXCLUDED.purchase_price,
        purchase_currency = EXCLUDED.purchase_currency,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [userId, lego_set_id, set_number, set_name, condition_status, purchase_price, purchase_currency, notes];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getOwnedSets(userId) {
    const query = `
      SELECT 
        uos.*,
        ls.name as lego_set_name,
        ls.theme,
        ls.pieces,
        ls.minifigures,
        ls.year_released
      FROM user_owned_sets uos
      LEFT JOIN lego_sets ls ON uos.lego_set_id = ls.id
      WHERE uos.user_id = $1
      ORDER BY uos.added_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async updateOwnedSet(userId, setId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(setId, userId);
    const query = `
      UPDATE user_owned_sets 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async deleteOwnedSet(userId, setId) {
    const query = 'DELETE FROM user_owned_sets WHERE id = $1 AND user_id = $2';
    
    try {
      const result = await pool.query(query, [setId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // =============================================
  // WANTED SETS METHODS
  // =============================================
  
  static async addWantedSet(userId, setData) {
    const { 
      lego_set_id, 
      set_number, 
      set_name, 
      max_price, 
      max_currency = 'PLN',
      priority = 1,
      notes 
    } = setData;
    
    const query = `
      INSERT INTO user_wanted_sets 
      (user_id, lego_set_id, set_number, set_name, max_price, max_currency, priority, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, set_number) 
      DO UPDATE SET 
        lego_set_id = EXCLUDED.lego_set_id,
        set_name = EXCLUDED.set_name,
        max_price = EXCLUDED.max_price,
        max_currency = EXCLUDED.max_currency,
        priority = EXCLUDED.priority,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [userId, lego_set_id, set_number, set_name, max_price, max_currency, priority, notes];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getWantedSets(userId) {
    const query = `
      SELECT 
        uws.*,
        ls.name as lego_set_name,
        ls.theme,
        ls.pieces,
        ls.minifigures,
        ls.year_released
      FROM user_wanted_sets uws
      LEFT JOIN lego_sets ls ON uws.lego_set_id = ls.id
      WHERE uws.user_id = $1
      ORDER BY uws.priority ASC, uws.added_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
  
  static async updateWantedSet(userId, setId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(setId, userId);
    const query = `
      UPDATE user_wanted_sets 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async deleteWantedSet(userId, setId) {
    const query = 'DELETE FROM user_wanted_sets WHERE id = $1 AND user_id = $2';
    
    try {
      const result = await pool.query(query, [setId, userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // =============================================
  // OWNED MINIFIGS METHODS
  // =============================================
  
  static async addOwnedMinifig(userId, minifigData) {
    const { 
      minifig_name, 
      minifig_number, 
      condition_status = 'new', 
      purchase_price, 
      purchase_currency = 'PLN',
      notes 
    } = minifigData;
    
    const query = `
      INSERT INTO user_owned_minifigs 
      (user_id, minifig_name, minifig_number, condition_status, purchase_price, purchase_currency, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, minifig_name, minifig_number) 
      DO UPDATE SET 
        condition_status = EXCLUDED.condition_status,
        purchase_price = EXCLUDED.purchase_price,
        purchase_currency = EXCLUDED.purchase_currency,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [userId, minifig_name, minifig_number, condition_status, purchase_price, purchase_currency, notes];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getOwnedMinifigs(userId) {
    const query = `
      SELECT * FROM user_owned_minifigs 
      WHERE user_id = $1
      ORDER BY added_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
  
  // =============================================
  // WANTED MINIFIGS METHODS
  // =============================================
  
  static async addWantedMinifig(userId, minifigData) {
    const { 
      minifig_name, 
      minifig_number, 
      max_price, 
      max_currency = 'PLN',
      priority = 1,
      notes 
    } = minifigData;
    
    const query = `
      INSERT INTO user_wanted_minifigs 
      (user_id, minifig_name, minifig_number, max_price, max_currency, priority, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, minifig_name, minifig_number) 
      DO UPDATE SET 
        max_price = EXCLUDED.max_price,
        max_currency = EXCLUDED.max_currency,
        priority = EXCLUDED.priority,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [userId, minifig_name, minifig_number, max_price, max_currency, priority, notes];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  static async getWantedMinifigs(userId) {
    const query = `
      SELECT * FROM user_wanted_minifigs 
      WHERE user_id = $1
      ORDER BY priority ASC, added_at DESC
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
  
  // =============================================
  // COLLECTION STATISTICS
  // =============================================
  
  static async getCollectionStats(userId) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM user_owned_sets WHERE user_id = $1) as owned_sets_count,
        (SELECT COUNT(*) FROM user_owned_sets WHERE user_id = $1 AND condition_status = 'new') as new_sets_count,
        (SELECT COUNT(*) FROM user_owned_sets WHERE user_id = $1 AND condition_status = 'used') as used_sets_count,
        (SELECT COALESCE(SUM(pieces), 0) FROM user_owned_sets uos 
         LEFT JOIN lego_sets ls ON uos.lego_set_id = ls.id WHERE uos.user_id = $1) as total_pieces,
        (SELECT COALESCE(SUM(minifigures), 0) FROM user_owned_sets uos 
         LEFT JOIN lego_sets ls ON uos.lego_set_id = ls.id WHERE uos.user_id = $1) as total_minifigs,
        (SELECT COUNT(*) FROM user_wanted_sets WHERE user_id = $1) as wanted_sets_count,
        (SELECT COUNT(*) FROM user_owned_minifigs WHERE user_id = $1) as owned_minifigs_count,
        (SELECT COUNT(*) FROM user_wanted_minifigs WHERE user_id = $1) as wanted_minifigs_count
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserCollection;
