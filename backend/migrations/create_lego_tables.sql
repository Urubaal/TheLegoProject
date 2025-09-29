-- Create LEGO sets table
CREATE TABLE IF NOT EXISTS lego_sets (
    id SERIAL PRIMARY KEY,
    set_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(100),
    subtheme VARCHAR(100),
    year INTEGER,
    pieces INTEGER,
    minifigs INTEGER,
    retail_price DECIMAL(10,2),
    image_url TEXT,
    description TEXT,
    availability VARCHAR(50) DEFAULT 'retail',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user collections table
CREATE TABLE IF NOT EXISTS user_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    set_number VARCHAR(20) NOT NULL,
    collection_type VARCHAR(20) NOT NULL CHECK (collection_type IN ('owned', 'wanted')),
    quantity INTEGER DEFAULT 1,
    paid_price DECIMAL(10,2),
    condition VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, set_number, collection_type)
);

-- Create OLX offers table
CREATE TABLE IF NOT EXISTS olx_offers (
    id SERIAL PRIMARY KEY,
    set_number VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    condition VARCHAR(100),
    location VARCHAR(200),
    seller_name VARCHAR(200),
    seller_rating DECIMAL(3,2),
    offer_url TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lego_sets_set_number ON lego_sets(set_number);
CREATE INDEX IF NOT EXISTS idx_lego_sets_theme ON lego_sets(theme);
CREATE INDEX IF NOT EXISTS idx_lego_sets_year ON lego_sets(year);
CREATE INDEX IF NOT EXISTS idx_lego_sets_name ON lego_sets USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_set_number ON user_collections(set_number);
CREATE INDEX IF NOT EXISTS idx_user_collections_type ON user_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_user_collections_user_set_type ON user_collections(user_id, set_number, collection_type);

CREATE INDEX IF NOT EXISTS idx_olx_offers_set_number ON olx_offers(set_number);
CREATE INDEX IF NOT EXISTS idx_olx_offers_price ON olx_offers(price);
CREATE INDEX IF NOT EXISTS idx_olx_offers_location ON olx_offers(location);
CREATE INDEX IF NOT EXISTS idx_olx_offers_active ON olx_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_olx_offers_created_at ON olx_offers(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw';
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lego_sets_updated_at BEFORE UPDATE ON lego_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_collections_updated_at BEFORE UPDATE ON user_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_olx_offers_updated_at BEFORE UPDATE ON olx_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for LEGO set 75399 (Rebel U-Wing Starfighter)
INSERT INTO lego_sets (
    set_number, name, theme, subtheme, year, pieces, minifigs, 
    retail_price, image_url, description, availability
) VALUES (
    '75399-1', 
    'Rebel U-Wing Starfighter', 
    'Star Wars', 
    'Andor', 
    2025, 
    594, 
    4, 
    69.99, 
    'https://www.lego.com/cdn/cs/set/assets/blt1234567890/75399.png',
    'Build the Rebel U-Wing Starfighter from Andor series with 4 minifigures including Cassian Andor, K-2SO, and Rebel soldiers.',
    'retail'
) ON CONFLICT (set_number) DO NOTHING;

-- Insert sample OLX offers for set 75399
INSERT INTO olx_offers (
    set_number, title, price, condition, location, seller_name, seller_rating, 
    offer_url, image_url, description
) VALUES 
(
    '75399-1',
    'LEGO Star Wars Rebel U-Wing Starfighter 75399 - NOWY',
    45.00,
    'nowy',
    'Warszawa',
    'LEGO_Fan_123',
    4.8,
    'https://www.olx.pl/oferta/lego-star-wars-rebel-u-wing-75399-CID123456',
    'https://img.olx.pl/75399_1.jpg',
    'Zestaw LEGO Star Wars Rebel U-Wing Starfighter 75399 w stanie idealnym, kompletny z instrukcją.'
),
(
    '75399-1',
    'LEGO Star Wars 75399 U-Wing - używany',
    38.00,
    'używany',
    'Kraków',
    'Collector_Pro',
    4.5,
    'https://www.olx.pl/oferta/lego-star-wars-75399-u-wing-CID789012',
    'https://img.olx.pl/75399_2.jpg',
    'Zestaw w bardzo dobrym stanie, wszystkie elementy kompletne, lekko zużyte opakowanie.'
),
(
    '75399-1',
    'LEGO Star Wars Andor Rebel U-Wing Starfighter 75399',
    52.00,
    'nowy',
    'Gdańsk',
    'LEGO_Store_PL',
    4.9,
    'https://www.olx.pl/oferta/lego-star-wars-andor-75399-CID345678',
    'https://img.olx.pl/75399_3.jpg',
    'Oryginalny zestaw LEGO Star Wars z serii Andor, fabrycznie zapakowany.'
),
(
    '75399-1',
    'LEGO 75399 Rebel U-Wing Starfighter - bez pudełka',
    35.00,
    'używany',
    'Wrocław',
    'BrickMaster',
    4.2,
    'https://www.olx.pl/oferta/lego-75399-rebel-u-wing-CID901234',
    'https://img.olx.pl/75399_4.jpg',
    'Zestaw kompletny bez oryginalnego pudełka, wszystkie minifigurki i elementy.'
),
(
    '75399-1',
    'LEGO Star Wars 75399 - NOWY w folii',
    48.00,
    'nowy',
    'Poznań',
    'LEGO_Hunter',
    4.7,
    'https://www.olx.pl/oferta/lego-star-wars-75399-nowy-CID567890',
    'https://img.olx.pl/75399_5.jpg',
    'Zestaw w oryginalnym opakowaniu, nieotwarty, w folii ochronnej.'
)
ON CONFLICT (offer_url) DO NOTHING;

-- Create view for collection statistics
CREATE OR REPLACE VIEW user_collection_stats AS
SELECT 
    uc.user_id,
    u.display_name,
    COUNT(CASE WHEN uc.collection_type = 'owned' THEN 1 END) as owned_sets,
    COUNT(CASE WHEN uc.collection_type = 'wanted' THEN 1 END) as wanted_sets,
    SUM(CASE WHEN uc.collection_type = 'owned' THEN uc.quantity ELSE 0 END) as total_owned_quantity,
    SUM(CASE WHEN uc.collection_type = 'owned' AND uc.paid_price IS NOT NULL THEN uc.paid_price * uc.quantity ELSE 0 END) as total_paid_value,
    AVG(CASE WHEN uc.collection_type = 'owned' AND uc.paid_price IS NOT NULL THEN uc.paid_price ELSE NULL END) as avg_paid_price,
    SUM(CASE WHEN uc.collection_type = 'owned' THEN ls.retail_price * uc.quantity ELSE 0 END) as total_retail_value
FROM user_collections uc
LEFT JOIN users u ON uc.user_id = u.id
LEFT JOIN lego_sets ls ON uc.set_number = ls.set_number
GROUP BY uc.user_id, u.display_name;

-- Create view for set details with offers
CREATE OR REPLACE VIEW set_details_with_offers AS
SELECT 
    ls.*,
    COUNT(DISTINCT oo.id) as total_offers,
    COUNT(DISTINCT CASE WHEN oo.is_active = true THEN oo.id END) as active_offers,
    MIN(CASE WHEN oo.is_active = true THEN oo.price END) as min_offer_price,
    MAX(CASE WHEN oo.is_active = true THEN oo.price END) as max_offer_price,
    AVG(CASE WHEN oo.is_active = true THEN oo.price END) as avg_offer_price
FROM lego_sets ls
LEFT JOIN olx_offers oo ON ls.set_number = oo.set_number
GROUP BY ls.id, ls.set_number, ls.name, ls.theme, ls.subtheme, ls.year, ls.pieces, ls.minifigs, ls.retail_price, ls.image_url, ls.description, ls.availability, ls.created_at, ls.updated_at;

COMMENT ON TABLE lego_sets IS 'Table storing LEGO set information';
COMMENT ON TABLE user_collections IS 'Table storing user collection items (owned/wanted sets)';
COMMENT ON TABLE olx_offers IS 'Table storing OLX marketplace offers for LEGO sets';
COMMENT ON VIEW user_collection_stats IS 'View providing statistics for user collections';
COMMENT ON VIEW set_details_with_offers IS 'View combining set details with offer statistics';
