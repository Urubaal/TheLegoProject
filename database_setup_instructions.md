# Instrukcje instalacji bazy danych LEGO Purchase Suggestion System

## Wymagania systemowe

- PostgreSQL 13+ (zalecana wersja 15+)
- TablePlus (do eksploracji danych)
- Minimum 2GB RAM
- 10GB wolnego miejsca na dysku

## Instalacja PostgreSQL

### Windows
1. Pobierz PostgreSQL z [postgresql.org](https://www.postgresql.org/download/windows/)
2. Uruchom installer i postępuj zgodnie z instrukcjami
3. Zapamiętaj hasło dla użytkownika `postgres`
4. Sprawdź czy PostgreSQL działa: `psql --version`

### macOS
```bash
# Używając Homebrew
brew install postgresql
brew services start postgresql

# Lub używając Postgres.app
# Pobierz z https://postgresapp.com/
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Konfiguracja bazy danych

### 1. Utwórz bazę danych
```sql
-- Połącz się z PostgreSQL jako superuser
psql -U postgres

-- Utwórz bazę danych
CREATE DATABASE lego_purchase_system;
CREATE USER lego_user WITH PASSWORD 'Gitf%$hM9#475fMv';
GRANT ALL PRIVILEGES ON DATABASE lego_purchase_system TO lego_user;
\q
```

### 2. Załaduj schemat
```bash
# Połącz się z nową bazą danych
psql -U lego_user -d lego_purchase_system -f lego_database_schema.sql
```

### 3. Sprawdź instalację
```sql
-- Połącz się z bazą danych
psql -U lego_user -d lego_purchase_system

-- Sprawdź tabele
\dt

-- Sprawdź dane przykładowe
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM lego_sets;
SELECT COUNT(*) FROM price_history;
```

## Konfiguracja TablePlus

### 1. Dodaj nowe połączenie
1. Otwórz TablePlus
2. Kliknij "Create a new connection"
3. Wybierz "PostgreSQL"
4. Wprowadź dane:
   - **Name**: LEGO Purchase System
   - **Host**: localhost
   - **Port**: 5432
   - **User**: lego_user
   - **Password**: Gitf%$hM9#475fMv
   - **Database**: lego_purchase_system

### 2. Testuj połączenie
1. Kliknij "Test" aby sprawdzić połączenie
2. Jeśli test przejdzie, kliknij "Connect"

## Eksploracja danych w TablePlus

### Przydatne widoki do eksploracji:

1. **current_best_prices** - Najlepsze ceny dla każdego zestawu
2. **user_wishlist_prices** - Listy życzeń użytkowników z aktualnymi cenami
3. **ai_recommendations_summary** - Podsumowanie rekomendacji AI

### Przykładowe zapytania do testowania:

```sql
-- 1. Sprawdź wszystkich użytkowników i ich preferencje
SELECT username, first_name, last_name, preferences, budget_min, budget_max
FROM users;

-- 2. Znajdź zestawy w budżecie użytkownika
SELECT * FROM user_wishlist_prices 
WHERE budget_status = 'Within Budget';

-- 3. Sprawdź trendy cenowe dla konkretnego zestawu
SELECT set_number, store_name, price, scraped_at 
FROM price_history ph 
JOIN lego_sets ls ON ph.lego_set_id = ls.id 
JOIN stores s ON ph.store_id = s.id 
WHERE ls.set_number = '75309' 
ORDER BY scraped_at DESC;

-- 4. Sprawdź rekomendacje AI
SELECT * FROM ai_recommendations_summary 
ORDER BY confidence_score DESC;

-- 5. Znajdź alternatywne zestawy
SELECT ls2.set_number, ls2.name, ls2.theme, ls2.pieces
FROM lego_sets ls1
JOIN lego_sets ls2 ON ls1.theme = ls2.theme
WHERE ls1.set_number = '75309' AND ls2.set_number != '75309'
ORDER BY ls2.pieces;
```

## Struktura bazy danych

### Główne tabele:

1. **users** - Konta użytkowników z preferencjami i budżetami
2. **lego_sets** - Katalog zestawów LEGO z metadanymi
3. **stores** - Sklepy i konfiguracje scraperów
4. **price_history** - Historia cen z wszystkich sklepów
5. **user_wishlists** - Listy życzeń użytkowników
6. **ai_recommendations** - Rekomendacje generowane przez AI
7. **scraper_logs** - Logi działania scraperów
8. **user_sessions** - Sesje użytkowników dla kontekstu AI

### Kluczowe funkcje:

- **JSONB** - Elastyczne przechowywanie preferencji i metadanych
- **UUID** - Unikalne identyfikatory dla lepszej skalowalności
- **Indeksy GIN** - Szybkie wyszukiwanie w polach JSON i tablicach
- **Triggers** - Automatyczne aktualizowanie timestampów
- **Generated columns** - Automatyczne obliczanie całkowitej ceny

## Następne kroki

1. **Konfiguracja scraperów** - Dodaj więcej sklepów do tabeli `stores`
2. **Integracja AI** - Skonfiguruj endpointy AI do generowania rekomendacji
3. **Monitoring** - Skonfiguruj alerty na podstawie tabeli `scraper_logs`
4. **Backup** - Skonfiguruj automatyczne kopie zapasowe bazy danych

## Rozwiązywanie problemów

### Problem: Błąd połączenia z bazą danych
```bash
# Sprawdź czy PostgreSQL działa
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Sprawdź logi
tail -f /var/log/postgresql/postgresql-*.log  # Linux
```

### Problem: Błąd uprawnień
```sql
-- Sprawdź uprawnienia użytkownika
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'lego_user';
```

### Problem: Brak danych przykładowych
```sql
-- Sprawdź czy dane zostały załadowane
SELECT COUNT(*) FROM users;
-- Jeśli 0, uruchom ponownie:
-- psql -U lego_user -d lego_purchase_system -f lego_database_schema.sql
```

## Kontakt i wsparcie

W przypadku problemów z konfiguracją, sprawdź:
1. Logi PostgreSQL
2. Konfigurację sieci (port 5432)
3. Uprawnienia użytkownika
4. Wersję PostgreSQL (wymagana 13+)
