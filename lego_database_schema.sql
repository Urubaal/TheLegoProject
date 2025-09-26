-- LEGO Purchase Suggestion System Database Schema
-- PostgreSQL Database for AI-powered LEGO set recommendations
-- Compatible with TablePlus for data exploration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) NOT NULL, -- Not unique - multiple users can have same username
    email VARCHAR(255) UNIQUE NOT NULL, -- Unique - one email per user
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) NOT NULL, -- Display name for profile (defaults to username)
    country VARCHAR(50), -- User's country
    preferences JSONB DEFAULT '{}',
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    preferred_currency VARCHAR(3) DEFAULT 'PLN',
    notification_settings JSONB DEFAULT '{"email": true, "push": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- 2. LEGO SETS CATALOG
-- =============================================
CREATE TABLE lego_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(100),
    subtheme VARCHAR(100),
    year_released INTEGER,
    pieces INTEGER,
    minifigures INTEGER,
    age_range VARCHAR(20),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    dimensions JSONB, -- {"length": 30, "width": 20, "height": 15}
    weight_grams INTEGER,
    retail_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'PLN',
    availability_status VARCHAR(20) DEFAULT 'available', -- available, discontinued, limited
    tags TEXT[], -- Array of tags for better search
    images JSONB, -- URLs to product images
    metadata JSONB DEFAULT '{}', -- Additional flexible data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. STORES/SHOPPING SOURCES
-- =============================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    website_url VARCHAR(255),
    country VARCHAR(2), -- ISO country code
    currency VARCHAR(3),
    shipping_info JSONB, -- Shipping costs, free shipping threshold
    scraper_config JSONB, -- Configuration for web scraping
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. PRICE HISTORY
-- =============================================
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lego_set_id UUID NOT NULL REFERENCES lego_sets(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (price + shipping_cost) STORED,
    availability BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    discount_percentage DECIMAL(5,2),
    original_price DECIMAL(10,2),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- 5. USER WISHLISTS
-- =============================================
CREATE TABLE user_wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lego_set_id UUID NOT NULL REFERENCES lego_sets(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1 = highest priority
    max_price DECIMAL(10,2),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lego_set_id)
);

-- =============================================
-- 6. AI RECOMMENDATIONS
-- =============================================
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lego_set_id UUID NOT NULL REFERENCES lego_sets(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- buy_now, wait, avoid, alternative
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    reasoning TEXT,
    price_analysis JSONB, -- Price trends, comparisons
    alternative_sets UUID[], -- Array of alternative set IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- 7. SCRAPER LOGS
-- =============================================
CREATE TABLE scraper_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- success, error, partial
    items_scraped INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    execution_time_seconds INTEGER,
    error_details TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 8. USER SESSIONS (for AI context)
-- =============================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. USER COLLECTION - OWNED SETS
-- =============================================
CREATE TABLE user_owned_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lego_set_id UUID REFERENCES lego_sets(id) ON DELETE SET NULL,
    set_number VARCHAR(20) NOT NULL, -- Store set number even if set is deleted
    set_name VARCHAR(255) NOT NULL,
    condition_status VARCHAR(20) DEFAULT 'new' CHECK (condition_status IN ('new', 'used')),
    purchase_price DECIMAL(10,2),
    purchase_currency VARCHAR(3) DEFAULT 'PLN',
    current_value DECIMAL(10,2), -- Current market value
    current_currency VARCHAR(3) DEFAULT 'PLN',
    value_updated_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, set_number)
);

-- =============================================
-- 10. USER COLLECTION - WANTED SETS
-- =============================================
CREATE TABLE user_wanted_sets (
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
);

-- =============================================
-- 11. USER COLLECTION - OWNED MINIFIGS
-- =============================================
CREATE TABLE user_owned_minifigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    minifig_name VARCHAR(255) NOT NULL,
    minifig_number VARCHAR(20), -- If available
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
);

