#!/usr/bin/env node

/**
 * Skrypt do migracji istniejących plików logów do bazy danych
 * 
 * Użycie:
 * node migrate-logs-to-database.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://lego_user@localhost:5432/lego_purchase_system'
});

/**
 * Parsuj linię loga z pliku
 */
function parseLogLine(line) {
  try {
    // Próbuj sparsować jako JSON (strukturalne logi)
    const logData = JSON.parse(line);
    return {
      level: logData.level || 'info',
      message: logData.message || line,
      metadata: logData.meta || logData.metadata || {},
      timestamp: logData.timestamp ? new Date(logData.timestamp) : new Date(),
      userId: logData.userId || logData.user_id || null,
      ip: logData.ip || logData.ip_address || null,
      userAgent: logData.userAgent || logData.user_agent || null
    };
  } catch (error) {
    // Jeśli nie JSON, spróbuj sparsować jako zwykły tekst
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    const levelMatch = line.match(/\[(\w+)\]/);
    
    return {
      level: levelMatch ? levelMatch[1].toLowerCase() : 'info',
      message: line,
      metadata: {},
      timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(),
      userId: null,
      ip: null,
      userAgent: null
    };
  }
}

/**
 * Migruj plik logów do bazy danych
 */
async function migrateLogFile(filePath, service = 'lego-backend', environment = 'development') {
  console.log(`📁 Migrating file: ${path.basename(filePath)}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const line of lines) {
      try {
        const logData = parseLogLine(line);
        
        const query = `
          INSERT INTO system_logs (
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
          logData.level,
          logData.message,
          JSON.stringify(logData.metadata),
          service,
          environment,
          logData.userId,
          logData.ip,
          logData.userAgent,
          logData.timestamp,
          new Date(logData.timestamp.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dni
        ];
        
        await pool.query(query, values);
        successCount++;
        
      } catch (lineError) {
        console.error(`  ❌ Error parsing line: ${line.substring(0, 100)}...`);
        errorCount++;
      }
    }
    
    console.log(`  ✅ Migrated: ${successCount} logs, Errors: ${errorCount}`);
    return { successCount, errorCount };
    
  } catch (error) {
    console.error(`  ❌ Error reading file ${filePath}:`, error.message);
    return { successCount: 0, errorCount: 1 };
  }
}

/**
 * Główna funkcja migracji
 */
async function migrateLogs() {
  console.log('🔄 Starting logs migration to database...\n');
  
  const logsDir = path.join(__dirname, 'logs');
  
  if (!fs.existsSync(logsDir)) {
    console.log('❌ Logs directory does not exist');
    return;
  }
  
  // Sprawdź połączenie z bazą danych
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  // Sprawdź czy tabela system_logs istnieje
  try {
    const client = await pool.connect();
    await client.query('SELECT 1 FROM system_logs LIMIT 1');
    client.release();
    console.log('✅ system_logs table exists');
  } catch (error) {
    console.error('❌ system_logs table does not exist. Please run migration first.');
    return;
  }
  
  // Znajdź wszystkie pliki logów
  const files = fs.readdirSync(logsDir)
    .filter(file => file.endsWith('.log'))
    .map(file => path.join(logsDir, file));
  
  if (files.length === 0) {
    console.log('ℹ️  No log files found to migrate');
    return;
  }
  
  console.log(`📁 Found ${files.length} log files to migrate\n`);
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  // Migruj każdy plik
  for (const filePath of files) {
    const result = await migrateLogFile(filePath);
    totalSuccess += result.successCount;
    totalErrors += result.errorCount;
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Successfully migrated: ${totalSuccess} log entries`);
  console.log(`  ❌ Errors: ${totalErrors} log entries`);
  console.log(`  📁 Files processed: ${files.length}`);
  
  if (totalSuccess > 0) {
    console.log('\n💡 Migration completed! You can now:');
    console.log('  1. View logs via API: GET /api/logs');
    console.log('  2. Get statistics: GET /api/logs/stats');
    console.log('  3. Search logs: POST /api/logs/search');
    console.log('  4. Clean up old files: rm -rf logs/*.log');
  }
}

/**
 * Wyczyść stare pliki logów po migracji
 */
async function cleanupOldLogFiles() {
  console.log('\n🧹 Cleaning up old log files...');
  
  const logsDir = path.join(__dirname, 'logs');
  
  if (!fs.existsSync(logsDir)) {
    console.log('❌ Logs directory does not exist');
    return;
  }
  
  const files = fs.readdirSync(logsDir)
    .filter(file => file.endsWith('.log'));
  
  if (files.length === 0) {
    console.log('ℹ️  No log files to clean up');
    return;
  }
  
  let deletedCount = 0;
  
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(logsDir, file));
      console.log(`  🗑️  Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`  ❌ Error deleting ${file}:`, error.message);
    }
  }
  
  console.log(`✅ Cleaned up ${deletedCount} log files`);
}

// Uruchom migrację jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'cleanup') {
    cleanupOldLogFiles()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    migrateLogs()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = {
  migrateLogs,
  cleanupOldLogFiles
};
