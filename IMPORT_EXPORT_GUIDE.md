# Import/Export Kolekcji LEGO - Przewodnik

## Przegląd

System importu/eksportu kolekcji LEGO umożliwia użytkownikom:
- Eksportowanie kolekcji do formatu CSV (kompatybilny z BrickEconomy)
- Importowanie kolekcji z plików CSV
- Zarządzanie danymi kolekcji w standardowym formacie

## Format CSV (BrickEconomy)

### Struktura pliku
```
Number,Theme,Subtheme,Year,SetName,Retail,Paid,Value,Condition,Date,Notes
75399-1,Star Wars,Andor,2025,Rebel U-Wing Starfighter,€69.99,€40.08,€63.10,UsedComplete,03/07/2025,
```

### Opis kolumn
- **Number**: Numer zestawu LEGO (np. 75399-1)
- **Theme**: Motyw zestawu (np. Star Wars)
- **Subtheme**: Podmotyw (np. Andor)
- **Year**: Rok wydania
- **SetName**: Nazwa zestawu
- **Retail**: Cena detaliczna (format: €XX.XX)
- **Paid**: Cena zapłacona (format: €XX.XX)
- **Value**: Aktualna wartość (format: €XX.XX)
- **Condition**: Stan zestawu (New, UsedAsNew, UsedComplete, UsedIncomplete)
- **Date**: Data dodania (format: DD/MM/YYYY)
- **Notes**: Dodatkowe notatki

## API Endpoints

### Eksport kolekcji
```
GET /api/lego/collection/export?type={owned|wanted|all}
```

**Parametry:**
- `type`: Typ kolekcji do eksportu
  - `owned` - tylko posiadane zestawy
  - `wanted` - tylko pożądane zestawy
  - `all` - wszystkie zestawy

**Odpowiedź:**
- Plik CSV do pobrania
- Content-Type: text/csv
- Content-Disposition: attachment; filename="lego-collection-{type}-{date}.csv"

### Import kolekcji
```
POST /api/lego/collection/import
Content-Type: multipart/form-data
```

**Parametry:**
- `csvFile`: Plik CSV (wymagany)
- `overwrite`: Boolean - czy nadpisać istniejące elementy

**Odpowiedź:**
```json
{
  "success": true,
  "data": {
    "imported": 15,
    "updated": 3,
    "errors": 2,
    "errorDetails": ["Linia 5: Brak numeru zestawu"]
  },
  "message": "Import zakończony: 15 nowych, 3 zaktualizowanych, 2 błędów"
}
```

## Interfejs użytkownika

### Przyciski importu/eksportu
- **Export Collection**: Otwiera modal z opcjami eksportu
- **Import Collection**: Otwiera modal z formularzem importu

### Modal eksportu
- Wybór typu kolekcji (owned/wanted/all)
- Przycisk potwierdzenia eksportu
- Automatyczne pobieranie pliku CSV

### Modal importu
- Obszar drag & drop dla plików CSV
- Walidacja typu i rozmiaru pliku
- Opcja nadpisywania istniejących elementów
- Informacje o oczekiwanym formacie CSV

## Walidacja i bezpieczeństwo

### Walidacja plików
- Tylko pliki .csv
- Maksymalny rozmiar: 10MB
- Walidacja nagłówków CSV
- Sprawdzanie wymaganych kolumn

### Mapowanie danych
- Automatyczne mapowanie kolumn CSV na pola bazy danych
- Tworzenie nowych zestawów LEGO jeśli nie istnieją
- Walidacja numerów zestawów
- Konwersja formatów dat i cen

### Obsługa błędów
- Szczegółowe komunikaty błędów
- Logowanie operacji importu/eksportu
- Walidacja każdego wiersza CSV
- Kontynuacja importu mimo błędów w pojedynczych wierszach

## Przykłady użycia

### Eksport kolekcji
1. Kliknij "Export Collection"
2. Wybierz typ kolekcji (owned/wanted/all)
3. Kliknij "Export Collection"
4. Plik CSV zostanie automatycznie pobrany

### Import kolekcji
1. Kliknij "Import Collection"
2. Przeciągnij plik CSV lub kliknij "Choose File"
3. Wybierz opcje importu (nadpisywanie)
4. Kliknij "Import Collection"
5. Sprawdź wyniki importu

## Struktura bazy danych

### Tabela user_collections
```sql
CREATE TABLE user_collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    set_number VARCHAR(20) NOT NULL,
    collection_type VARCHAR(20) NOT NULL CHECK (collection_type IN ('owned', 'wanted')),
    quantity INTEGER DEFAULT 1,
    paid_price DECIMAL(10,2),
    condition VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, set_number, collection_type)
);
```

### Tabela lego_sets
```sql
CREATE TABLE lego_sets (
    id SERIAL PRIMARY KEY,
    set_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(100),
    subtheme VARCHAR(100),
    year INTEGER,
    pieces INTEGER,
    minifigs INTEGER,
    retail_price DECIMAL(10,2),
    image_url TEXT,
    description TEXT,
    availability VARCHAR(50) DEFAULT 'retail',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Logowanie i monitoring

### Logi operacji
- Wszystkie operacje importu/eksportu są logowane
- Szczegółowe informacje o błędach
- Statystyki operacji (imported/updated/errors)

### Metryki wydajności
- Czas wykonania operacji
- Liczba przetworzonych rekordów
- Wykorzystanie pamięci

## Rozwiązywanie problemów

### Częste błędy
1. **"Nieprawidłowy format pliku CSV"**
   - Sprawdź czy plik ma rozszerzenie .csv
   - Sprawdź czy nagłówki są poprawne

2. **"Brak numeru zestawu"**
   - Sprawdź czy pierwsza kolumna zawiera numery zestawów
   - Sprawdź czy nie ma pustych wierszy

3. **"Zestaw już istnieje w kolekcji"**
   - Włącz opcję "Overwrite existing items"
   - Lub usuń duplikaty z pliku CSV

### Debugowanie
- Sprawdź logi aplikacji w `/backend/logs/`
- Użyj narzędzi deweloperskich przeglądarki
- Sprawdź odpowiedzi API w Network tab

## Rozszerzenia

### Możliwe ulepszenia
- Import z innych formatów (JSON, XML)
- Eksport do różnych formatów
- Automatyczna synchronizacja z BrickEconomy
- Walidacja cen z zewnętrznych źródeł
- Import z plików Excel

### Integracje
- BrickEconomy API
- Bricklink API
- Rebrickable API
- Własne skrypty importu

---

**Ostatnia aktualizacja**: 2025-09-29  
**Wersja**: 1.0.0
