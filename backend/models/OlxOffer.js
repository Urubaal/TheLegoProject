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

class OlxOffer {
  static async create(offerData) {
    const { 
      setNumber, 
      title, 
      price, 
      condition, 
      location, 
      sellerName, 
      sellerRating, 
      offerUrl, 
      imageUrl,
      description,
      isActive = true
    } = offerData;
    
    const query = `
      INSERT INTO olx_offers (
        set_number, title, price, condition, location, seller_name, 
        seller_rating, offer_url, image_url, description, is_active,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw', 
              CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw')
      ON CONFLICT (offer_url) 
      DO UPDATE SET 
        price = EXCLUDED.price,
        condition = EXCLUDED.condition,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw'
      RETURNING *
    `;
    
    const values = [
      setNumber, title, price, condition, location, sellerName,
      sellerRating, offerUrl, imageUrl, description, isActive
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findBySetNumber(setNumber, options = {}) {
    const { activeOnly = true, limit = 50, offset = 0, sortBy = 'price', sortOrder = 'ASC' } = options;
    
    let query = `
      SELECT 
        oo.*,
        ls.name as set_name,
        ls.theme,
        ls.year,
        ls.retail_price
      FROM olx_offers oo
      LEFT JOIN lego_sets ls ON oo.set_number = ls.set_number
      WHERE oo.set_number = $1
    `;
    
    const values = [setNumber];
    
    if (activeOnly) {
      query += ' AND oo.is_active = true';
    }
    
    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['price', 'created_at', 'seller_rating', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      query += ` ORDER BY oo.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY oo.price ASC';
    }
    
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT 
        oo.*,
        ls.name as set_name,
        ls.theme,
        ls.year,
        ls.retail_price,
        ls.image_url as set_image_url
      FROM olx_offers oo
      LEFT JOIN lego_sets ls ON oo.set_number = ls.set_number
      WHERE oo.id = $1
    `;
    
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(options = {}) {
    const { 
      activeOnly = true, 
      minPrice = null, 
      maxPrice = null, 
      condition = null, 
      location = null,
      limit = 50, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    
    let query = `
      SELECT 
        oo.*,
        ls.name as set_name,
        ls.theme,
        ls.year,
        ls.retail_price
      FROM olx_offers oo
      LEFT JOIN lego_sets ls ON oo.set_number = ls.set_number
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;
    
    if (activeOnly) {
      query += ' AND oo.is_active = true';
    }
    
    if (minPrice !== null) {
      paramCount++;
      query += ` AND oo.price >= $${paramCount}`;
      values.push(minPrice);
    }
    
    if (maxPrice !== null) {
      paramCount++;
      query += ` AND oo.price <= $${paramCount}`;
      values.push(maxPrice);
    }
    
    if (condition) {
      paramCount++;
      query += ` AND oo.condition ILIKE $${paramCount}`;
      values.push(`%${condition}%`);
    }
    
    if (location) {
      paramCount++;
      query += ` AND oo.location ILIKE $${paramCount}`;
      values.push(`%${location}%`);
    }
    
    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['price', 'created_at', 'seller_rating', 'title', 'set_number'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      query += ` ORDER BY oo.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY oo.created_at DESC';
    }
    
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async search(query, options = {}) {
    const { 
      activeOnly = true, 
      limit = 20, 
      offset = 0,
      sortBy = 'price',
      sortOrder = 'ASC'
    } = options;
    
    let searchQuery = `
      SELECT 
        oo.*,
        ls.name as set_name,
        ls.theme,
        ls.year,
        ls.retail_price
      FROM olx_offers oo
      LEFT JOIN lego_sets ls ON oo.set_number = ls.set_number
      WHERE (oo.title ILIKE $1 OR oo.set_number ILIKE $1 OR ls.name ILIKE $1 OR ls.theme ILIKE $1)
    `;
    
    const values = [`%${query}%`];
    
    if (activeOnly) {
      searchQuery += ' AND oo.is_active = true';
    }
    
    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['price', 'created_at', 'seller_rating', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      searchQuery += ` ORDER BY oo.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      searchQuery += ' ORDER BY oo.price ASC';
    }
    
    searchQuery += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);
    
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

    const query = `UPDATE olx_offers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async markAsInactive(id) {
    const query = `
      UPDATE olx_offers 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw'
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM olx_offers WHERE id = $1';
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get price statistics for a set
  static async getPriceStats(setNumber) {
    const query = `
      SELECT 
        COUNT(*) as total_offers,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_offers
      FROM olx_offers
      WHERE set_number = $1 AND price > 0
    `;
    
    const values = [setNumber];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get offers by condition
  static async getOffersByCondition(setNumber) {
    const query = `
      SELECT 
        condition,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM olx_offers
      WHERE set_number = $1 AND is_active = true
      GROUP BY condition
      ORDER BY condition
    `;
    
    const values = [setNumber];
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get offers by location
  static async getOffersByLocation(setNumber) {
    const query = `
      SELECT 
        location,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM olx_offers
      WHERE set_number = $1 AND is_active = true
      GROUP BY location
      ORDER BY count DESC, avg_price ASC
    `;
    
    const values = [setNumber];
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Clean up old inactive offers
  static async cleanupOldOffers(daysOld = 30) {
    const query = `
      DELETE FROM olx_offers 
      WHERE is_active = false 
        AND updated_at < CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw' - INTERVAL '${daysOld} days'
    `;
    
    try {
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  // Get statistics
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_offers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_offers,
        COUNT(DISTINCT set_number) as unique_sets,
        COUNT(DISTINCT location) as unique_locations,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM olx_offers
      WHERE price > 0
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OlxOffer;
