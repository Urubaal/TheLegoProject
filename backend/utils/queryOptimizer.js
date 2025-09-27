/**
 * Query Optimization Utilities
 * Provides optimized query patterns and caching strategies
 */

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Optimized user collection query with caching
   */
  async getOptimizedUserCollections(pool, userId, type, options = {}) {
    const cacheKey = `user_collections_${userId}_${type}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.queryCache.delete(cacheKey);
    }

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

    // Build optimized query
    let conditionClause = '';
    const values = [userId, limit, offset];
    let paramCount = 3;

    if (condition) {
      conditionClause = `AND condition_status = $${paramCount}`;
      values.push(condition);
      paramCount++;
    }

    // Use prepared statement for better performance
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
      const result = await pool.query(query, values);
      
      // Cache the result
      this.queryCache.set(cacheKey, {
        data: result.rows,
        timestamp: Date.now()
      });

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimized search with full-text search capabilities
   */
  async searchWithFullText(pool, searchTerm, userId = null, type = 'all') {
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    
    const queries = [];
    let values = [];

    if (userId) {
      values = [userId, searchPattern];
    } else {
      values = [searchPattern];
    }

    if (type === 'all' || type === 'lego_sets') {
      if (userId) {
        queries.push(`
          SELECT 'lego_set' as type, ls.id, ls.set_number, ls.name, 
                 ls.theme, ls.pieces, ls.year_released, NULL as user_status,
                 NULL as added_at
          FROM lego_sets ls
          WHERE LOWER(ls.name) LIKE $2 OR LOWER(ls.set_number) LIKE $2
          LIMIT 20
        `);
      } else {
        queries.push(`
          SELECT 'lego_set' as type, ls.id, ls.set_number, ls.name, 
                 ls.theme, ls.pieces, ls.year_released, NULL as user_status,
                 NULL as added_at
          FROM lego_sets ls
          WHERE LOWER(ls.name) LIKE $1 OR LOWER(ls.set_number) LIKE $1
          LIMIT 20
        `);
      }
    }

    if (userId && (type === 'all' || type === 'owned_sets')) {
      queries.push(`
        SELECT 'owned_set' as type, id, set_number as set_number, set_name as name,
               NULL as theme, NULL as pieces, NULL as year_released, 'owned' as user_status,
               added_at
        FROM user_owned_sets 
        WHERE user_id = $1 AND LOWER(set_name) LIKE $2
        LIMIT 10
      `);
    }

    if (userId && (type === 'all' || type === 'wanted_sets')) {
      queries.push(`
        SELECT 'wanted_set' as type, id, set_number as set_number, set_name as name,
               NULL as theme, NULL as pieces, NULL as year_released, 'wanted' as user_status,
               added_at
        FROM user_wanted_sets 
        WHERE user_id = $1 AND LOWER(set_name) LIKE $2
        LIMIT 10
      `);
    }

    const combinedQuery = queries.join(' UNION ALL ') + ' ORDER BY added_at DESC NULLS LAST LIMIT 50';

    try {
      const result = await pool.query(combinedQuery, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimized collection statistics query
   */
  async getOptimizedCollectionStats(pool, userId) {
    const cacheKey = `collection_stats_${userId}`;
    
    // Check cache
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.queryCache.delete(cacheKey);
    }

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
        (SELECT COUNT(*) FROM user_wanted_minifigs WHERE user_id = $1) as wanted_minifigs_count,
        (SELECT COALESCE(SUM(purchase_price), 0) FROM user_owned_sets WHERE user_id = $1 AND purchase_price IS NOT NULL) as total_investment,
        (SELECT COALESCE(AVG(purchase_price), 0) FROM user_owned_sets WHERE user_id = $1 AND purchase_price IS NOT NULL) as avg_set_price
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      const stats = result.rows[0];
      
      // Cache the result
      this.queryCache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Batch update for better performance
   */
  async batchUpdateUserCollections(pool, updates) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const results = [];
      
      for (const update of updates) {
        const { table, id, userId, data } = update;
        
        const fields = [];
        const values = [];
        let paramCount = 1;
        
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            fields.push(`${key} = $${paramCount}`);
            values.push(data[key]);
            paramCount++;
          }
        });
        
        if (fields.length === 0) {
          continue;
        }
        
        values.push(id, userId);
        const query = `
          UPDATE ${table} 
          SET ${fields.join(', ')}, updated_at = NOW()
          WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
          RETURNING *
        `;
        
        const result = await client.query(query, values);
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
   * Clear cache for specific user or all cache
   */
  clearCache(userId = null) {
    if (userId) {
      // Clear cache entries for specific user
      for (const [key] of this.queryCache) {
        if (key.includes(userId)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.queryCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.queryCache.keys())
    };
  }
}

module.exports = QueryOptimizer;
