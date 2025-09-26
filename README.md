# LEGO Purchase Suggestion System - Database

AI system for LEGO set purchase suggestions with scraper integration, user management, and price analysis.

## 🎯 System Overview

The system consists of:
- **PostgreSQL Database** - storing data about sets, users, prices
- **Redis Cache** - secure storage for password reset tokens with TTL
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

### User Management Structure:

**Users Table Fields:**
- `id` (UUID) - Unique identifier
- `email` (VARCHAR) - **Unique**, required for login
- `username` (VARCHAR) - **Not unique**, optional (defaults to email prefix)
- `display_name` (VARCHAR) - Display name (defaults to username)
- `country` (VARCHAR) - User's country
- `password_hash` (VARCHAR) - Hashed password
- `preferences` (JSONB) - User preferences
- `budget_min/max` (DECIMAL) - Budget constraints
- `is_active` (BOOLEAN) - Account status

**Key Changes:**
- ✅ Email is unique (one email = one user)
- ✅ Username is NOT unique (multiple users can have same username)
- ✅ Simplified name structure (username + display_name only)
- ✅ No password required for database connection

### Key Features:

- **UUID** - Unique identifiers for better scalability
- **JSONB** - Flexible storage of preferences and metadata
- **GIN Indexes** - Fast searching in JSON fields and arrays
- **Generated columns** - Automatic calculation of total price
- **Triggers** - Automatic timestamp updates

## 🔌 API Endpoints

### Authentication Endpoints:

**POST `/api/auth/register`**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "optional_username",
  "display_name": "Optional Display Name",
  "country": "Polska"
}
```

**POST `/api/auth/login`**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**GET `/api/auth/profile`** (requires authentication)
- Returns user profile information

**POST `/api/auth/logout`** (requires authentication)
- Logs out user (client-side token removal)

### Key Features:
- ✅ Email-based authentication (email is unique)
- ✅ Username is optional and not unique
- ✅ Automatic username generation from email if not provided
- ✅ JWT token-based authentication
- ✅ Secure password reset with Redis TTL storage
- ✅ Redis caching for improved security and scalability

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
# Windows - download from postgresql.org
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Redis Installation (Required for Password Reset)
```bash
# Docker (Recommended)
docker run -d --name redis-server -p 6379:6379 redis:7-alpine

# macOS
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis-server

# Windows - download from microsoftarchive/redis
```

### 3. Database Configuration
```sql
-- Create database
CREATE DATABASE lego_purchase_system;
CREATE USER lego_user;
GRANT ALL PRIVILEGES ON DATABASE lego_purchase_system TO lego_user;
```

### 4. Load Schema
```bash
psql -U lego_user -d lego_purchase_system -f lego_database_schema.sql
```

### 5. TablePlus Configuration
- Host: localhost
- Port: 5432
- User: lego_user
- Password: (leave empty)
- Database: lego_purchase_system

### 6. Project Verification
```bash
# Check if everything works correctly
node verify.js

# Run backend tests
cd backend && npm test

# Check code quality
cd backend && npm run lint

# Install pre-commit hooks (one-time setup)
npm install
```

### 7. Pre-commit Hooks Setup
The project automatically runs quality checks before each commit:
- **Automatic verification** - No manual intervention needed
- **Quality assurance** - Prevents broken code from being committed
- **Consistent standards** - All developers follow the same quality checks

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

### Scraper Configuration:
- **`base_url`** - Store's base URL
- **`selectors`** - CSS selectors for prices and availability
- **`shipping_info`** - Shipping cost information

## 🤖 AI Integration

### Recommendation Structure:
```sql
-- Recommendation types:
-- 'buy_now' - Buy now
-- 'wait' - Wait for better price
-- 'avoid' - Avoid
-- 'alternative' - Find alternative
```

### Recommendation Example:
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

## 📈 Monitoring and Analysis

### Key Metrics:
- Number of active users
- Number of sets in the system
- Average set prices
- Scraper performance
- AI recommendation quality

### Monitoring Queries:
```sql
-- Active users
SELECT COUNT(*) FROM users WHERE is_active = true;

-- Scraper performance
SELECT s.name, AVG(sl.items_scraped) as avg_items
FROM scraper_logs sl
JOIN stores s ON sl.store_id = s.id
WHERE sl.started_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.name;
```

## 🔒 Security

### Recommendations:
- Use strong passwords for database users
- Regularly update PostgreSQL
- Configure database backups
- Monitor access logs
- Use SSL for connections

### Backup:
```bash
# Creating backup
pg_dump -U lego_user -d lego_purchase_system > backup.sql

# Restoring backup
psql -U lego_user -d lego_purchase_system < backup.sql
```

## 📁 File Structure

```
├── lego_database_schema.sql      # Main database schema
├── database_setup_instructions.md # Installation instructions
├── tableplus_queries.sql         # Sample queries
└── README.md                     # This file
```

## 🚀 Next Steps

1. **Scraper Configuration** - Add more stores
2. **AI Integration** - Configure AI endpoints
3. **Monitoring** - Set up alerts and dashboards
4. **Backup** - Automated backups
5. **Scaling** - Optimization for more users

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

# Root level scripts (from project root)
npm run check              # Full project verification
npm run check:backend      # Backend verification only
npm run pre-commit         # Full pre-commit verification

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
- **Husky** - Git hooks management
- **Custom verification** - comprehensive project verification

### Pre-commit Hooks:
The project uses **Husky** to automatically run quality checks before each commit:

- **Project Verification** - Full project health check
- **Backend Linting** - ESLint code quality check
- **Backend Tests** - Jest test suite execution
- **Automatic Blocking** - Commits are blocked if checks fail

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
- [Redis Documentation](https://redis.io/docs/)
- [Redis Setup Guide](REDIS_SETUP.md) - Detailed Redis installation and configuration