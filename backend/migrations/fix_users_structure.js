const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting users table structure fix...');
    
    // 1. Remove unique constraint from username
    console.log('📝 Removing unique constraint from username...');
    await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;');
    
    // 2. Add unique constraint to email (if it doesn't exist)
    console.log('📝 Adding unique constraint to email...');
    try {
      await client.query('ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);');
      console.log('   ✅ Email unique constraint added');
    } catch (error) {
      if (error.code === '42P07') {
        console.log('   ℹ️  Email unique constraint already exists');
      } else {
        throw error;
      }
    }
    
    // 3. Add display_name column if it doesn't exist
    console.log('📝 Adding display_name column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);
    `);
    
    // 4. Update display_name for existing users (use username as display_name)
    console.log('📝 Updating display_name for existing users...');
    await client.query(`
      UPDATE users 
      SET display_name = COALESCE(username, first_name, name)
      WHERE display_name IS NULL;
    `);
    
    // 5. Make display_name NOT NULL with default value
    console.log('📝 Making display_name NOT NULL...');
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN display_name SET NOT NULL;
    `);
    
    // 6. Add default value for display_name
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN display_name SET DEFAULT '';
    `);
    
    console.log('✅ Users table structure fixed successfully!');
    console.log('📊 Summary of changes:');
    console.log('   - Removed unique constraint from username');
    console.log('   - Added unique constraint to email');
    console.log('   - Added display_name column');
    console.log('   - Updated existing users with display_name');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
