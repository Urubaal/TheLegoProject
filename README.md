# LEGO Purchase Suggestion System

AI-powered system for LEGO set purchase suggestions with collection management, price analysis, and marketplace integration.

## 🎯 System Overview

The system consists of:
- **Backend API** (Node.js/Express) - REST API with authentication and collection management
- **Frontend** (HTML/CSS/JS) - Modern web interface for collection management
- **PostgreSQL Database** - storing data about sets, users, collections
- **Redis Cache** - session management and performance optimization
- **Docker** - containerized deployment for easy setup

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

### 1. Prerequisites
- Docker and Docker Compose installed
- Git for cloning the repository

### 2. Clone and Setup
```bash
git clone <repository-url>
cd lego-purchase-system

# Copy environment template
copy env.example .env
# Edit .env file with your configuration
```

### 3. Start the System
```bash
# Quick start (recommended)
quick-start-optimized.bat

# Or manual startup
docker-compose up -d
```

### 4. Access the Application
- **Frontend**: http://localhost:5500
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

### 5. Development Setup
```bash
# Install dependencies
npm install

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

## 📁 Project Structure

```
├── backend/                      # Node.js/Express backend
│   ├── controllers/              # API controllers
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   ├── middleware/               # Express middleware
│   └── utils/                    # Utility functions
├── frontend/                     # Web frontend
│   ├── index.html                # Login page
│   ├── dashboard.html            # Main dashboard
│   ├── lego-collection.html      # Collection management
│   └── styles.css                # Styles
├── docker-compose.yml            # Docker configuration
├── docker-compose-production.yml # Production configuration
├── lego_database_schema.sql      # Database schema
└── README.md                     # This file
```

## 🔧 Available Scripts

### Quick Start Scripts
- `quick-start-optimized.bat` - Fast startup with health checks
- `start-dev.bat` - Development mode
- `start-prod.bat` - Production mode
- `stop.bat` - Stop all services

### Utility Scripts
- `health-check-utility.bat` - System diagnostics
- `performance-monitor.bat` - Performance monitoring
- `cleanup-logs.bat` - Clean old log files
- `setup-environment.bat` - Environment setup

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

## 🔧 Troubleshooting

### Common Issues

**System won't start:**
```bash
# Check Docker status
docker info

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

**Database connection errors:**
```bash
# Check database health
docker-compose exec database pg_isready -U lego_user

# Reset database
docker-compose down -v
docker-compose up -d
```

**Frontend not loading:**
- Ensure backend is running: http://localhost:3000/api/health
- Check network configuration
- Verify CORS settings

### Performance Issues
```bash
# Monitor system performance
performance-monitor.bat

# Clean up old logs
cleanup-logs.bat

# Check Docker resources
docker stats
```

## 📚 Documentation

For detailed setup and configuration:
- [Environment Setup](ENVIRONMENT_SETUP.md) - Environment configuration
- [Development Rules](DEVELOPMENT_RULES.md) - Development guidelines
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Optimization Guide](OPTIMIZATION_GUIDE.md) - Performance optimization
- [Logging Setup](LOGGING_SETUP.md) - Logging configuration
- [Redis Setup](REDIS_SETUP.md) - Redis configuration

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and best practices.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.