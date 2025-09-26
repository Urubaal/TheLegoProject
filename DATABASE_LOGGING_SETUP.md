# System Logowania w Bazie Danych - LEGO Purchase System

## Przegląd

System logowania został zrefaktoryzowany, aby przechowywać logi w bazie danych PostgreSQL zamiast w plikach. To zapewnia lepszą wydajność, skalowalność i bezpieczeństwo.

## Architektura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Aplikacja     │───▶│  Winston Logger │───▶│   PostgreSQL    │
│   (Express)     │    │  + Transports   │    │  (system_logs)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Cloud Services │
                       │ (Google/Datadog)│
                       └─────────────────┘
```

## Struktura Bazy Danych

### Tabela `system_logs`

```sql
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL,           -- error, warn, info, debug
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',          -- dodatkowe dane
  service VARCHAR(50) DEFAULT 'lego-backend',
  environment VARCHAR(20) DEFAULT 'development',
  user_id INTEGER REFERENCES users(id), -- opcjonalne
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP                  -- dla automatycznego czyszczenia
);
```

### Indeksy dla Wydajności

- `idx_system_logs_level` - filtrowanie według poziomu
- `idx_system_logs_created_at` - sortowanie według daty
- `idx_system_logs_user_id` - filtrowanie według użytkownika
- `idx_system_logs_expires_at` - automatyczne czyszczenie
- `idx_system_logs_service_env` - filtrowanie według serwisu i środowiska
- `idx_system_logs_metadata_gin` - wyszukiwanie w metadata (JSONB)

## Instalacja i Konfiguracja

### 1. Uruchom Migrację Bazy Danych

```bash
cd backend
node migrations/create_system_logs_table.js
```

### 2. Skonfiguruj Zmienne Środowiskowe

```bash
# W pliku .env
LOG_STORAGE=database          # database, files, hybrid
LOG_RETENTION_DAYS=30         # ile dni przechowywać logi
LOG_LEVEL=info
LOG_CLEANUP_INTERVAL_HOURS=6  # interwał czyszczenia
```

### 3. Migruj Istniejące Logi (Opcjonalne)

```bash
# Przenieś istniejące pliki logów do bazy danych
node migrate-logs-to-database.js

# Wyczyść stare pliki po migracji
node migrate-logs-to-database.js cleanup
```

## API Endpointy

### Pobierz Logi

```http
GET /api/logs?page=1&limit=50&level=error&userId=123
```

**Parametry:**
- `page` - strona (domyślnie 1)
- `limit` - liczba rekordów (domyślnie 50, max 1000)
- `level` - poziom logu (error, warn, info, debug)
- `service` - nazwa serwisu (domyślnie lego-backend)
- `environment` - środowisko (development, production)
- `userId` - ID użytkownika
- `startDate` - data początkowa (ISO format)
- `endDate` - data końcowa (ISO format)
- `search` - wyszukiwanie w wiadomości i metadata

**Odpowiedź:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "level": "error",
        "message": "Database connection failed",
        "metadata": {"error": "ECONNREFUSED"},
        "service": "lego-backend",
        "environment": "development",
        "user_id": 123,
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "pages": 25
    }
  }
}
```

### Statystyki Logów

```http
GET /api/logs/stats?service=lego-backend&environment=production
```

**Odpowiedź:**
```json
{
  "success": true,
  "data": {
    "levelStats": [
      {
        "level": "error",
        "count": "25",
        "oldest": "2024-01-01T00:00:00.000Z",
        "newest": "2024-01-15T10:30:00.000Z"
      }
    ],
    "dailyStats": [...],
    "hourlyStats": [...]
  }
}
```

### Wyszukiwanie Logów

```http
POST /api/logs/search
Content-Type: application/json

{
  "query": "database error",
  "level": "error",
  "userId": 123,
  "ip": "192.168.1.1",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "limit": 100
}
```

### Szczegóły Loga

```http
GET /api/logs/123
```

### Czyszczenie Starych Logów

```http
POST /api/logs/cleanup
Content-Type: application/json

{
  "olderThanDays": 30
}
```

## Użycie w Kodzie

### Podstawowe Logowanie

```javascript
const { info, warn, error, debug, audit, security, performance } = require('./utils/logger');

// Logi systemowe
info('User action completed', { userId: 123, action: 'login' });
warn('Rate limit approaching', { ip: '192.168.1.1', requests: 95 });
error('Database connection failed', { error: err.message });

// Logi audytu
audit('User registered', userId, { 
  email: 'user@example.com', 
  country: 'PL' 
});

// Logi bezpieczeństwa
security('Failed login attempt', { 
  email: 'hacker@evil.com', 
  ip: '192.168.1.100' 
});

// Metryki wydajności
const startTime = Date.now();
// ... operacja ...
performance('Database query', Date.now() - startTime, { 
  query: 'SELECT * FROM users' 
});
```

### Zarządzanie Logami

```javascript
const { getLogStats, cleanupLogs, getDatabaseTransport } = require('./utils/logger');

// Pobierz statystyki
const stats = await getLogStats();
console.log('Log statistics:', stats);

// Wyczyść stare logi
const deletedCount = await cleanupLogs();
console.log(`Deleted ${deletedCount} old logs`);

// Sprawdź dostępność transportu bazy danych
const isAvailable = await getDatabaseTransport().isAvailable();
console.log('Database transport available:', isAvailable);
```

