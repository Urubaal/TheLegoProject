-- Performance Optimization: Add Missing Indexes
-- This migration adds critical indexes for better query performance

-- =============================================
-- ADDITIONAL INDEXES FOR USER COLLECTIONS
-- =============================================

-- User owned sets - additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_owned_sets_user_condition ON user_owned_sets(user_id, condition_status);
CREATE INDEX IF NOT EXISTS idx_user_owned_sets_purchase_price ON user_owned_sets(purchase_price) WHERE purchase_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_owned_sets_added_date ON user_owned_sets(DATE(added_at));

-- User wanted sets - additional indexes for priority and price queries
CREATE INDEX IF NOT EXISTS idx_user_wanted_sets_user_priority ON user_wanted_sets(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_user_wanted_sets_max_price ON user_wanted_sets(max_price) WHERE max_price IS NOT NULL;

-- User owned minifigs - additional indexes
CREATE INDEX IF NOT EXISTS idx_user_owned_minifigs_user_condition ON user_owned_minifigs(user_id, condition_status);
CREATE INDEX IF NOT EXISTS idx_user_owned_minifigs_purchase_price ON user_owned_minifigs(purchase_price) WHERE purchase_price IS NOT NULL;

-- User wanted minifigs - additional indexes
CREATE INDEX IF NOT EXISTS idx_user_wanted_minifigs_user_priority ON user_wanted_minifigs(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_user_wanted_minifigs_max_price ON user_wanted_minifigs(max_price) WHERE max_price IS NOT NULL;

-- =============================================
-- COMPOSITE INDEXES FOR COMMON JOIN QUERIES
-- =============================================

-- For joins between user collections and lego_sets
CREATE INDEX IF NOT EXISTS idx_user_owned_sets_lego_set ON user_owned_sets(lego_set_id) WHERE lego_set_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_wanted_sets_lego_set ON user_wanted_sets(lego_set_id) WHERE lego_set_id IS NOT NULL;

-- =============================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- =============================================

-- Only index active users for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_active_username ON users(username) WHERE is_active = true;

-- Only index available sets for faster catalog queries
CREATE INDEX IF NOT EXISTS idx_lego_sets_available ON lego_sets(set_number, name) WHERE availability_status = 'available';

-- =============================================
-- FULL-TEXT SEARCH INDEXES
-- =============================================

-- For searching LEGO sets by name and description
CREATE INDEX IF NOT EXISTS idx_lego_sets_name_trgm ON lego_sets USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lego_sets_description_trgm ON lego_sets USING GIN(description gin_trgm_ops) WHERE description IS NOT NULL;

-- For searching user collections
CREATE INDEX IF NOT EXISTS idx_user_owned_sets_name_trgm ON user_owned_sets USING GIN(set_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_wanted_sets_name_trgm ON user_wanted_sets USING GIN(set_name gin_trgm_ops);

-- =============================================
-- STATISTICS AND ANALYZE
-- =============================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE user_owned_sets;
ANALYZE user_wanted_sets;
ANALYZE user_owned_minifigs;
ANALYZE user_wanted_minifigs;
ANALYZE lego_sets;

-- =============================================
-- INDEX USAGE MONITORING
-- =============================================

-- Create a view to monitor index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 THEN (idx_tup_fetch::float / idx_tup_read::float * 100)::numeric(5,2)
        ELSE 0
    END as efficiency_percentage
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- =============================================
-- PERFORMANCE OPTIMIZATION COMMENTS
-- =============================================

COMMENT ON INDEX idx_user_owned_sets_user_condition IS 'Optimizes queries filtering owned sets by user and condition';
COMMENT ON INDEX idx_user_wanted_sets_user_priority IS 'Optimizes queries sorting wanted sets by priority';
COMMENT ON INDEX idx_users_active_email IS 'Partial index for faster login queries on active users only';
COMMENT ON INDEX idx_lego_sets_name_trgm IS 'Full-text search index for LEGO set names';
COMMENT ON VIEW index_usage_stats IS 'Monitor index usage efficiency for performance tuning';
