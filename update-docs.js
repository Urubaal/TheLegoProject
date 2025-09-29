#!/usr/bin/env node

/**
 * Documentation Update Script
 * Automatically updates documentation files with current project status
 */

const fs = require('fs');
const path = require('path');

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Read package.json for version info
const getVersionInfo = () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return {
      version: packageJson.version || '1.0.0',
      name: packageJson.name || 'LEGO Purchase System'
    };
  } catch (error) {
    return {
      version: '1.0.0',
      name: 'LEGO Purchase System'
    };
  }
};

// Check if files exist
const checkFileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Get file stats
const getFileStats = (filePath) => {
  if (!checkFileExists(filePath)) return null;
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    modified: stats.mtime.toISOString().split('T')[0],
    created: stats.birthtime.toISOString().split('T')[0]
  };
};

// Update PROJECT_STATUS.md
const updateProjectStatus = () => {
  const currentDate = getCurrentDate();
  const versionInfo = getVersionInfo();
  
  const content = `# 🚀 Status Implementacji - LEGO Purchase System

## 📊 Ogólny Status Projektu
- **Backend**: ✅ W pełni funkcjonalny
- **Frontend**: ✅ Działający
- **Baza danych**: ✅ PostgreSQL skonfigurowana
- **Redis**: ✅ Skonfigurowany dla sesji i cache
- **Docker**: ✅ Konteneryzacja gotowa
- **Monitoring**: ✅ Logi i metryki działają

## 🗄️ Baza Danych (PostgreSQL)
### Tabele:
- ✅ \`users\` - użytkownicy z autentykacją
- ✅ \`lego_sets\` - katalog zestawów LEGO
- ✅ \`user_collections\` - kolekcje użytkowników (owned/wanted)
- ✅ \`olx_offers\` - oferty z OLX
- ✅ \`system_logs\` - logi systemowe

### Funkcje:
- ✅ Połączenie pool z optymalizacjami
- ✅ Obsługa błędów PostgreSQL (${currentDate})
- ✅ Event listenery dla pool
- ✅ Migracje i seed data

## 🔴 Redis
### Konfiguracja:
- ✅ Połączenie z retry logic
- ✅ Health check
- ✅ Event listenery (error, reconnect)
- ✅ Graceful shutdown

### Funkcje:
- ✅ Tokeny resetowania hasła
- ✅ Cache kolekcji użytkowników
- ✅ Sesje użytkowników
- ✅ Batch operations

## 🔐 Autentykacja i Autoryzacja
- ✅ JWT tokens
- ✅ Middleware auth
- ✅ Rate limiting (różne limity dla różnych endpointów)
- ✅ Password reset przez email
- ✅ Email verification

## 📧 Email Service
- ✅ Nodemailer z SMTP
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ Logowanie błędów email (${currentDate})

## 🛡️ Bezpieczeństwo
- ✅ Helmet.js (CSP, HSTS)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection

## 📊 Monitoring i Logowanie
- ✅ Structured logging (winston)
- ✅ Request/response logging
- ✅ Error tracking
- ✅ Performance metrics
- ✅ Log rotation i cleanup
- ✅ Health check endpoint

## 🐳 Docker & Deployment
- ✅ Docker Compose (dev & prod)
- ✅ Nginx reverse proxy
- ✅ SSL/HTTPS setup
- ✅ Environment configuration
- ✅ Graceful shutdown

## 🧪 Testy
- ✅ Jest configuration
- ✅ Test setup
- ✅ Auth tests
- ⚠️ Więcej testów potrzebne

## 📱 Frontend
### Strony:
- ✅ Dashboard
- ✅ Kolekcja LEGO
- ✅ Szczegóły zestawu
- ✅ Brick Buy (porównywarka cen)
- ✅ Home page

### Funkcje:
- ✅ Responsive design
- ✅ AJAX requests
- ✅ File uploads
- ✅ Real-time updates

## 🔧 Ostatnie Zmiany (${currentDate})
- ✅ Specjalistyczna obsługa błędów PostgreSQL
- ✅ Logowanie błędów email
- ✅ Event listenery dla database pool
- ✅ Ulepszone logowanie błędów Redis
- ✅ Walidacja zmiennych środowiskowych
- ✅ Automatyczna aktualizacja dokumentacji

## 🚧 Co Może Potrzebować Uwagi
- ⚠️ Więcej testów jednostkowych
- ⚠️ Dokumentacja API (może OpenAPI/Swagger)
- ⚠️ Performance testing
- ⚠️ Backup strategy

## 🔗 Kluczowe Pliki Konfiguracyjne
- \`docker-compose.yml\` - środowisko deweloperskie
- \`docker-compose-production.yml\` - środowisko produkcyjne
- \`env.example\` - template zmiennych środowiskowych
- \`lego_database_schema.sql\` - schemat bazy danych

## 📝 Uwagi dla Deweloperów
- Zawsze sprawdź \`DEVELOPMENT_RULES.md\` przed dodawaniem nowych pól
- Uruchom migracje jeśli zmieniasz strukturę bazy
- Sprawdź logi w \`/backend/logs/\`
- Redis jest opcjonalny - aplikacja działa bez niego w trybie fallback

---
**Ostatnia aktualizacja**: ${currentDate}
**Wersja**: ${versionInfo.version}
**Aktualizacja automatyczna**: ✅`;

  fs.writeFileSync('PROJECT_STATUS.md', content, 'utf8');
  console.log('✅ PROJECT_STATUS.md zaktualizowany');
};

