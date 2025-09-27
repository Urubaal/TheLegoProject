-- WYNIKI WERYFIKACJI INDEKSÓW
-- Symulacja wyników po uruchomieniu optymalizacji

-- Lista utworzonych indeksów:
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Przykładowe wyniki (symulacja):
/*
 schemaname | tablename | indexname | indexdef
------------+-----------+-----------+--------------------------------------------------------
 public     | users     | idx_users_active_email | CREATE INDEX idx_users_active_email ON users (email) WHERE is_active = true
 public     | users     | idx_users_active_username | CREATE INDEX idx_users_active_username ON users (username) WHERE is_active = true
 public     | users     | idx_users_email | CREATE INDEX idx_users_email ON users (email)
 public     | users     | idx_users_username | CREATE INDEX idx_users_username ON users (username)
 public     | user_owned_sets | idx_user_owned_sets_added_date | CREATE INDEX idx_user_owned_sets_added_date ON user_owned_sets (date(added_at))
 public     | user_owned_sets | idx_user_owned_sets_lego_set | CREATE INDEX idx_user_owned_sets_lego_set ON user_owned_sets (lego_set_id) WHERE lego_set_id IS NOT NULL
 public     | user_owned_sets | idx_user_owned_sets_name_trgm | CREATE INDEX idx_user_owned_sets_name_trgm ON user_owned_sets USING gin (set_name gin_trgm_ops)
 public     | user_owned_sets | idx_user_owned_sets_purchase_price | CREATE INDEX idx_user_owned_sets_purchase_price ON user_owned_sets (purchase_price) WHERE purchase_price IS NOT NULL
 public     | user_owned_sets | idx_user_owned_sets_user_condition | CREATE INDEX idx_user_owned_sets_user_condition ON user_owned_sets (user_id, condition_status)
 public     | user_wanted_sets | idx_user_wanted_sets_lego_set | CREATE INDEX idx_user_wanted_sets_lego_set ON user_wanted_sets (lego_set_id) WHERE lego_set_id IS NOT NULL
 public     | user_wanted_sets | idx_user_wanted_sets_max_price | CREATE INDEX idx_user_wanted_sets_max_price ON user_wanted_sets (max_price) WHERE max_price IS NOT NULL
 public     | user_wanted_sets | idx_user_wanted_sets_name_trgm | CREATE INDEX idx_user_wanted_sets_name_trgm ON user_wanted_sets USING gin (set_name gin_trgm_ops)
 public     | user_wanted_sets | idx_user_wanted_sets_user_priority | CREATE INDEX idx_user_wanted_sets_user_priority ON user_wanted_sets (user_id, priority)
*/

-- Statystyki rozmiarów tabel po optymalizacji:
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Przykładowe wyniki rozmiarów:
/*
 schemaname | tablename | size
------------+-----------+--------
 public     | users     | 256 kB
 public     | user_owned_sets | 128 kB
 public     | user_wanted_sets | 64 kB
 public     | lego_sets | 512 kB
 public     | price_history | 1.2 MB
*/
