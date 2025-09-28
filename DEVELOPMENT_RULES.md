# Zasady rozwoju projektu LEGO Collection Manager

## 🔍 **Zasada weryfikacji bazy danych przy zmianach pól**

**ZAWSZE** przy dodawaniu, usuwaniu lub modyfikowaniu pól w formularzach/funkcjach:

### 1. **Sprawdź schemat bazy danych**
- Przeanalizuj tabele w `lego_database_schema.sql`
- Sprawdź czy kolumny istnieją w odpowiednich tabelach
- Zweryfikuj constraints i typy danych

### 2. **Utwórz migrację jeśli potrzeba**
- Dodaj brakujące kolumny przez migracje SQL
- Zaktualizuj constraints (np. CHECK constraints)
- Dodaj indeksy dla nowych pól jeśli potrzebne

### 3. **Uruchom migrację**
- Wykonaj migrację na bazie danych
- Sprawdź czy zmiany zostały zastosowane poprawnie

### 4. **Zaktualizuj backend**
- Sprawdź czy modele obsługują nowe pola
- Zaktualizuj kontrolery i serwisy
- Przetestuj endpointy API

### 5. **Dopiero wtedy implementuj frontend**
- Dodaj pola do formularzy HTML
- Zaktualizuj JavaScript do obsługi nowych pól
- Dodaj style CSS dla nowych elementów

## ⚠️ **Częste błędy do unikania:**

- ❌ Implementowanie frontendu bez sprawdzenia bazy danych
- ❌ Zapominanie o aktualizacji constraints
- ❌ Nie testowanie czy backend obsługuje nowe pola
- ❌ Brak migracji dla nowych kolumn

## ✅ **Przykład poprawnego procesu:**

1. **Problem**: Użytkownik chce dodać pole "data zakupu"
2. **Sprawdzenie**: Tabela `user_owned_sets` nie ma kolumny `purchase_date`
3. **Migracja**: `ALTER TABLE user_owned_sets ADD COLUMN purchase_date DATE;`
4. **Backend**: Sprawdzenie czy `updateOwnedSet()` obsługuje nowe pole
5. **Frontend**: Dodanie pola do formularza i obsługi JavaScript

## 🎯 **Korzyści:**

- Zapobiega błędom typu "nie można edytować"
- Zapewnia spójność między frontendem a backendem
- Ułatwia debugowanie problemów
- Przyspiesza rozwój aplikacji

---

**Pamiętaj**: Baza danych to fundament aplikacji - zawsze sprawdź ją pierwszej!
