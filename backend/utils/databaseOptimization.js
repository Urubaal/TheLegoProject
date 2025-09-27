const { Pool } = require('pg');

/**
 * Database Performance Optimization Utilities
 * Contains optimized query patterns and performance monitoring tools
 */

class DatabaseOptimization {
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER || 'lego_user',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'lego_purchase_system',
      port: process.env.POSTGRES_PORT || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      acquireTimeoutMillis: 60000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    });
  }

  /**
   * Optimized query for user collections with pagination
   */
  async getUserCollectionsPaginated(userId, type = 'owned_sets', options = {}) {
    const { page = 1, limit = 20, condition = null, sortBy = 'added_at', sortOrder = 'DESC' } = options;
    const offset = (page - 1) * limit;
    
    const tableMap = {
      'owned_sets': 'user_owned_sets',
      'wanted_sets': 'user_wanted_sets',
      'owned_minifigs': 'user_owned_minifigs',
      'wanted_minifigs': 'user_wanted_minifigs'
    };

    const table = tableMap[type];
    if (!table) {
      throw new Error(`Invalid collection type: ${type}`);
    }

    // Build condition clause
    let conditionClause = '';
    const values = [userId, limit, offset];
    let paramCount = 3;

    if (condition) {
      conditionClause = `AND condition_status = $${paramCount}`;
      values.push(condition);
      paramCount++;
    }

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['added_at', 'updated_at', 'set_name', 'minifig_name', 'purchase_price', 'max_price', 'priority'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'added_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT * FROM ${table}
      WHERE user_id = $1 ${conditionClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await this.pool.query(query, values);
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total: await this.getCollectionCount(userId, type, condition),
          hasMore: result.rows.length === limit
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get collection count for pagination
   */
  async getCollectionCount(userId, type, condition = null) {
    const tableMap = {
      'owned_sets': 'user_owned_sets',
      'wanted_sets': 'user_wanted_sets',
      'owned_minifigs': 'user_owned_minifigs',
      'wanted_minifigs': 'user_wanted_minifigs'
    };

    const table = tableMap[type];
    if (!table) {
      throw new Error(`Invalid collection type: ${type}`);
    }

    let conditionClause = '';
    const values = [userId];
    let paramCount = 1;

    if (condition) {
      conditionClause = `AND condition_status = $${paramCount}`;
      values.push(condition);
      paramCount++;
    }

    const query = `
      SELECT COUNT(*) as count FROM ${table}
      WHERE user_id = $1 ${conditionClause}
    `;

    try {
      const result = await this.pool.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimized search across user collections
   */
  async searchUserCollections(userId, searchTerm, type = 'all') {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    const queries = [];
    const values = [userId, searchPattern];

    if (type === 'all' || type === 'owned_sets') {
      queries.push(`
        SELECT 'owned_set' as type, id, set_name as name, 'owned' as status, added_at
        FROM user_owned_sets 
        WHERE user_id = $1 AND LOWER(set_name) LIKE $2
      `);
    }

    if (type === 'all' || type === 'wanted_sets') {
      queries.push(`
        SELECT 'wanted_set' as type, id, set_name as name, 'wanted' as status, added_at
        FROM user_wanted_sets 
        WHERE user_id = $1 AND LOWER(set_name) LIKE $2
      `);
    }

    if (type === 'all' || type === 'owned_minifigs') {
      queries.push(`
        SELECT 'owned_minifig' as type, id, minifig_name as name, 'owned' as status, added_at
        FROM user_owned_minifigs 
        WHERE user_id = $1 AND LOWER(minifig_name) LIKE $2
      `);
    }

    if (type === 'all' || type === 'wanted_minifigs') {
      queries.push(`
        SELECT 'wanted_minifig' as type, id, minifig_name as name, 'wanted' as status, added_at
        FROM user_wanted_minifigs 
        WHERE user_id = $1 AND LOWER(minifig_name) LIKE $2
      `);
    }

    const combinedQuery = queries.join(' UNION ALL ') + ' ORDER BY added_at DESC LIMIT 50';

    try {
      const result = await this.pool.query(combinedQuery, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchInsertUserCollections(userId, collections, type) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const tableMap = {
        'owned_sets': 'user_owned_sets',
        'wanted_sets': 'user_wanted_sets',
        'owned_minifigs': 'user_owned_minifigs',
        'wanted_minifigs': 'user_wanted_minifigs'
      };

      const table = tableMap[type];
      if (!table) {
        throw new Error(`Invalid collection type: ${type}`);
      }

      // Build batch insert query based on type
      let insertQuery = '';
      const results = [];

      for (const collection of collections) {
        if (type === 'owned_sets') {
          insertQuery = `
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
        } else if (type === 'wanted_sets') {
          insertQuery = `
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
        }
        // Add other types as needed

        const values = [userId, ...Object.values(collection)];
        const result = await client.query(insertQuery, values);
        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Performance monitoring - get slow queries
   */
  async getSlowQueries(limit = 10) {
    const query = `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC 
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      // pg_stat_statements might not be enabled
      console.warn('pg_stat_statements not available for performance monitoring');
      return [];
    }
  }

  /**
   * Get database connection pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Cleanup method
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseOptimization;
