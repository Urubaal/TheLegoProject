const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://lego_user@localhost:5432/lego_purchase_system'
});

/**
 * Pobierz logi z bazy danych z filtrowaniem i paginacją
 */
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      level,
      service = 'lego-backend',
      environment,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 1000); // Maksymalnie 1000 rekordów

    // Buduj zapytanie SQL
    const whereConditions = ['service = $1'];
    const queryParams = [service];
    let paramIndex = 2;

    if (level) {
      whereConditions.push(`level = $${paramIndex}`);
      queryParams.push(level);
      paramIndex++;
    }

    if (environment) {
      whereConditions.push(`environment = $${paramIndex}`);
      queryParams.push(environment);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      queryParams.push(parseInt(userId));
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(new Date(endDate));
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(message ILIKE $${paramIndex} OR metadata::text ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Zapytanie o logi
    const logsQuery = `
      SELECT 
        id,
        level,
        message,
        metadata,
        service,
        environment,
        user_id,
        ip_address,
        user_agent,
        created_at
      FROM system_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(maxLimit, offset);

    const logsResult = await pool.query(logsQuery, queryParams);

    // Zapytanie o całkowitą liczbę rekordów
    const countQuery = `
      SELECT COUNT(*) as total
      FROM system_logs
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: maxLimit,
          total,
          pages: Math.ceil(total / maxLimit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs'
    });
  }
};

/**
 * Pobierz statystyki logów
 */
const getLogStats = async (req, res) => {
  try {
    const { service = 'lego-backend', environment } = req.query;

    const whereConditions = ['service = $1'];
    const queryParams = [service];
    let paramIndex = 2;

    if (environment) {
      whereConditions.push(`environment = $${paramIndex}`);
      queryParams.push(environment);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Statystyki według poziomów
    const levelStatsQuery = `
      SELECT 
        level,
        COUNT(*) as count,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM system_logs
      ${whereClause}
      GROUP BY level
      ORDER BY level
    `;

    // Statystyki według dni (ostatnie 30 dni)
    const dailyStatsQuery = `
      SELECT 
        DATE(created_at) as date,
        level,
        COUNT(*) as count
      FROM system_logs
      ${whereClause}
      AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), level
      ORDER BY date DESC, level
    `;

    // Statystyki według godzin (ostatnie 24 godziny)
    const hourlyStatsQuery = `
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        level,
        COUNT(*) as count
      FROM system_logs
      ${whereClause}
      AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at), level
      ORDER BY hour DESC, level
    `;

    const [levelStats, dailyStats, hourlyStats] = await Promise.all([
      pool.query(levelStatsQuery, queryParams),
      pool.query(dailyStatsQuery, queryParams),
      pool.query(hourlyStatsQuery, queryParams)
    ]);

    res.json({
      success: true,
      data: {
        levelStats: levelStats.rows,
        dailyStats: dailyStats.rows,
        hourlyStats: hourlyStats.rows
      }
    });

  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log statistics'
    });
  }
};

/**
 * Wyszukaj logi za pomocą zaawansowanych filtrów
 */
const searchLogs = async (req, res) => {
  try {
    const {
      query: searchQuery,
      level,
      userId,
      ip,
      startDate,
      endDate,
      limit = 100
    } = req.body;

    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (searchQuery) {
      whereConditions.push(`(message ILIKE $${paramIndex} OR metadata::text ILIKE $${paramIndex})`);
      queryParams.push(`%${searchQuery}%`);
      paramIndex++;
    }

    if (level) {
      whereConditions.push(`level = $${paramIndex}`);
      queryParams.push(level);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      queryParams.push(parseInt(userId));
      paramIndex++;
    }

    if (ip) {
      whereConditions.push(`ip_address = $${paramIndex}`);
      queryParams.push(ip);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(new Date(endDate));
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const searchQuerySQL = `
      SELECT 
        id,
        level,
        message,
        metadata,
        service,
        environment,
        user_id,
        ip_address,
        user_agent,
        created_at
      FROM system_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(Math.min(parseInt(limit), 1000));

    const result = await pool.query(searchQuerySQL, queryParams);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search logs'
    });
  }
};

/**
 * Wyczyść stare logi
 */
const cleanupLogs = async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body;

    const cleanupQuery = `
      DELETE FROM system_logs 
      WHERE created_at < NOW() - INTERVAL '${parseInt(olderThanDays)} days'
    `;

    const result = await pool.query(cleanupQuery);
    const deletedCount = result.rowCount;

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old log entries`,
      data: {
        deletedCount
      }
    });

  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup logs'
    });
  }
};

/**
 * Pobierz szczegóły konkretnego loga
 */
const getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        level,
        message,
        metadata,
        service,
        environment,
        user_id,
        ip_address,
        user_agent,
        created_at,
        expires_at
      FROM system_logs
      WHERE id = $1
    `;

    const result = await pool.query(query, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Log entry not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching log by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log entry'
    });
  }
};

module.exports = {
  getLogs,
  getLogStats,
  searchLogs,
  cleanupLogs,
  getLogById
};
