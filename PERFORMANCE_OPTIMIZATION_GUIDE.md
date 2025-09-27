# 🚀 Przewodnik Optymalizacji Wydajności Bazy Danych

## 📋 Przegląd Zmian

Zostały wprowadzone następujące optymalizacje wydajności:

### 1. **Connection Pooling** ✅
- Zwiększono maksymalną liczbę połączeń do 20
- Dodano timeout dla połączeń (2s)
- Dodano timeout dla idle connections (30s)
- Włączono keep-alive dla lepszej wydajności

### 2. **Indeksy Bazy Danych** ✅
- Dodano indeksy dla często używanych zapytań
- Dodano indeksy częściowe dla aktywnych rekordów
- Dodano indeksy dla wyszukiwania pełnotekstowego
- Dodano indeksy złożone dla JOIN-ów

### 3. **Optymalizacja Zapytań** ✅
- Stworzono narzędzia do cache'owania zapytań
- Dodano paginację dla lepszej wydajności
- Zoptymalizowano zapytania wyszukiwania
- Dodano batch operations

## 🛠️ Instrukcje Uruchomienia

### Krok 1: Uruchom Optymalizacje Bazy Danych

```bash
# Przejdź do katalogu backend
cd backend

# Uruchom skrypt optymalizacji
psql -h localhost -U lego_user -d lego_purchase_system -f migrations/run_performance_optimizations.sql
```

### Krok 2: Weryfikacja Indeksów

```sql
-- Sprawdź czy indeksy zostały utworzone
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### Krok 3: Monitorowanie Wydajności

```sql
-- Sprawdź statystyki użycia indeksów
SELECT * FROM index_usage_stats;

-- Sprawdź rozmiary tabel
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 📊 Nowe Funkcje Wydajności

### 1. **DatabaseOptimization Class**
```javascript
const DatabaseOptimization = require('./utils/databaseOptimization');

const dbOpt = new DatabaseOptimization();

// Paginacja z optymalizacją
const collections = await dbOpt.getUserCollectionsPaginated(userId, 'owned_sets', {
  page: 1,
  limit: 20,
  condition: 'new',
  sortBy: 'added_at',
  sortOrder: 'DESC'
});

// Wyszukiwanie w kolekcjach
const searchResults = await dbOpt.searchUserCollections(userId, 'star wars', 'all');

// Statystyki pool-a
const poolStats = dbOpt.getPoolStats();
```

### 2. **QueryOptimizer Class**
```javascript
const QueryOptimizer = require('./utils/queryOptimizer');

const queryOpt = new QueryOptimizer();

// Zoptymalizowane zapytania z cache
const collections = await queryOpt.getOptimizedUserCollections(pool, userId, 'owned_sets', options);

// Wyszukiwanie pełnotekstowe
const searchResults = await queryOpt.searchWithFullText(pool, 'lego', userId, 'all');

// Statystyki kolekcji z cache
const stats = await queryOpt.getOptimizedCollectionStats(pool, userId);
```

## 🔧 Konfiguracja Środowiska

### Zmienne Środowiskowe (opcjonalne)
```env
# Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_ACQUIRE_TIMEOUT=60000

# Cache Settings
QUERY_CACHE_TIMEOUT=300000
ENABLE_QUERY_CACHE=true
```

## 📈 Oczekiwane Ulepszenia Wydajności

### Przed Optymalizacją:
- ❌ Brak connection pooling
- ❌ Brak indeksów na często używanych kolumnach
- ❌ Brak cache'owania zapytań
- ❌ Brak optymalizacji zapytań

### Po Optymalizacji:
- ✅ **Connection Pooling**: 3-5x szybsze połączenia
- ✅ **Indeksy**: 10-50x szybsze zapytania wyszukiwania
- ✅ **Cache**: 2-3x szybsze powtarzające się zapytania
- ✅ **Paginacja**: Lepsza wydajność dla dużych zestawów danych
- ✅ **Batch Operations**: 5-10x szybsze operacje masowe

## 🚨 Ważne Uwagi

### 1. **Backup Bazy Danych**
```bash
# Przed uruchomieniem optymalizacji
pg_dump -h localhost -U lego_user lego_purchase_system > backup_before_optimization.sql
```

### 2. **Monitoring Po Optymalizacji**
- Sprawdź statystyki użycia indeksów po tygodniu
- Monitoruj czas wykonywania zapytań
- Sprawdź wykorzystanie pamięci pool-a

### 3. **Rollback (w razie potrzeby)**
```sql
-- Usuń nowe indeksy (jeśli powodują problemy)
DROP INDEX IF EXISTS idx_user_owned_sets_user_condition;
DROP INDEX IF EXISTS idx_user_wanted_sets_user_priority;
-- ... inne indeksy
```

## 🔍 Debugowanie Wydajności

### Sprawdzenie Wolnych Zapytań
```sql
-- Jeśli pg_stat_statements jest włączone
SELECT * FROM slow_queries LIMIT 10;
```

### Sprawdzenie Statystyk Pool-a
```javascript
// W kodzie aplikacji
const poolStats = dbOpt.getPoolStats();
console.log('Pool Stats:', poolStats);
```

### Sprawdzenie Cache
```javascript
// Sprawdź statystyki cache
const cacheStats = queryOpt.getCacheStats();
console.log('Cache Stats:', cacheStats);
```

## 📝 Następne Kroki

1. **Uruchom optymalizacje** zgodnie z instrukcjami powyżej
2. **Przetestuj aplikację** - sprawdź czy wszystko działa poprawnie
3. **Monitoruj wydajność** przez pierwszy tydzień
4. **Dostosuj parametry** jeśli potrzeba (timeout, cache, etc.)
5. **Dokumentuj zmiany** w zespole

---

**💡 Tip**: Uruchom optymalizacje w środowisku testowym przed produkcją!

**⚠️ Uwaga**: Niektóre indeksy mogą zwiększyć czas zapisywania danych, ale znacznie przyspieszą odczyty.
