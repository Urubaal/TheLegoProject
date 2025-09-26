const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'lego_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'lego_purchase_system',
  port: process.env.POSTGRES_PORT || 5432,
});

async function migrateUsers() {
  try {
    console.log('Starting user migration...');
    console.log('Database config:', {
      user: process.env.POSTGRES_USER || 'lego_user',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'lego_purchase_system',
      password: 'none (trust auth)',
      port: process.env.POSTGRES_PORT || 5432,
    });
    
    // Add new columns to users table if they don't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100)
    `);
    
    console.log('Added new columns to users table');
    
    // Update existing users to have name field populated
    await pool.query(`
      UPDATE users 
      SET name = COALESCE(first_name, username)
      WHERE name IS NULL
    `);
    
    console.log('Updated existing users with name field');
    
    // Create new collection tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_owned_sets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lego_set_id UUID REFERENCES lego_sets(id) ON DELETE SET NULL,
        set_number VARCHAR(20) NOT NULL,
        set_name VARCHAR(255) NOT NULL,
        condition_status VARCHAR(20) DEFAULT 'new' CHECK (condition_status IN ('new', 'used')),
        purchase_price DECIMAL(10,2),
        purchase_currency VARCHAR(3) DEFAULT 'PLN',
        current_value DECIMAL(10,2),
        current_currency VARCHAR(3) DEFAULT 'PLN',
        value_updated_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, set_number)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_wanted_sets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lego_set_id UUID REFERENCES lego_sets(id) ON DELETE SET NULL,
        set_number VARCHAR(20) NOT NULL,
        set_name VARCHAR(255) NOT NULL,
        max_price DECIMAL(10,2),
        max_currency VARCHAR(3) DEFAULT 'PLN',
        priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
        notes TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, set_number)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_owned_minifigs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        minifig_name VARCHAR(255) NOT NULL,
        minifig_number VARCHAR(20),
        condition_status VARCHAR(20) DEFAULT 'new' CHECK (condition_status IN ('new', 'used')),
        purchase_price DECIMAL(10,2),
        purchase_currency VARCHAR(3) DEFAULT 'PLN',
        current_value DECIMAL(10,2),
        current_currency VARCHAR(3) DEFAULT 'PLN',
        value_updated_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, minifig_name, minifig_number)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_wanted_minifigs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        minifig_name VARCHAR(255) NOT NULL,
        minifig_number VARCHAR(20),
        max_price DECIMAL(10,2),
        max_currency VARCHAR(3) DEFAULT 'PLN',
        priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
        notes TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, minifig_name, minifig_number)
      )
    `);
    
    console.log('Created collection tables');
    
    // Add indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_owned_sets_user ON user_owned_sets(user_id);
      CREATE INDEX IF NOT EXISTS idx_owned_sets_set_number ON user_owned_sets(set_number);
      CREATE INDEX IF NOT EXISTS idx_owned_sets_condition ON user_owned_sets(condition_status);
      CREATE INDEX IF NOT EXISTS idx_owned_sets_added_at ON user_owned_sets(added_at);
      
      CREATE INDEX IF NOT EXISTS idx_wanted_sets_user ON user_wanted_sets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wanted_sets_set_number ON user_wanted_sets(set_number);
      CREATE INDEX IF NOT EXISTS idx_wanted_sets_priority ON user_wanted_sets(priority);
      CREATE INDEX IF NOT EXISTS idx_wanted_sets_added_at ON user_wanted_sets(added_at);
      
      CREATE INDEX IF NOT EXISTS idx_owned_minifigs_user ON user_owned_minifigs(user_id);
      CREATE INDEX IF NOT EXISTS idx_owned_minifigs_name ON user_owned_minifigs(minifig_name);
      CREATE INDEX IF NOT EXISTS idx_owned_minifigs_number ON user_owned_minifigs(minifig_number);
      CREATE INDEX IF NOT EXISTS idx_owned_minifigs_condition ON user_owned_minifigs(condition_status);
      
      CREATE INDEX IF NOT EXISTS idx_wanted_minifigs_user ON user_wanted_minifigs(user_id);
      CREATE INDEX IF NOT EXISTS idx_wanted_minifigs_name ON user_wanted_minifigs(minifig_name);
      CREATE INDEX IF NOT EXISTS idx_wanted_minifigs_number ON user_wanted_minifigs(minifig_number);
      CREATE INDEX IF NOT EXISTS idx_wanted_minifigs_priority ON user_wanted_minifigs(priority);
    `);
    
    console.log('Added indexes for collection tables');
    
    // Add triggers for updated_at
    try {
      await pool.query(`
        CREATE TRIGGER update_owned_sets_updated_at 
        BEFORE UPDATE ON user_owned_sets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {throw error;}
    }
    
    try {
      await pool.query(`
        CREATE TRIGGER update_wanted_sets_updated_at 
        BEFORE UPDATE ON user_wanted_sets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {throw error;}
    }
    
    try {
      await pool.query(`
        CREATE TRIGGER update_owned_minifigs_updated_at 
        BEFORE UPDATE ON user_owned_minifigs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {throw error;}
    }
    
    try {
      await pool.query(`
        CREATE TRIGGER update_wanted_minifigs_updated_at 
        BEFORE UPDATE ON user_wanted_minifigs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } catch (error) {
      if (!error.message.includes('already exists')) {throw error;}
    }
    
    console.log('Added triggers for collection tables');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsers };
