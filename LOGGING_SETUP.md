# System Logowania - LEGO Purchase System

## Przegląd

System logowania został zaimplementowany z użyciem **Winston** i oferuje wielopoziomowe logowanie z możliwością przechowywania w plikach lub bazie danych PostgreSQL, a także integrację z chmurowymi usługami.

## 🎯 Opcje Przechowywania Logów

### 1. **Pliki Logów** (domyślne)
- Przechowywanie w katalogu `backend/logs/`
- Automatyczna rotacja plików
- Struktura: `application-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`, `audit-YYYY-MM-DD.log`

### 2. **Baza Danych PostgreSQL** (opcjonalne)
- Przechowywanie w tabeli `system_logs`
- Lepsze zapytania i analiza
- Integracja z aplikacją

## Funkcje

### ✅ Zaimplementowane
- **Lokalne logowanie** - pliki i konsola
- **Rotacja plików** - automatyczne zarządzanie rozmiarem
- **Różne poziomy logów** - error, warn, info, debug
- **Logi audytu** - operacje użytkowników
- **Logi bezpieczeństwa** - próby nieautoryzowanego dostępu
- **Metryki wydajności** - czas wykonywania operacji
- **Monitorowanie systemu** - zdrowie aplikacji
- **Integracja z Google Cloud Logging** (opcjonalna)
- **Integracja z Datadog** (opcjonalna)

## Struktura Logów

```
backend/logs/
├── application-YYYY-MM-DD.log    # Wszystkie logi
├── error-YYYY-MM-DD.log          # Tylko błędy
└── audit-YYYY-MM-DD.log          # Operacje użytkowników
```

## Konfiguracja

### Zmienne środowiskowe

```bash
# Podstawowe logowanie
LOG_LEVEL=info                    # debug, info, warn, error
NODE_ENV=development              # development, production
LOG_STORAGE=files                 # files, database, hybrid

# Logowanie do bazy danych (opcjonalne)
LOG_STORAGE=database              # database, files, hybrid
LOG_RETENTION_DAYS=30             # ile dni przechowywać logi
LOG_CLEANUP_INTERVAL_HOURS=6      # interwał czyszczenia

# Google Cloud Logging (opcjonalne)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Datadog (opcjonalne)
DATADOG_API_KEY=your-datadog-api-key
HOSTNAME=your-server-hostname
```

## 🗄️ Konfiguracja Logowania do Bazy Danych

### 1. Uruchom Migrację Bazy Danych

```bash
cd backend
node migrations/create_system_logs_table.js
```

### 2. Struktura Tabeli `system_logs`

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

### 3. Migruj Istniejące Logi (Opcjonalne)

```bash
# Przenieś istniejące pliki logów do bazy danych
node migrate-logs-to-database.js

# Wyczyść stare pliki po migracji
node migrate-logs-to-database.js cleanup
```

## Użycie w kodzie

```javascript
const { info, warn, error, audit, security, performance } = require('./utils/logger');

// Podstawowe logi
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

## Endpointy monitorowania

### GET /api/metrics
Zwraca metryki systemu:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "requests": 1250,
      "errors": 5,
      "uptime": 3600,
      "errorRate": "0.40%",
      "requestsPerMinute": 20
    },
    "health": {
      "status": "healthy",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "diskSpace": {
      "available": true,
      "message": "Disk space check passed"
    },
    "logSizes": {
      "totalFiles": 3,
      "totalSize": 2048,
      "files": [...]
    }
  }
}
```

### POST /api/admin/cleanup-logs
Czyści stare pliki logów (starsze niż 2 dni).

### POST /api/admin/scheduler
Zarządza harmonogramem automatycznego czyszczenia logów.

**Akcje:**
- `{"action": "start", "intervalHours": 6}` - Uruchom harmonogram
- `{"action": "stop"}` - Zatrzymaj harmonogram  
- `{"action": "status"}` - Sprawdź status
- `{"action": "cleanup"}` - Wykonaj natychmiastowe czyszczenie

**Przykład odpowiedzi:**
```json
{
  "success": true,
  "message": "Log cleanup scheduler started",
  "data": {
    "isRunning": true,
    "nextCleanup": "2024-01-15T16:30:00.000Z"
  }
}
```

## 📊 API Endpointy dla Logów w Bazie Danych

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

### Statystyki Logów
```http
GET /api/logs/stats?service=lego-backend&environment=production
```

### Wyszukiwanie Logów
```http
POST /api/logs/search
Content-Type: application/json

{
  "query": "database error",
  "level": "error",
  "userId": 123,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "limit": 100
}
```

### Czyszczenie Starych Logów
```http
POST /api/logs/cleanup
Content-Type: application/json

{
  "olderThanDays": 30
}
```

