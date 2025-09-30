const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  password: process.env.POSTGRES_PASSWORD
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting sessions table migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'create_sessions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Run migration
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Sessions table created successfully!');
    console.log('📊 Migration details:');
    console.log('   - Table: user_sessions');
    console.log('   - Indexes: 4 created for performance');
    console.log('   - Triggers: Auto-cleanup function created');
    console.log('   - Security: httpOnly cookie-ready');
    
    // Verify table was created
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'user_sessions'
    `);
    
    if (result.rows[0].count === '1') {
      console.log('✅ Verification: user_sessions table exists');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().then(() => {
  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Migration error:', err);
  process.exit(1);
});