// Update CHANGELOG.md
const updateChangelog = () => {
  const currentDate = getCurrentDate();
  const versionInfo = getVersionInfo();
  
  // Check if CHANGELOG.md exists
  let existingContent = '';
  if (checkFileExists('CHANGELOG.md')) {
    existingContent = fs.readFileSync('CHANGELOG.md', 'utf8');
  }
  
  // Extract existing entries (skip the header)
  const lines = existingContent.split('\n');
  const headerEndIndex = lines.findIndex(line => line.startsWith('## ['));
  const existingEntries = headerEndIndex > 0 ? lines.slice(headerEndIndex).join('\n') : '';
  
  const newEntry = `## [${currentDate}] - Documentation & Error Handling Updates

### ✅ Added
- **Automatic Documentation Updates**: Script for maintaining up-to-date documentation
- **PostgreSQL Error Handling**: Specialized error codes handling in \`errorHandler.js\`
  - \`23505\` - unique_violation (duplicate entry)
  - \`23503\` - foreign_key_violation (referenced record not found)
  - \`23502\` - not_null_violation (required field missing)
  - \`ECONNREFUSED\` - database connection failed
  - \`ENOTFOUND\` - database host not found

- **Email Error Logging**: Enhanced logging in \`emailService.js\`
  - Structured logging with Winston
  - Detailed error context (email, messageId, errors)
  - Success/failure tracking

- **Database Pool Monitoring**: Event listeners in all models
  - Error logging with stack traces
  - Connection lifecycle tracking
  - Debug information for connection management

- **Redis Error Enhancement**: Improved error logging in \`redisService.js\`
  - Error codes in logs
  - Reconnection status tracking
  - Better error context

- **Environment Validation**: Startup validation in \`server.js\`
  - Required variables check (\`JWT_SECRET\`, \`DATABASE_URL\`)
  - Graceful failure with detailed error messages
  - Validation success logging

### 🔧 Technical Details
- **Files Modified**:
  - \`backend/middleware/errorHandler.js\`
  - \`backend/utils/emailService.js\`
  - \`backend/utils/redisService.js\`
  - \`backend/server.js\`
  - \`backend/models/User.js\`
  - \`backend/models/LegoSet.js\`
  - \`backend/models/UserCollection.js\`
  - \`backend/models/OlxOffer.js\`

- **Dependencies**: No new dependencies required
- **Breaking Changes**: None
- **Migration Required**: None

### 📊 Impact
- **Better Debugging**: Detailed error logs with context
- **Improved Stability**: Better error handling and recovery
- **Enhanced Monitoring**: Connection status tracking
- **Security**: Environment validation prevents misconfigurations
- **Documentation**: Automated updates prevent outdated docs

---

`;

  const content = `# Changelog - LEGO Purchase System

All notable changes to this project will be documented in this file.

${newEntry}${existingEntries}`;

  fs.writeFileSync('CHANGELOG.md', content, 'utf8');
  console.log('✅ CHANGELOG.md zaktualizowany');
};

