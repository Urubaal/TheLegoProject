const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://lego_user@localhost:5432/lego_purchase_system'
});

async function createSystemLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating system_logs table...');
    
    // Utwórz tabelę system_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        level VARCHAR(10) NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
        message TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        service VARCHAR(50) DEFAULT 'lego-backend',
        environment VARCHAR(20) DEFAULT 'development',
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
      )
    `);
    
    console.log('✅ system_logs table created');
    
    // Utwórz indeksy dla wydajności
    console.log('🔄 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_logs_level 
      ON system_logs(level)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_logs_created_at 
      ON system_logs(created_at)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_logs_user_id 
      ON system_logs(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_logs_expires_at 
      ON system_logs(expires_at)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_logs_service_env 
      ON system_logs(service, environment)
    `);
    
    // Indeks dla wyszukiwania w metadata (JSONB)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_system_logs_metadata_gin 
      ON system_logs USING GIN (metadata)
    `);
    
    console.log('✅ Indexes created');
    
    // Utwórz funkcję do automatycznego czyszczenia starych logów
    console.log('🔄 Creating cleanup function...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_logs()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM system_logs 
        WHERE expires_at < NOW();
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    console.log('✅ Cleanup function created');
    
    // Utwórz zadanie cron do automatycznego czyszczenia (jeśli dostępne)
    try {
      await client.query(`
        SELECT cron.schedule(
          'cleanup-system-logs',
          '0 2 * * *',  -- Codziennie o 2:00
          'SELECT cleanup_expired_logs();'
        );
      `);
      console.log('✅ Cron job scheduled');
    } catch (cronError) {
      console.log('⚠️  Cron extension not available - manual cleanup required');
    }
    
    console.log('🎉 System logs table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating system_logs table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function rollbackSystemLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back system_logs table...');
    
    // Usuń zadanie cron
    try {
      await client.query('SELECT cron.unschedule(\'cleanup-system-logs\');');
    } catch (cronError) {
      // Ignoruj błąd jeśli zadanie nie istnieje
    }
    
    // Usuń funkcję
    await client.query('DROP FUNCTION IF EXISTS cleanup_expired_logs();');
    
    // Usuń tabelę
    await client.query('DROP TABLE IF EXISTS system_logs CASCADE;');
    
    console.log('✅ Rollback completed');
    
  } catch (error) {
    console.error('❌ Error during rollback:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Uruchom migrację jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'rollback') {
    rollbackSystemLogsTable()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    createSystemLogsTable()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  createSystemLogsTable,
  rollbackSystemLogsTable
};
