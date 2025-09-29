const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
  password: process.env.POSTGRES_PASSWORD || 'lego_password'
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_lego_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Check if data was inserted
    const setsResult = await pool.query('SELECT COUNT(*) FROM lego_sets');
    const offersResult = await pool.query('SELECT COUNT(*) FROM olx_offers');
    
    console.log(`Sets in database: ${setsResult.rows[0].count}`);
    console.log(`Offers in database: ${offersResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
