-- =============================================
-- PRZYKŁADOWE ZAPYTANIA DLA TABLEPLUS
-- LEGO Purchase Suggestion System
-- =============================================

-- =============================================
-- 1. PODSTAWOWE ZAPYTANIA EKSPLORACYJNE
-- =============================================

-- Sprawdź wszystkie tabele w bazie danych
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Sprawdź strukturę tabeli users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Sprawdź strukturę tabeli lego_sets
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'lego_sets'
ORDER BY ordinal_position;

-- =============================================
-- 2. ANALIZA UŻYTKOWNIKÓW
-- =============================================

-- Wszyscy użytkownicy z ich preferencjami
SELECT 
    username,
    first_name,
    last_name,
    preferences,
    budget_min,
    budget_max,
    preferred_currency,
    created_at
FROM users
ORDER BY created_at DESC;

-- Użytkownicy z preferencjami Star Wars
SELECT 
    username,
    first_name,
    last_name,
    preferences->>'themes' as preferred_themes,
    budget_min,
    budget_max
FROM users
WHERE preferences->>'themes' LIKE '%Star Wars%';

-- Statystyki budżetów użytkowników
SELECT 
    COUNT(*) as total_users,
    AVG(budget_min) as avg_min_budget,
    AVG(budget_max) as avg_max_budget,
    MIN(budget_min) as min_budget,
    MAX(budget_max) as max_budget
FROM users
WHERE is_active = true;

-- =============================================
-- 3. ANALIZA ZESTAWÓW LEGO
-- =============================================

-- Wszystkie zestawy z podstawowymi informacjami
SELECT 
    set_number,
    name,
    theme,
    subtheme,
    year_released,
    pieces,
    minifigures,
    retail_price,
    availability_status
FROM lego_sets
ORDER BY year_released DESC, pieces DESC;

-- Zestawy Star Wars z minifigurkami
SELECT 
    set_number,
    name,
    pieces,
    minifigures,
    retail_price,
    tags
FROM lego_sets
WHERE theme = 'Star Wars' 
AND minifigures > 0
ORDER BY minifigures DESC, pieces DESC;

-- Zestawy Creator Expert (dla kolekcjonerów)
SELECT 
    set_number,
    name,
    pieces,
    retail_price,
    difficulty_level,
    dimensions
FROM lego_sets
WHERE theme = 'Creator Expert'
ORDER BY pieces DESC;

-- Statystyki zestawów według tematyki
SELECT 
    theme,
    COUNT(*) as set_count,
    AVG(pieces) as avg_pieces,
    AVG(retail_price) as avg_price,
    MIN(year_released) as earliest_year,
    MAX(year_released) as latest_year
FROM lego_sets
GROUP BY theme
ORDER BY set_count DESC;

-- =============================================
-- 4. ANALIZA CEN I SKLEPÓW
-- =============================================

-- Aktualne najlepsze ceny dla każdego zestawu
SELECT * FROM current_best_prices
ORDER BY set_number, total_price;

-- Porównanie cen między sklepami dla konkretnego zestawu
SELECT 
    ls.set_number,
    ls.name,
    s.name as store_name,
    ph.price,
    ph.shipping_cost,
    ph.total_price,
    ph.discount_percentage,
    ph.scraped_at
FROM lego_sets ls
JOIN price_history ph ON ls.id = ph.lego_set_id
JOIN stores s ON ph.store_id = s.id
WHERE ls.set_number = '75309'  -- Republic Gunship
AND ph.availability = true
ORDER BY ph.total_price;

-- Sklepy z największymi rabatami
SELECT 
    s.name as store_name,
    ls.set_number,
    ls.name as set_name,
    ph.discount_percentage,
    ph.price,
    ph.original_price,
    ph.scraped_at
FROM price_history ph
JOIN stores s ON ph.store_id = s.id
JOIN lego_sets ls ON ph.lego_set_id = ls.id
WHERE ph.discount_percentage > 0
ORDER BY ph.discount_percentage DESC;

-- =============================================
-- 5. ANALIZA LIST ŻYCZEŃ UŻYTKOWNIKÓW
-- =============================================

-- Listy życzeń z aktualnymi cenami
SELECT * FROM user_wishlist_prices
ORDER BY username, priority;

-- Zestawy w budżecie użytkowników
SELECT 
    username,
    set_number,
    name,
    priority,
    max_price,
    total_price,
    store_name,
    budget_status
FROM user_wishlist_prices
WHERE budget_status = 'Within Budget'
ORDER BY username, priority;

-- Zestawy poza budżetem (wymagają czekania na lepsze ceny)
SELECT 
    username,
    set_number,
    name,
    priority,
    max_price,
    total_price,
    store_name,
    (total_price - max_price) as over_budget_amount
FROM user_wishlist_prices
WHERE budget_status = 'Over Budget'
ORDER BY over_budget_amount DESC;

-- Najpopularniejsze zestawy na listach życzeń
SELECT 
    ls.set_number,
    ls.name,
    ls.theme,
    COUNT(*) as wishlist_count,
    AVG(uw.priority) as avg_priority
FROM user_wishlists uw
JOIN lego_sets ls ON uw.lego_set_id = ls.id
GROUP BY ls.id, ls.set_number, ls.name, ls.theme
ORDER BY wishlist_count DESC, avg_priority ASC;

-- =============================================
-- 6. ANALIZA REKOMENDACJI AI
-- =============================================

-- Wszystkie aktywne rekomendacje AI
SELECT * FROM ai_recommendations_summary
ORDER BY username, confidence_score DESC;

-- Rekomendacje "kup teraz" z wysoką pewnością
SELECT 
    username,
    set_number,
    name,
    confidence_score,
    reasoning,
    total_price,
    store_name
