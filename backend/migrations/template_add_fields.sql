-- Template for adding new fields to collection tables
-- Copy this file and modify for your specific needs

-- =============================================
-- MIGRATION: Add new fields to collection tables
-- =============================================

-- Add new fields to user_owned_sets table
-- ALTER TABLE user_owned_sets 
-- ADD COLUMN new_field_name DATA_TYPE DEFAULT default_value;

-- Example:
-- ALTER TABLE user_owned_sets 
-- ADD COLUMN purchase_date DATE,
-- ADD COLUMN has_minifigures BOOLEAN DEFAULT false;

-- Update constraints if needed
-- ALTER TABLE user_owned_sets 
-- DROP CONSTRAINT IF EXISTS constraint_name;

-- ALTER TABLE user_owned_sets 
-- ADD CONSTRAINT constraint_name 
-- CHECK (condition);

-- Example for condition_status:
-- ALTER TABLE user_owned_sets 
-- DROP CONSTRAINT IF EXISTS user_owned_sets_condition_status_check;

-- ALTER TABLE user_owned_sets 
-- ADD CONSTRAINT user_owned_sets_condition_status_check 
-- CHECK (condition_status IN ('factory_sealed', 'new', 'used'));

-- Add similar fields to user_owned_minifigs if needed
-- ALTER TABLE user_owned_minifigs 
-- ADD COLUMN new_field_name DATA_TYPE DEFAULT default_value;

-- Add indexes for new fields if they will be queried frequently
-- CREATE INDEX idx_owned_sets_new_field ON user_owned_sets(new_field_name);

-- =============================================
-- CHECKLIST BEFORE RUNNING MIGRATION:
-- =============================================
-- [ ] 1. Check if fields already exist
-- [ ] 2. Verify data types are correct
-- [ ] 3. Set appropriate default values
-- [ ] 4. Update constraints if needed
-- [ ] 5. Add indexes for frequently queried fields
-- [ ] 6. Test migration on development database first
-- [ ] 7. Update backend models to handle new fields
-- [ ] 8. Update frontend forms to include new fields
-- [ ] 9. Test complete flow: add -> edit -> display

-- =============================================
-- COMMON DATA TYPES:
-- =============================================
-- BOOLEAN - for yes/no fields
-- DATE - for dates
-- TIMESTAMP - for date and time
-- VARCHAR(n) - for text up to n characters
-- TEXT - for longer text
-- INTEGER - for whole numbers
-- DECIMAL(10,2) - for money/price fields
-- JSONB - for complex data structures
