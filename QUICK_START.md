# 🚀 Quick Start - LEGO Purchase System

## Co Masz Gotowe (2025-01-XX)

### ✅ Backend (Node.js + Express)
- **Port**: 3000
- **Baza**: PostgreSQL (port 5432)
- **Cache**: Redis (port 6379)
- **Auth**: JWT + bcrypt
- **Email**: Nodemailer (SMTP)

### ✅ Frontend (Vanilla JS + HTML/CSS)
- **Port**: 8080 (nginx)
- **Responsive**: Mobile-first design
- **Uploads**: File upload dla zdjęć zestawów

### ✅ Docker Setup
```bash
# Development
docker-compose up -d

# Production  
docker-compose -f docker-compose-production.yml up -d
```

## 🗄️ Baza Danych - CO JUŻ DZIAŁA

### Tabele:
```sql
users              -- użytkownicy, auth, profile
lego_sets          -- katalog 1000+ zestawów LEGO  
user_collections   -- kolekcje (owned/wanted)
olx_offers         -- oferty z OLX
system_logs        -- logi aplikacji
```

### Przykłady danych:
- **1000+ zestawów LEGO** już w bazie
- **Seed data** z prawdziwymi zestawami
- **Indeksy** dla performance

## 🔴 Redis - CO ROBIMY

### Sesje:
- JWT token storage
- Password reset tokens (TTL)
- User session cache

### Cache:
- Collection data cache
- API response cache
- Performance optimization

## 🔐 Auth Flow - GOTOWE

1. **Register** → JWT token
2. **Login** → JWT token  
3. **Password Reset** → Email + Redis token
4. **Profile** → CRUD operations

## 📧 Email - KONFIGURACJA

### SMTP Settings:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Templates:
- Welcome email (HTML)
- Password reset (HTML)
- Error notifications

## 🛡️ Security - WŁĄCZONE

- **Helmet.js**: CSP, HSTS, XSS protection
- **CORS**: Configured origins
- **Rate Limiting**: 50 req/15min (5 for auth)
- **Input Validation**: SQL injection protection
- **File Upload**: Type/size validation

## 📊 Monitoring - DZIAŁA

### Logs:
```
/backend/logs/
├── application-YYYY-MM-DD.log
├── error-YYYY-MM-DD.log  
├── audit-YYYY-MM-DD.log
```

### Endpoints:
- `GET /api/health` - health check
- `GET /api/metrics` - performance metrics
- `POST /api/admin/cleanup-logs` - log cleanup

## 🚧 Environment Variables - WYMAGANE

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_USER=lego_user
POSTGRES_DB=lego_purchase_system

# Auth
JWT_SECRET=your-secret-key

# Redis (opcjonalny)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:8080
```

## 🔄 Typowe Operacje - GOTOWE

### API Endpoints:
```bash
# Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password

# Profile  
GET /api/profile
PUT /api/profile

# LEGO
GET /api/lego/sets
GET /api/lego/sets/:id
POST /api/lego/collection
GET /api/lego/collection

# OLX Offers
GET /api/lego/offers/:setNumber
```

### Frontend Pages:
- `/` - Home page
- `/dashboard` - User dashboard  
- `/lego-collection` - Collection management
- `/brick-buy` - Price comparison
- `/set-detail` - Set details

## 🐛 Debugging - NARZĘDZIA

### Logs:
```bash
# View logs
tail -f backend/logs/application-$(date +%Y-%m-%d).log

# Check errors
tail -f backend/logs/error-$(date +%Y-%m-%d).log
```

### Database:
```bash
# Connect to DB
docker exec -it lego_db psql -U lego_user -d lego_purchase_system

# Check tables
\dt

# Sample query
SELECT COUNT(*) FROM lego_sets;
```

### Redis:
```bash
# Connect to Redis
docker exec -it lego_redis redis-cli

# Check keys
KEYS *

# Check connection
PING
```

## ⚡ Performance Tips

### Database:
- Connection pooling (10-20 connections)
- Query timeouts (10s)
- Indexes on frequently queried columns

### Redis:
- Connection retry logic
- TTL for cache entries
- Batch operations for multiple keys

### Frontend:
- Image optimization (5MB limit)
- AJAX for real-time updates
- Responsive images

---
**💡 Tip**: Zawsze sprawdź `PROJECT_STATUS.md` dla pełnego statusu implementacji!