## Automatyczne Czyszczenie

### Harmonogram

- **Uruchomienie**: Automatyczne przy starcie serwera
- **Interwał**: Co 6 godzin (konfigurowalny)
- **Kryterium**: Logi starsze niż `LOG_RETENTION_DAYS` dni
- **Metoda**: Usuwanie rekordów z `expires_at < NOW()`

### Zarządzanie Harmonogramem

```bash
# Sprawdź status
curl -X POST http://localhost:3000/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'

# Zatrzymaj harmonogram
curl -X POST http://localhost:3000/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'

# Uruchom harmonogram (co 3 godziny)
curl -X POST http://localhost:3000/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "intervalHours": 3}'

# Wykonaj natychmiastowe czyszczenie
curl -X POST http://localhost:3000/api/admin/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup"}'
```

## Monitorowanie i Diagnostyka

### Sprawdź Stan Systemu

```bash
# Metryki systemu
curl http://localhost:3000/api/metrics

# Statystyki logów
curl http://localhost:3000/api/logs/stats

# Ostatnie błędy
curl "http://localhost:3000/api/logs?level=error&limit=10"
```

### Logi w Czasie Rzeczywistym

```bash
# Ostatnie logi
curl "http://localhost:3000/api/logs?limit=20"

# Logi z wyszukiwaniem
curl -X POST http://localhost:3000/api/logs/search \
  -H "Content-Type: application/json" \
  -d '{"query": "error", "limit": 10}'
```

## Bezpieczeństwo

### Kontrola Dostępu

- Wszystkie endpointy mogą wymagać autoryzacji (odkomentuj `router.use(authenticateToken)`)
- Logi zawierają wrażliwe dane - ogranicz dostęp
- Użyj HTTPS w produkcji

### Dane Wrażliwe

- **Nie loguj**: hasła, tokeny, dane osobowe
- **Loguj**: ID użytkowników, IP, akcje, błędy
- **Szyfruj**: wrażliwe metadata w JSONB

## Wydajność

### Optymalizacja Zapytań

- Używaj indeksów do filtrowania
- Ogranicz `LIMIT` do rozsądnych wartości
- Używaj `created_at` do zakresów dat
- Partycjonuj tabelę według daty (dla dużych wolumenów)

### Przykłady Zapytań

```sql
-- Ostatnie błędy
SELECT * FROM system_logs 
WHERE level = 'error' 
ORDER BY created_at DESC 
LIMIT 10;

-- Logi użytkownika
SELECT * FROM system_logs 
WHERE user_id = 123 
ORDER BY created_at DESC;

-- Błędy z ostatnich 24 godzin
SELECT * FROM system_logs 
WHERE level = 'error' 
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## Rozwiązywanie Problemów

### Problem: Logi nie są zapisywane

```bash
# Sprawdź połączenie z bazą danych
node -e "const { Pool } = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.log('DB Error:', e.message));"

# Sprawdź czy tabela istnieje
psql $DATABASE_URL -c "SELECT COUNT(*) FROM system_logs;"
```

### Problem: Wolne zapytania

```sql
-- Sprawdź indeksy
\d+ system_logs

-- Sprawdź statystyki zapytań
SELECT * FROM pg_stat_user_tables WHERE relname = 'system_logs';
```

### Problem: Dużo miejsca w bazie

```sql
-- Sprawdź rozmiar tabeli
SELECT pg_size_pretty(pg_total_relation_size('system_logs'));

-- Wyczyść stare logi
DELETE FROM system_logs WHERE expires_at < NOW();
```

## Migracja z Plików

### Krok 1: Backup

```bash
# Utwórz backup bazy danych
pg_dump $DATABASE_URL > backup_before_logs_migration.sql
```

### Krok 2: Uruchom Migrację

```bash
# Utwórz tabelę system_logs
node migrations/create_system_logs_table.js

# Przenieś istniejące logi
node migrate-logs-to-database.js
```

### Krok 3: Weryfikacja

```bash
# Sprawdź czy logi zostały przeniesione
curl http://localhost:3000/api/logs/stats

# Sprawdź czy nowe logi są zapisywane
curl http://localhost:3000/api/logs?limit=5
```

### Krok 4: Cleanup

```bash
# Wyczyść stare pliki (opcjonalne)
node migrate-logs-to-database.js cleanup
```

## Korzyści Nowego Systemu

### ✅ Wydajność
- Zapytania SQL zamiast czytania plików
- Indeksy dla szybkiego wyszukiwania
- Paginacja wyników

### ✅ Skalowanie
- Replikacja bazy danych
- Partycjonowanie według daty
- Archiwizacja starych logów

### ✅ Bezpieczeństwo
- Kontrola dostępu na poziomie bazy
- Szyfrowanie wrażliwych danych
- Audit trail

### ✅ Integracja
- Łatwe zapytania z aplikacji
- Dashboard z metrykami
- Alerty na podstawie logów

### ✅ Zarządzanie
- Automatyczne czyszczenie
- Centralne przechowywanie
- Łatwe backup i restore
