const winston = require('winston');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Winston transport do zapisywania logów w bazie danych PostgreSQL
 */
class DatabaseTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
    
    this.name = 'database';
    this.level = options.level || 'info';
    this.table = options.table || 'system_logs';
    this.service = options.service || 'lego-backend';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.retentionDays = options.retentionDays || 30;
    
    // Pool połączeń do bazy danych
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://lego_user@localhost:5432/lego_purchase_system',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test połączenia przy inicjalizacji
    this.testConnection();
  }

  /**
   * Test połączenia z bazą danych
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database transport connected successfully');
    } catch (error) {
      console.error('❌ Database transport connection failed:', error.message);
      // Nie rzucaj błędu - pozwól aplikacji działać bez logowania do bazy
    }
  }

  /**
   * Główna metoda logowania
   */
  log(info, callback) {
      global.setImmediate(() => {
        this.emit('logged', info);
      });

    // Zapisz do bazy danych asynchronicznie
    this.saveToDatabase(info)
      .then(() => {
        if (callback) {
      callback(null, true);
    }
      })
      .catch((error) => {
        console.error('Database transport error:', error.message);
        if (callback) {
      callback(error, false);
    }
      });
  }

  /**
   * Zapisz log do bazy danych
   */
  async saveToDatabase(logInfo) {
    const client = await this.pool.connect();
    
    try {
      const {
        level,
        message,
        timestamp,
        userId,
        ip,
        userAgent,
        ...metadata
      } = this.parseLogInfo(logInfo);

      const query = `
        INSERT INTO ${this.table} (
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const values = [
        level,
        message,
        JSON.stringify(metadata),
        this.service,
        this.environment,
        userId || null,
        ip || null,
        userAgent || null,
        timestamp || new Date(),
        new Date(Date.now() + this.retentionDays * 24 * 60 * 60 * 1000)
      ];

      await client.query(query, values);
      
    } catch (error) {
      // Jeśli błąd bazy danych, zapisz do konsoli jako fallback
      console.error('Failed to save log to database:', error.message);
      console.log('Original log:', logInfo);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Parsuj informacje z loga
   */
  parseLogInfo(logInfo) {
    const {
      level,
      message,
      timestamp,
      userId,
      ip,
      userAgent,
      ...rest
    } = logInfo;

    // Wyciągnij userId z różnych możliwych źródeł
    const extractedUserId = userId || 
                           logInfo.userId || 
                           logInfo.user_id || 
                           (logInfo.meta && logInfo.meta.userId) ||
                           null;

    // Wyciągnij IP z różnych możliwych źródeł
    const extractedIp = ip || 
                       logInfo.ip || 
                       logInfo.ip_address || 
                       (logInfo.meta && logInfo.meta.ip) ||
                       null;

    // Wyciągnij User-Agent
    const extractedUserAgent = userAgent || 
                              logInfo.userAgent || 
                              logInfo.user_agent || 
                              (logInfo.meta && logInfo.meta.userAgent) ||
                              null;

    return {
      level,
      message,
      timestamp,
      userId: extractedUserId,
      ip: extractedIp,
      userAgent: extractedUserAgent,
      ...rest
    };
  }

  /**
   * Zamknij połączenie z bazą danych
   */
  close() {
    return this.pool.end();
  }

  /**
   * Sprawdź czy transport jest dostępny
   */
  async isAvailable() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Pobierz statystyki logów
   */
  async getStats() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          level,
          COUNT(*) as count,
          MIN(created_at) as oldest,
          MAX(created_at) as newest
        FROM ${this.table}
        WHERE service = $1 AND environment = $2
        GROUP BY level
        ORDER BY level
      `;
      
      const result = await client.query(query, [this.service, this.environment]);
      return result.rows;
      
    } catch (error) {
      console.error('Failed to get log stats:', error.message);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Wyczyść stare logi
   */
  async cleanup() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        DELETE FROM ${this.table} 
        WHERE expires_at < NOW()
      `;
      
      const result = await client.query(query);
      return result.rowCount;
      
    } catch (error) {
      console.error('Failed to cleanup logs:', error.message);
      return 0;
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseTransport;
