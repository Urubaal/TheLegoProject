const { Pool } = require('pg');

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

class LegoSet {
  static async create(setData) {
    const { 
      setNumber, 
      name, 
      theme, 
      subtheme, 
      year, 
      pieces, 
      minifigs, 
      retailPrice, 
      imageUrl,
      description,
      availability 
    } = setData;
    
    const query = `
      INSERT INTO lego_sets (
        set_number, name, theme, subtheme, year, pieces, minifigs, 
        retail_price, image_url, description, availability, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
              CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw', 
              CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw')
      RETURNING *
    `;
    
    const values = [
      setNumber, name, theme, subtheme, year, pieces, minifigs,
      retailPrice, imageUrl, description, availability
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findBySetNumber(setNumber) {
    const query = 'SELECT * FROM lego_sets WHERE set_number = $1';
    const values = [setNumber];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM lego_sets WHERE id = $1';
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(options = {}) {
    const { theme, year, limit = 50, offset = 0 } = options;
    let query = 'SELECT * FROM lego_sets WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (theme) {
      paramCount++;
      query += ` AND theme ILIKE $${paramCount}`;
      values.push(`%${theme}%`);
    }

    if (year) {
      paramCount++;
      query += ` AND year = $${paramCount}`;
      values.push(year);
    }

    query += ` ORDER BY set_number DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async search(query, options = {}) {
    const { limit = 20, offset = 0 } = options;
    const searchQuery = `
      SELECT * FROM lego_sets 
      WHERE name ILIKE $1 OR set_number ILIKE $1 OR theme ILIKE $1
      ORDER BY 
        CASE 
          WHEN set_number ILIKE $1 THEN 1
          WHEN name ILIKE $1 THEN 2
          ELSE 3
        END,
        set_number DESC
      LIMIT $2 OFFSET $3
    `;
    
    const values = [`%${query}%`, limit, offset];
    
    try {
      const result = await pool.query(searchQuery, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
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
    values.push(id);

    const query = `UPDATE lego_sets SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM lego_sets WHERE id = $1';
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get themes for filtering
  static async getThemes() {
    const query = `
      SELECT DISTINCT theme 
      FROM lego_sets 
      WHERE theme IS NOT NULL 
      ORDER BY theme
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.theme);
    } catch (error) {
      throw error;
    }
  }

  // Get years for filtering
  static async getYears() {
    const query = `
      SELECT DISTINCT year 
      FROM lego_sets 
      WHERE year IS NOT NULL 
      ORDER BY year DESC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => row.year);
    } catch (error) {
      throw error;
    }
  }

  // Get statistics
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_sets,
        COUNT(DISTINCT theme) as total_themes,
        AVG(pieces) as avg_pieces,
        AVG(retail_price) as avg_price,
        MIN(year) as earliest_year,
        MAX(year) as latest_year
      FROM lego_sets
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = LegoSet;
