# LEGO Purchase Suggestion System - Database

AI system for LEGO set purchase suggestions with scraper integration, user management, and price analysis.

## 🎯 System Overview

The system consists of:
- **PostgreSQL Database** - storing data about sets, users, prices
- **Scrapers** - collecting data from various online stores
- **AI** - generating intelligent purchase suggestions
- **TablePlus** - data exploration tool

## 🗄️ Database Architecture

### Main Tables:

1. **`users`** - User accounts with preferences and budgets
2. **`lego_sets`** - LEGO sets catalog with metadata
3. **`stores`** - Online stores and scraper configurations
4. **`price_history`** - Price history from all stores
5. **`user_wishlists`** - User wishlists
6. **`ai_recommendations`** - AI-generated recommendations
7. **`scraper_logs`** - Scraper operation logs
8. **`user_sessions`** - User sessions for AI context

### Key Features:

- **UUID** - Unique identifiers for better scalability
- **JSONB** - Flexible storage of preferences and metadata
- **GIN Indexes** - Fast searching in JSON fields and arrays
- **Generated columns** - Automatic calculation of total price
- **Triggers** - Automatic timestamp updates

## 🚀 Quick Start

### 0. Environment Configuration
```bash
# Copy configuration template
copy env.example .env

# Edit .env file with appropriate values
# Detailed instructions: ENVIRONMENT_SETUP.md
```

### 1. PostgreSQL Installation
```bash
# Windows - pobierz z postgresql.org
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Database Configuration
```sql
-- Create database
CREATE DATABASE lego_purchase_system;
CREATE USER lego_user WITH PASSWORD 'Gitf%$hM9#475fMv';
GRANT ALL PRIVILEGES ON DATABASE lego_purchase_system TO lego_user;
```

### 3. Load Schema
```bash
psql -U lego_user -d lego_purchase_system -f lego_database_schema.sql
```

### 4. TablePlus Configuration
- Host: localhost
- Port: 5432
- User: lego_user
- Password: Gitf%$hM9#475fMv
- Database: lego_purchase_system

### 5. Project Verification
```bash
# Check if everything works correctly
node verify.js

# Run backend tests
cd backend && npm test

# Check code quality
cd backend && npm run lint
```

## 📊 Data Exploration

### Useful Views:
- **`current_best_prices`** - Best prices for each set
- **`user_wishlist_prices`** - Wishlists with current prices
- **`ai_recommendations_summary`** - AI recommendations summary

### Sample Queries:
```sql
-- Sets within user budgets
SELECT * FROM user_wishlist_prices 
WHERE budget_status = 'Within Budget';

-- AI recommendations with high confidence
SELECT * FROM ai_recommendations_summary 
WHERE confidence_score >= 0.8;

-- Price trends for specific set
SELECT set_number, store_name, price, scraped_at 
FROM price_history ph 
JOIN lego_sets ls ON ph.lego_set_id = ls.id 
WHERE ls.set_number = '75309' 
ORDER BY scraped_at DESC;
```

## 🔧 Scraper Configuration

### Adding New Store:
```sql
INSERT INTO stores (name, website_url, country, currency, shipping_info, scraper_config) 
VALUES (
    'New Store',
    'https://www.example.com',
    'PL',
    'PLN',
    '{"free_shipping_threshold": 150, "standard_shipping": 12}',
    '{"base_url": "https://www.example.com", "selectors": {"price": ".price", "availability": ".stock"}}'
);
```

### Konfiguracja scrapera:
- **`base_url`** - Podstawowy URL sklepu
- **`selectors`** - Selektory CSS dla cen i dostępności
- **`shipping_info`** - Informacje o kosztach przesyłki

## 🤖 Integracja z AI

### Struktura rekomendacji:
```sql
-- Typy rekomendacji:
-- 'buy_now' - Kup teraz
-- 'wait' - Czekaj na lepszą cenę
-- 'avoid' - Unikaj
-- 'alternative' - Znajdź alternatywę
```

### Przykład rekomendacji:
```sql
INSERT INTO ai_recommendations (
    user_id, lego_set_id, recommendation_type, 
    confidence_score, reasoning, price_analysis
) VALUES (
    'user-uuid',
    'set-uuid',
    'buy_now',
    0.85,
    'Price is below your budget and availability is good',
    '{"current_price": 365.00, "price_trend": "stable", "best_deal": "Allegro"}'
);
```

## 📈 Monitoring i analiza

### Kluczowe metryki:
- Liczba aktywnych użytkowników
- Liczba zestawów w systemie
- Średnia cena zestawów
- Wydajność scraperów
- Jakość rekomendacji AI

### Zapytania monitorujące:
```sql
-- Aktywni użytkownicy
SELECT COUNT(*) FROM users WHERE is_active = true;

