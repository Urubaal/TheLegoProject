# LEGO Purchase Suggestion System - Baza Danych

System AI do sugestii zakupu zestawów LEGO z integracją scraperów, zarządzaniem użytkownikami i analizą cen.

## 🎯 Przegląd systemu

System składa się z:
- **Baza danych PostgreSQL** - przechowywanie danych o zestawach, użytkownikach, cenach
- **Scrapery** - zbieranie danych z różnych sklepów internetowych
- **AI** - generowanie inteligentnych sugestii zakupu
- **TablePlus** - narzędzie do eksploracji danych

## 🗄️ Architektura bazy danych

### Główne tabele:

1. **`users`** - Konta użytkowników z preferencjami i budżetami
2. **`lego_sets`** - Katalog zestawów LEGO z metadanymi
3. **`stores`** - Sklepy internetowe i konfiguracje scraperów
4. **`price_history`** - Historia cen z wszystkich sklepów
5. **`user_wishlists`** - Listy życzeń użytkowników
6. **`ai_recommendations`** - Rekomendacje generowane przez AI
7. **`scraper_logs`** - Logi działania scraperów
8. **`user_sessions`** - Sesje użytkowników dla kontekstu AI

### Kluczowe funkcje:

- **UUID** - Unikalne identyfikatory dla lepszej skalowalności
- **JSONB** - Elastyczne przechowywanie preferencji i metadanych
- **Indeksy GIN** - Szybkie wyszukiwanie w polach JSON i tablicach
- **Generated columns** - Automatyczne obliczanie całkowitej ceny
- **Triggers** - Automatyczne aktualizowanie timestampów

## 🚀 Szybki start

### 1. Instalacja PostgreSQL
```bash
# Windows - pobierz z postgresql.org
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Konfiguracja bazy danych
```sql
-- Utwórz bazę danych
CREATE DATABASE lego_purchase_system;
CREATE USER lego_user WITH PASSWORD 'Gitf%$hM9#475fMv';
GRANT ALL PRIVILEGES ON DATABASE lego_purchase_system TO lego_user;
```

### 3. Załaduj schemat
```bash
psql -U lego_user -d lego_purchase_system -f lego_database_schema.sql
```

### 4. Konfiguracja TablePlus
- Host: localhost
- Port: 5432
- User: lego_user
- Password: Gitf%$hM9#475fMv
- Database: lego_purchase_system

## 📊 Eksploracja danych

### Przydatne widoki:
- **`current_best_prices`** - Najlepsze ceny dla każdego zestawu
- **`user_wishlist_prices`** - Listy życzeń z aktualnymi cenami
- **`ai_recommendations_summary`** - Podsumowanie rekomendacji AI

### Przykładowe zapytania:
```sql
-- Zestawy w budżecie użytkowników
SELECT * FROM user_wishlist_prices 
WHERE budget_status = 'Within Budget';

-- Rekomendacje AI z wysoką pewnością
SELECT * FROM ai_recommendations_summary 
WHERE confidence_score >= 0.8;

-- Trendy cenowe dla konkretnego zestawu
SELECT set_number, store_name, price, scraped_at 
FROM price_history ph 
JOIN lego_sets ls ON ph.lego_set_id = ls.id 
WHERE ls.set_number = '75309' 
ORDER BY scraped_at DESC;
```

## 🔧 Konfiguracja scraperów

### Dodawanie nowego sklepu:
```sql
INSERT INTO stores (name, website_url, country, currency, shipping_info, scraper_config) 
VALUES (
    'Nowy Sklep',
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

## 🤝 Wsparcie

W przypadku problemów:
1. Sprawdź logi PostgreSQL
2. Zweryfikuj konfigurację sieci
3. Sprawdź uprawnienia użytkowników
4. Upewnij się, że używasz PostgreSQL 13+

## 📚 Źródła

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TablePlus Documentation](https://tableplus.com/docs)
- [JSON in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)