-- =============================================
-- 12. USER COLLECTION - WANTED MINIFIGS
-- =============================================
CREATE TABLE user_wanted_minifigs (
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
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_users_active ON users(is_active);

-- LEGO sets indexes
CREATE INDEX idx_lego_sets_number ON lego_sets(set_number);
CREATE INDEX idx_lego_sets_theme ON lego_sets(theme);
CREATE INDEX idx_lego_sets_year ON lego_sets(year_released);
CREATE INDEX idx_lego_sets_pieces ON lego_sets(pieces);
CREATE INDEX idx_lego_sets_tags ON lego_sets USING GIN(tags);
CREATE INDEX idx_lego_sets_metadata ON lego_sets USING GIN(metadata);

-- Price history indexes
CREATE INDEX idx_price_history_set_store ON price_history(lego_set_id, store_id);
CREATE INDEX idx_price_history_scraped_at ON price_history(scraped_at);
CREATE INDEX idx_price_history_price ON price_history(price);
CREATE INDEX idx_price_history_availability ON price_history(availability);

-- Wishlist indexes
CREATE INDEX idx_wishlists_user ON user_wishlists(user_id);
CREATE INDEX idx_wishlists_priority ON user_wishlists(priority);
CREATE INDEX idx_wishlists_added_at ON user_wishlists(added_at);

-- AI recommendations indexes
CREATE INDEX idx_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX idx_recommendations_confidence ON ai_recommendations(confidence_score);
CREATE INDEX idx_recommendations_active ON ai_recommendations(is_active);

-- Scraper logs indexes
CREATE INDEX idx_scraper_logs_store ON scraper_logs(store_id);
CREATE INDEX idx_scraper_logs_status ON scraper_logs(status);
CREATE INDEX idx_scraper_logs_started_at ON scraper_logs(started_at);

-- User collection indexes
CREATE INDEX idx_owned_sets_user ON user_owned_sets(user_id);
CREATE INDEX idx_owned_sets_set_number ON user_owned_sets(set_number);
CREATE INDEX idx_owned_sets_condition ON user_owned_sets(condition_status);
CREATE INDEX idx_owned_sets_added_at ON user_owned_sets(added_at);

CREATE INDEX idx_wanted_sets_user ON user_wanted_sets(user_id);
CREATE INDEX idx_wanted_sets_set_number ON user_wanted_sets(set_number);
CREATE INDEX idx_wanted_sets_priority ON user_wanted_sets(priority);
CREATE INDEX idx_wanted_sets_added_at ON user_wanted_sets(added_at);

CREATE INDEX idx_owned_minifigs_user ON user_owned_minifigs(user_id);
CREATE INDEX idx_owned_minifigs_name ON user_owned_minifigs(minifig_name);
CREATE INDEX idx_owned_minifigs_number ON user_owned_minifigs(minifig_number);
CREATE INDEX idx_owned_minifigs_condition ON user_owned_minifigs(condition_status);

CREATE INDEX idx_wanted_minifigs_user ON user_wanted_minifigs(user_id);
CREATE INDEX idx_wanted_minifigs_name ON user_wanted_minifigs(minifig_name);
CREATE INDEX idx_wanted_minifigs_number ON user_wanted_minifigs(minifig_number);
CREATE INDEX idx_wanted_minifigs_priority ON user_wanted_minifigs(priority);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lego_sets_updated_at BEFORE UPDATE ON lego_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owned_sets_updated_at BEFORE UPDATE ON user_owned_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wanted_sets_updated_at BEFORE UPDATE ON user_wanted_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owned_minifigs_updated_at BEFORE UPDATE ON user_owned_minifigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wanted_minifigs_updated_at BEFORE UPDATE ON user_wanted_minifigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample stores
INSERT INTO stores (name, website_url, country, currency, shipping_info, scraper_config) VALUES
('LEGO Store', 'https://www.lego.com', 'PL', 'PLN', '{"free_shipping_threshold": 200, "standard_shipping": 15}', '{"base_url": "https://www.lego.com", "selectors": {"price": ".price", "availability": ".availability"}}'),
('Ceneo', 'https://www.ceneo.pl', 'PL', 'PLN', '{"free_shipping_threshold": 100, "standard_shipping": 10}', '{"base_url": "https://www.ceneo.pl", "selectors": {"price": ".price", "availability": ".stock"}}'),
('Allegro', 'https://www.allegro.pl', 'PL', 'PLN', '{"free_shipping_threshold": 50, "standard_shipping": 8}', '{"base_url": "https://www.allegro.pl", "selectors": {"price": ".price", "availability": ".availability"}}');

-- Insert sample LEGO sets
INSERT INTO lego_sets (set_number, name, description, theme, subtheme, year_released, pieces, minifigures, age_range, difficulty_level, dimensions, weight_grams, retail_price, tags) VALUES
('75309', 'Republic Gunship', 'Star Wars Republic Gunship with minifigures', 'Star Wars', 'Clone Wars', 2021, 3292, 4, '9+', 4, '{"length": 60, "width": 30, "height": 20}', 2500, 399.99, ARRAY['Star Wars', 'Clone Wars', 'Republic', 'Gunship']),
('10294', 'Titanic', 'LEGO Creator Expert Titanic', 'Creator Expert', 'Architecture', 2021, 9090, 0, '18+', 5, '{"length": 135, "width": 15, "height": 45}', 5000, 699.99, ARRAY['Creator Expert', 'Titanic', 'Architecture', 'Historical']),
('71741', 'Ninjago City Gardens', 'Ninjago City Gardens with minifigures', 'Ninjago', 'City', 2021, 5685, 19, '14+', 4, '{"length": 50, "width": 40, "height": 30}', 3000, 299.99, ARRAY['Ninjago', 'City', 'Gardens', 'Minifigures']),
('21325', 'Medieval Blacksmith', 'Creator Expert Medieval Blacksmith', 'Creator Expert', 'Medieval', 2021, 2164, 4, '18+', 4, '{"length": 30, "width": 25, "height": 35}', 1500, 149.99, ARRAY['Creator Expert', 'Medieval', 'Blacksmith', 'Architecture']),
('75313', 'AT-AT', 'Star Wars AT-AT Walker', 'Star Wars', 'Original Trilogy', 2020, 1267, 4, '9+', 3, '{"length": 40, "width": 20, "height": 50}', 2000, 159.99, ARRAY['Star Wars', 'AT-AT', 'Walker', 'Empire']);

-- Insert sample users
INSERT INTO users (username, email, password_hash, display_name, country, preferences, budget_min, budget_max, preferred_currency) VALUES
('lego_fan_2024', 'jan.kowalski@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzQz2', 'Jan Kowalski', 'Polska', '{"themes": ["Star Wars", "Creator Expert"], "max_pieces": 5000, "prefer_minifigures": true}', 100.00, 500.00, 'PLN'),
('ninjago_lover', 'anna.nowak@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzQz2', 'Anna Nowak', 'Polska', '{"themes": ["Ninjago", "City"], "max_pieces": 3000, "prefer_minifigures": true}', 50.00, 300.00, 'PLN'),
('collector_pro', 'piotr.wisniewski@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzQz2', 'Piotr Wiśniewski', 'Polska', '{"themes": ["Creator Expert", "Architecture"], "max_pieces": 10000, "prefer_minifigures": false}', 200.00, 1000.00, 'PLN');

-- Insert sample wishlists
INSERT INTO user_wishlists (user_id, lego_set_id, priority, max_price, notes) VALUES
((SELECT id FROM users WHERE username = 'lego_fan_2024'), (SELECT id FROM lego_sets WHERE set_number = '75309'), 1, 350.00, 'Must have for my Star Wars collection'),
((SELECT id FROM users WHERE username = 'lego_fan_2024'), (SELECT id FROM lego_sets WHERE set_number = '75313'), 2, 150.00, 'Good price for AT-AT'),
((SELECT id FROM users WHERE username = 'ninjago_lover'), (SELECT id FROM lego_sets WHERE set_number = '71741'), 1, 250.00, 'Perfect for my Ninjago city'),
((SELECT id FROM users WHERE username = 'collector_pro'), (SELECT id FROM lego_sets WHERE set_number = '10294'), 1, 600.00, 'Titanic is a masterpiece'),
((SELECT id FROM users WHERE username = 'collector_pro'), (SELECT id FROM lego_sets WHERE set_number = '21325'), 2, 120.00, 'Medieval theme is interesting');

-- Insert sample price history
INSERT INTO price_history (lego_set_id, store_id, price, currency, shipping_cost, availability, stock_quantity, discount_percentage, original_price) VALUES
((SELECT id FROM lego_sets WHERE set_number = '75309'), (SELECT id FROM stores WHERE name = 'LEGO Store'), 399.99, 'PLN', 0.00, true, 5, 0.00, 399.99),
((SELECT id FROM lego_sets WHERE set_number = '75309'), (SELECT id FROM stores WHERE name = 'Ceneo'), 375.00, 'PLN', 15.00, true, 3, 6.25, 399.99),
((SELECT id FROM lego_sets WHERE set_number = '75309'), (SELECT id FROM stores WHERE name = 'Allegro'), 365.00, 'PLN', 8.00, true, 2, 8.75, 399.99),
((SELECT id FROM lego_sets WHERE set_number = '10294'), (SELECT id FROM stores WHERE name = 'LEGO Store'), 699.99, 'PLN', 0.00, true, 2, 0.00, 699.99),
((SELECT id FROM lego_sets WHERE set_number = '10294'), (SELECT id FROM stores WHERE name = 'Ceneo'), 650.00, 'PLN', 15.00, true, 1, 7.14, 699.99),
((SELECT id FROM lego_sets WHERE set_number = '71741'), (SELECT id FROM stores WHERE name = 'LEGO Store'), 299.99, 'PLN', 0.00, true, 8, 0.00, 299.99),
((SELECT id FROM lego_sets WHERE set_number = '71741'), (SELECT id FROM stores WHERE name = 'Allegro'), 275.00, 'PLN', 8.00, true, 4, 8.33, 299.99);

-- Insert sample AI recommendations
INSERT INTO ai_recommendations (user_id, lego_set_id, recommendation_type, confidence_score, reasoning, price_analysis, alternative_sets) VALUES
((SELECT id FROM users WHERE username = 'lego_fan_2024'), (SELECT id FROM lego_sets WHERE set_number = '75309'), 'buy_now', 0.85, 'Price is below your budget and availability is good', '{"current_price": 365.00, "price_trend": "stable", "best_deal": "Allegro"}', ARRAY[]::UUID[]),
((SELECT id FROM users WHERE username = 'ninjago_lover'), (SELECT id FROM lego_sets WHERE set_number = '71741'), 'buy_now', 0.90, 'Perfect match for your preferences and great price', '{"current_price": 275.00, "price_trend": "decreasing", "best_deal": "Allegro"}', ARRAY[]::UUID[]),
((SELECT id FROM users WHERE username = 'collector_pro'), (SELECT id FROM lego_sets WHERE set_number = '10294'), 'wait', 0.70, 'Price might drop further, monitor for better deals', '{"current_price": 650.00, "price_trend": "decreasing", "best_deal": "Ceneo"}', ARRAY[]::UUID[]);

-- =============================================
-- USEFUL VIEWS FOR TABLEPLUS EXPLORATION
-- =============================================

-- View: Current best prices for each set
CREATE VIEW current_best_prices AS
SELECT 
    ls.set_number,
    ls.name,
    s.name as store_name,
    ph.price,
    ph.shipping_cost,
    ph.total_price,
    ph.availability,
    ph.stock_quantity,
    ph.discount_percentage,
    ph.scraped_at
FROM lego_sets ls
JOIN price_history ph ON ls.id = ph.lego_set_id
JOIN stores s ON ph.store_id = s.id
WHERE ph.availability = true
AND ph.scraped_at = (
    SELECT MAX(scraped_at) 
    FROM price_history ph2 
    WHERE ph2.lego_set_id = ph.lego_set_id 
    AND ph2.store_id = ph.store_id
)
ORDER BY ls.set_number, ph.total_price;

-- View: User wishlist with current prices
CREATE VIEW user_wishlist_prices AS
SELECT 
    u.username,
    ls.set_number,
    ls.name,
    uw.priority,
    uw.max_price,
    cbp.store_name,
    cbp.price,
    cbp.total_price,
    cbp.availability,
    CASE 
        WHEN cbp.total_price <= uw.max_price THEN 'Within Budget'
        ELSE 'Over Budget'
    END as budget_status
FROM users u
JOIN user_wishlists uw ON u.id = uw.user_id
JOIN lego_sets ls ON uw.lego_set_id = ls.id
LEFT JOIN current_best_prices cbp ON ls.set_number = cbp.set_number
ORDER BY u.username, uw.priority, cbp.total_price;

-- View: AI recommendations summary
CREATE VIEW ai_recommendations_summary AS
SELECT 
    u.username,
    ls.set_number,
    ls.name,
    ar.recommendation_type,
    ar.confidence_score,
    ar.reasoning,
    cbp.total_price,
    cbp.store_name
FROM users u
JOIN ai_recommendations ar ON u.id = ar.user_id
JOIN lego_sets ls ON ar.lego_set_id = ls.id
LEFT JOIN current_best_prices cbp ON ls.set_number = cbp.set_number
WHERE ar.is_active = true
ORDER BY u.username, ar.confidence_score DESC;

-- =============================================
-- SAMPLE QUERIES FOR TABLEPLUS
-- =============================================

-- Query 1: Find all sets within user budget
-- SELECT * FROM user_wishlist_prices WHERE budget_status = 'Within Budget';

-- Query 2: Get price trends for specific set
-- SELECT set_number, store_name, price, scraped_at 
-- FROM price_history ph 
-- JOIN lego_sets ls ON ph.lego_set_id = ls.id 
-- JOIN stores s ON ph.store_id = s.id 
-- WHERE ls.set_number = '75309' 
-- ORDER BY scraped_at DESC;

-- Query 3: Find alternative sets for recommendations
-- SELECT ls2.set_number, ls2.name, ls2.theme, ls2.pieces
-- FROM lego_sets ls1
-- JOIN lego_sets ls2 ON ls1.theme = ls2.theme
-- WHERE ls1.set_number = '75309' AND ls2.set_number != '75309'
-- ORDER BY ls2.pieces;

-- =============================================
-- COMMENTS FOR TABLEPLUS
-- =============================================

COMMENT ON TABLE users IS 'User accounts with preferences and budget constraints';
COMMENT ON TABLE lego_sets IS 'Catalog of all LEGO sets with metadata';
COMMENT ON TABLE stores IS 'Shopping sources and scraper configurations';
COMMENT ON TABLE price_history IS 'Historical price data from all stores';
COMMENT ON TABLE user_wishlists IS 'User wishlists with priorities and budget limits';
COMMENT ON TABLE ai_recommendations IS 'AI-generated purchase recommendations';
COMMENT ON TABLE scraper_logs IS 'Logs of scraper execution and performance';
COMMENT ON TABLE user_sessions IS 'User session data for AI context';

COMMENT ON COLUMN users.preferences IS 'JSON field storing user preferences and settings';
COMMENT ON COLUMN lego_sets.dimensions IS 'JSON field storing physical dimensions';
COMMENT ON COLUMN lego_sets.metadata IS 'Flexible JSON field for additional set data';
COMMENT ON COLUMN stores.shipping_info IS 'JSON field storing shipping costs and policies';
COMMENT ON COLUMN stores.scraper_config IS 'JSON field storing web scraper configuration';
COMMENT ON COLUMN price_history.metadata IS 'JSON field for additional price data';
COMMENT ON COLUMN ai_recommendations.price_analysis IS 'JSON field storing price trend analysis';
COMMENT ON COLUMN ai_recommendations.alternative_sets IS 'Array of alternative set IDs';
COMMENT ON COLUMN user_sessions.session_data IS 'JSON field storing session context for AI';