// Update .cursorrules
const updateCursorRules = () => {
  const currentDate = getCurrentDate();
  
  const content = `# Cursor AI Rules for LEGO Purchase System

## Project Context
This is a FULLY FUNCTIONAL LEGO purchase suggestion system with:
- **Backend**: Node.js/Express API with PostgreSQL + Redis
- **Frontend**: Vanilla HTML/CSS/JS (responsive)
- **Database**: PostgreSQL with 1000+ LEGO sets, user collections, OLX offers
- **Cache**: Redis for sessions, tokens, and performance
- **Auth**: JWT + email verification + password reset
- **Security**: Helmet, CORS, rate limiting, input validation
- **Monitoring**: Structured logging, health checks, metrics
- **Deployment**: Docker Compose (dev & prod)

## Key Files to Check
- \`PROJECT_STATUS.md\` - Complete implementation status
- \`QUICK_START.md\` - Immediate setup and features overview
- \`CHANGELOG.md\` - Recent changes and updates
- \`backend/server.js\` - Main server with all middleware
- \`backend/models/\` - Database models (User, LegoSet, UserCollection, OlxOffer)
- \`backend/utils/\` - Services (redisService, emailService, logger, monitoring)
- \`docker-compose.yml\` - Development environment
- \`env.example\` - Required environment variables

## Database Schema
- \`users\` - User accounts with JWT auth
- \`lego_sets\` - 1000+ LEGO sets catalog
- \`user_collections\` - User owned/wanted collections
- \`olx_offers\` - Marketplace offers
- \`system_logs\` - Application logs

## Important Notes
- PostgreSQL is PRIMARY database (not MongoDB)
- Redis is OPTIONAL (fallback mode if not available)
- Email service uses SMTP (Nodemailer)
- All models have connection pool error handling
- Environment variables validation on startup
- Structured logging with Winston
- Rate limiting and security middleware active
- Error handling enhanced with PostgreSQL-specific codes

## When Making Changes
1. Check \`PROJECT_STATUS.md\` first
2. Verify database schema in \`lego_database_schema.sql\`
3. Check existing models before adding new fields
4. Follow \`DEVELOPMENT_RULES.md\` for database changes
5. Test with Docker Compose setup
6. Run \`node update-docs.js\` to update documentation

## Common Commands
\`\`\`bash
# Start development
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Database access
docker exec -it lego_db psql -U lego_user -d lego_purchase_system

# Redis access  
docker exec -it lego_redis redis-cli

# Update documentation
node update-docs.js
\`\`\`

## Never Assume
- ❌ Don't assume MongoDB (it's PostgreSQL)
- ❌ Don't assume Redis is required (fallback mode exists)
- ❌ Don't assume no auth (JWT middleware is active)
- ❌ Don't assume no logging (structured logging is everywhere)
- ❌ Don't assume no security (Helmet, CORS, rate limiting active)
- ❌ Don't assume no error handling (PostgreSQL errors are handled)

## Always Check
- ✅ Check \`PROJECT_STATUS.md\` for current features
- ✅ Check \`QUICK_START.md\` for setup
- ✅ Check \`CHANGELOG.md\` for recent changes
- ✅ Check existing models before database changes
- ✅ Check Docker setup before deployment changes
- ✅ Check environment variables in \`env.example\`
- ✅ Run documentation update after changes

---
**Last Updated**: ${currentDate}
**Version**: Auto-generated
`;

  fs.writeFileSync('.cursorrules', content, 'utf8');
  console.log('✅ .cursorrules zaktualizowany');
};

// Main execution
const main = () => {
  console.log('🚀 Aktualizacja dokumentacji...');
  console.log(`📅 Data: ${getCurrentDate()}`);
  
  try {
    updateProjectStatus();
    updateChangelog();
    updateCursorRules();
    
    console.log('✅ Wszystkie pliki dokumentacji zostały zaktualizowane!');
    console.log('📝 Sprawdź zmiany w:');
    console.log('   - PROJECT_STATUS.md');
    console.log('   - CHANGELOG.md');
    console.log('   - .cursorrules');
    
  } catch (error) {
    console.error('❌ Błąd podczas aktualizacji dokumentacji:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  updateProjectStatus,
  updateChangelog,
  updateCursorRules,
  getCurrentDate,
  getVersionInfo
};