## Integracja z chmurowymi usługami

### Google Cloud Logging

1. **Utwórz projekt w Google Cloud Console**
2. **Włącz Google Cloud Logging API**
3. **Utwórz Service Account** z uprawnieniami do logowania
4. **Pobierz klucz JSON** i ustaw zmienne środowiskowe:

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Bezpłatny tier**: 50GB logów miesięcznie

### Datadog

1. **Zarejestruj się na Datadog** (bezpłatny plan: 5 hostów)
2. **Pobierz API key** z dashboardu
3. **Ustaw zmienne środowiskowe**:

```bash
export DATADOG_API_KEY="your-datadog-api-key"
export HOSTNAME="your-server-hostname"
```

**Bezpłatny tier**: 5 hostów, 1-dniowe przechowywanie metryk

## Poziomy logowania

| Poziom | Opis | Przykład |
|--------|------|----------|
| `error` | Błędy krytyczne | Błąd bazy danych, wyjątki |
| `warn` | Ostrzeżenia | Rate limit, nieprawidłowe dane |
| `info` | Informacje ogólne | Uruchomienie serwera, operacje użytkowników |
| `debug` | Szczegóły debugowania | Wartości zmiennych, przepływ wykonania |

## Rotacja plików

- **Maksymalny rozmiar pliku**: 20MB
- **Pliki aplikacji**: przechowywane 14 dni
- **Pliki błędów**: przechowywane 30 dni  
- **Pliki audytu**: przechowywane 90 dni

## Automatyczne czyszczenie logów

System automatycznie usuwa pliki logów starsze niż **2 dni**:

### Konfiguracja
```bash
# Interwał czyszczenia (domyślnie co 6 godzin)
LOG_CLEANUP_INTERVAL_HOURS=6
```

### Harmonogram
- **Uruchomienie**: Automatyczne przy starcie serwera
- **Interwał**: Co 6 godzin (konfigurowalny)
- **Pierwsze czyszczenie**: Po 1 minucie od uruchomienia
- **Kryterium**: Pliki starsze niż 2 dni

### Zarządzanie
```bash
# Sprawdź status harmonogramu
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

## Monitorowanie w czasie rzeczywistym

### Konsola (development)
```bash
npm run dev
```

### Pliki logów
```bash
# Ostatnie błędy
tail -f backend/logs/error-$(date +%Y-%m-%d).log

# Wszystkie logi
tail -f backend/logs/application-$(date +%Y-%m-%d).log

# Logi audytu
tail -f backend/logs/audit-$(date +%Y-%m-%d).log
```

### Google Cloud Console
1. Przejdź do **Logging > Logs Explorer**
2. Filtruj według `resource.type="global"`
3. Użyj zapytań LogQL do analizy

### Datadog Dashboard
1. Przejdź do **Logs** w Datadog
2. Filtruj według `service:lego-purchase-system`
3. Utwórz dashboardy i alerty

## Najlepsze praktyki

1. **Używaj odpowiednich poziomów** - nie loguj wszystkiego jako `info`
2. **Dodawaj kontekst** - zawsze dołączaj `userId`, `ip`, `requestId`
3. **Nie loguj wrażliwych danych** - hasła, tokeny, dane osobowe
4. **Używaj strukturalnych logów** - JSON format dla łatwiejszej analizy
5. **Monitoruj rozmiar plików** - używaj endpointu `/api/metrics`
6. **Regularnie czyść logi** - używaj `/api/admin/cleanup-logs`

## Rozwiązywanie problemów

### Problem: Logi nie są zapisywane
```bash
# Sprawdź uprawnienia do katalogu logs
ls -la backend/logs/
chmod 755 backend/logs/
```

### Problem: Google Cloud Logging nie działa
```bash
# Sprawdź zmienne środowiskowe
echo $GOOGLE_CLOUD_PROJECT
echo $GOOGLE_APPLICATION_CREDENTIALS

# Sprawdź uprawnienia do pliku klucza
ls -la $GOOGLE_APPLICATION_CREDENTIALS
```

### Problem: Duże pliki logów
```bash
# Sprawdź rozmiary plików
curl http://localhost:3000/api/metrics

# Wyczyść stare logi
curl -X POST http://localhost:3000/api/admin/cleanup-logs
```

## Koszty

| Usługa | Bezpłatny tier | Dodatkowe koszty |
|--------|----------------|-------------------|
| **Lokalne pliki** | ✅ Bezpłatne | - |
| **Google Cloud Logging** | 50GB/miesiąc | $0.50/GB |
| **Datadog** | 5 hostów, 1 dzień | $15/host/miesiąc |