-- Wydajność scraperów
SELECT s.name, AVG(sl.items_scraped) as avg_items
FROM scraper_logs sl
JOIN stores s ON sl.store_id = s.id
WHERE sl.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.name;
```

## 🔒 Bezpieczeństwo

### Zalecenia:
- Używaj silnych haseł dla użytkowników bazy danych
- Regularnie aktualizuj PostgreSQL
- Konfiguruj backup bazy danych
- Monitoruj logi dostępu
- Używaj SSL dla połączeń

### Backup:
```bash
# Tworzenie backupu
pg_dump -U lego_user -d lego_purchase_system > backup.sql

# Przywracanie backupu
psql -U lego_user -d lego_purchase_system < backup.sql
```

## 📁 Struktura plików

```
├── lego_database_schema.sql      # Główny schemat bazy danych
├── database_setup_instructions.md # Instrukcje instalacji
├── tableplus_queries.sql         # Przykładowe zapytania
└── README.md                     # Ten plik
```

## 🚀 Następne kroki

1. **Konfiguracja scraperów** - Dodaj więcej sklepów
2. **Integracja AI** - Skonfiguruj endpointy AI
3. **Monitoring** - Skonfiguruj alerty i dashboardy
4. **Backup** - Automatyczne kopie zapasowe
5. **Skalowanie** - Optymalizacja dla większej liczby użytkowników

## 🤖 Copilot Configuration

The project uses the following language conventions:

### Languages:
- **User conversations**: Polish 🇵🇱
- **Code comments**: English 🇺🇸
- **Documentation**: English 🇺🇸
- **Commit messages**: English 🇺🇸
- **README**: English 🇺🇸

### Copilot Configuration Example:
```json
{
  "conversation_language": "polish",
  "code_comments_language": "english",
  "documentation_language": "english"
}
```

## 🔧 Verification Tools

The project includes a comprehensive code quality verification system:

### Available Scripts:
```bash
# Full project verification
node verify.js

# Backend - code quality check
cd backend && npm run lint

# Backend - run tests
cd backend && npm run test

# Backend - full verification (linting + tests)
cd backend && npm run check

# Backend - code formatting
cd backend && npm run format

# Backend - check if server is running
cd backend && npm run health
```

### Tools:
- **ESLint** - JavaScript code quality checking
- **Prettier** - automatic code formatting
- **Jest** - unit and integration tests
- **Supertest** - API endpoint tests
- **Custom verification** - comprehensive project verification

### Tests Include:
- ✅ Health check endpoint
- ✅ CORS configuration
- ✅ 404 error handling
- ✅ Rate limiting
- ✅ Project structure
- ✅ Environment configuration

## 🤝 Support

In case of problems:
1. Run `node verify.js` - check project status
2. Check PostgreSQL logs
3. Verify network configuration
4. Check user permissions
5. Make sure you're using PostgreSQL 13+

## 📚 Sources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TablePlus Documentation](https://tableplus.com/docs)
- [JSON in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)