FROM ai_recommendations_summary
WHERE recommendation_type = 'buy_now'
AND confidence_score >= 0.8
ORDER BY confidence_score DESC;

-- Rekomendacje "czekaj" - zestawy do monitorowania
SELECT 
    username,
    set_number,
    name,
    confidence_score,
    reasoning,
    total_price,
    store_name
FROM ai_recommendations_summary
WHERE recommendation_type = 'wait'
ORDER BY confidence_score DESC;

-- Statystyki rekomendacji według typu
SELECT 
    recommendation_type,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence,
    MIN(confidence_score) as min_confidence,
    MAX(confidence_score) as max_confidence
FROM ai_recommendations
WHERE is_active = true
GROUP BY recommendation_type
ORDER BY count DESC;

-- =============================================
-- 7. ANALIZA TRENDÓW CENOWYCH
-- =============================================

-- Historia cen dla konkretnego zestawu (ostatnie 30 dni)
SELECT 
    ls.set_number,
    ls.name,
    s.name as store_name,
    ph.price,
    ph.total_price,
    ph.discount_percentage,
    ph.scraped_at
FROM price_history ph
JOIN lego_sets ls ON ph.lego_set_id = ls.id
JOIN stores s ON ph.store_id = s.id
WHERE ls.set_number = '75309'  -- Republic Gunship
AND ph.scraped_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ph.scraped_at DESC;

-- Zestawy z największymi spadkami cen
SELECT 
    ls.set_number,
    ls.name,
    s.name as store_name,
    ph.price as current_price,
    ph.original_price,
    ph.discount_percentage,
    ph.scraped_at
FROM price_history ph
JOIN lego_sets ls ON ph.lego_set_id = ls.id
JOIN stores s ON ph.store_id = s.id
WHERE ph.discount_percentage > 10
ORDER BY ph.discount_percentage DESC;

-- =============================================
-- 8. ANALIZA SKLEPÓW I SCRAPERÓW
-- =============================================

-- Informacje o sklepach
SELECT 
    name,
    website_url,
    country,
    currency,
    shipping_info,
    is_active,
    created_at
FROM stores
ORDER BY name;

-- Ostatnie logi scraperów
SELECT 
    s.name as store_name,
    sl.status,
    sl.items_scraped,
    sl.errors_count,
    sl.execution_time_seconds,
    sl.started_at,
    sl.completed_at
FROM scraper_logs sl
JOIN stores s ON sl.store_id = s.id
ORDER BY sl.started_at DESC
LIMIT 20;

-- Wydajność scraperów (ostatnie 7 dni)
SELECT 
    s.name as store_name,
    COUNT(*) as total_runs,
    AVG(sl.items_scraped) as avg_items_scraped,
    AVG(sl.execution_time_seconds) as avg_execution_time,
    SUM(sl.errors_count) as total_errors
FROM scraper_logs sl
JOIN stores s ON sl.store_id = s.id
WHERE sl.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.id, s.name
ORDER BY avg_items_scraped DESC;

-- =============================================
-- 9. ZAPYTANIA DLA ANALIZY BIZNESOWEJ
-- =============================================

-- Top 10 najdroższych zestawów w systemie
SELECT 
    set_number,
    name,
    theme,
    pieces,
    retail_price,
    COUNT(DISTINCT ph.store_id) as available_stores
FROM lego_sets ls
LEFT JOIN price_history ph ON ls.id = ph.lego_set_id
WHERE ph.availability = true OR ph.availability IS NULL
GROUP BY ls.id, set_number, name, theme, pieces, retail_price
ORDER BY retail_price DESC
LIMIT 10;

-- Użytkownicy z największymi budżetami
SELECT 
    username,
    first_name,
    last_name,
    budget_min,
    budget_max,
    (budget_max - budget_min) as budget_range,
    COUNT(uw.id) as wishlist_items
FROM users u
LEFT JOIN user_wishlists uw ON u.id = uw.user_id
WHERE u.is_active = true
GROUP BY u.id, username, first_name, last_name, budget_min, budget_max
ORDER BY budget_max DESC;

-- Zestawy z największą liczbą rekomendacji AI
SELECT 
    ls.set_number,
    ls.name,
    ls.theme,
    COUNT(ar.id) as recommendation_count,
    AVG(ar.confidence_score) as avg_confidence
FROM lego_sets ls
JOIN ai_recommendations ar ON ls.id = ar.lego_set_id
WHERE ar.is_active = true
GROUP BY ls.id, ls.set_number, ls.name, ls.theme
ORDER BY recommendation_count DESC, avg_confidence DESC;

-- =============================================
-- 10. ZAPYTANIA DIAGNOSTYCZNE
-- =============================================

-- Sprawdź integralność danych
SELECT 
    'users' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM users
UNION ALL
SELECT 
    'lego_sets' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM lego_sets
UNION ALL
SELECT 
    'price_history' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM price_history
UNION ALL
SELECT 
    'user_wishlists' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM user_wishlists
UNION ALL
SELECT 
    'ai_recommendations' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT id) as unique_ids
FROM ai_recommendations;

-- Sprawdź brakujące dane
SELECT 
    'users_without_wishlists' as issue,
    COUNT(*) as count
FROM users u
LEFT JOIN user_wishlists uw ON u.id = uw.user_id
WHERE uw.id IS NULL
UNION ALL
SELECT 
    'lego_sets_without_prices' as issue,
    COUNT(*) as count
FROM lego_sets ls
LEFT JOIN price_history ph ON ls.id = ph.lego_set_id
WHERE ph.id IS NULL;

-- Sprawdź wydajność indeksów
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
