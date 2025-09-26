# Instrukcje Uruchomienia Profilu Użytkownika

## 🚀 Nowe Funkcjonalności

Dodano kompletną funkcjonalność profilu użytkownika z zarządzaniem kolekcją LEGO:

### ✨ Funkcje Profilu
- **Dane osobiste**: imię, nazwa użytkownika, kraj
- **Statystyki kolekcji**: liczba zestawów, klocków, minifigurek
- **Zarządzanie kolekcją**: dodawanie/edytowanie/usuwanie zestawów i minifigurek
- **Lista życzeń**: zestawy i minifigurki do kupienia
- **Integracja z BricksEconomy**: automatyczne pobieranie informacji o zestawach

## 📋 Wymagania

### Backend
- Node.js 16+
- PostgreSQL 12+
- Wszystkie istniejące zależności + `axios`

### Frontend
- Nowoczesna przeglądarka z obsługą ES6+
- Font Awesome (już załadowane)

## 🛠️ Instalacja

### 1. Zaktualizuj zależności backendu
```bash
cd backend
npm install axios
```

### 2. Uruchom migrację bazy danych
```bash
cd backend
node migrations/add_profile_fields.js
```

### 3. Uruchom serwer backendu
```bash
cd backend
npm run dev
```

### 4. Uruchom frontend
```bash
cd frontend
# Użyj Live Server lub podobnego narzędzia
# Lub otwórz dashboard.html w przeglądarce
```

## 🗄️ Nowe Tabele w Bazie Danych

### Tabele kolekcji użytkownika:
- `user_owned_sets` - posiadane zestawy
- `user_wanted_sets` - poszukiwane zestawy  
- `user_owned_minifigs` - posiadane minifigurki
- `user_wanted_minifigs` - poszukiwane minifigurki

### Rozszerzona tabela users:
- `username` - nazwa użytkownika (nie unikalna)
- `display_name` - wyświetlana nazwa użytkownika
- `country` - kraj użytkownika
- `email` - unikalny email użytkownika

## 🔧 Nowe API Endpoints

### Profil użytkownika
- `GET /api/profile` - pobierz profil użytkownika
- `PUT /api/profile` - zaktualizuj profil użytkownika

### Kolekcja
- `GET /api/profile/collection` - pobierz kolekcję użytkownika
- `POST /api/profile/collection/sets` - dodaj zestaw do kolekcji
- `POST /api/profile/collection/wanted-sets` - dodaj zestaw do listy życzeń
- `POST /api/profile/collection/minifigs` - dodaj minifigurkę do kolekcji
- `POST /api/profile/collection/wanted-minifigs` - dodaj minifigurkę do listy życzeń

### Wyszukiwanie
- `GET /api/profile/search/sets?q=SET_NUMBER` - wyszukaj zestaw
- `GET /api/profile/search/minifigs?q=NAME` - wyszukaj minifigurkę

### Zarządzanie elementami
- `PUT /api/profile/collection/:type/:id` - edytuj element kolekcji
- `DELETE /api/profile/collection/:type/:id` - usuń element kolekcji

## 🎨 Nowe Strony Frontend

### Dashboard (`dashboard.html`)
- **Profil**: wyświetlanie danych użytkownika i statystyk
- **Kolekcja**: zarządzanie posiadanymi zestawami i minifigurkami
- **Lista życzeń**: zarządzanie poszukiwanymi zestawami i minifigurkami

### Funkcje interfejsu:
- Responsywny design
- Modals do dodawania elementów
- Wyszukiwanie zestawów przez numer
- Automatyczne pobieranie danych z BricksEconomy
- Statystyki w czasie rzeczywistym

## 🔍 Jak używać

### 1. Rejestracja/Logowanie
- Po rejestracji użytkownik zostanie przekierowany do dashboard
- Podczas rejestracji automatycznie generowany jest username z emaila (jeśli nie podano)
- Email musi być unikalny, username może być duplikowany

### 2. Edycja profilu
- Kliknij "Edytuj Profil" w sekcji profilu
- Uzupełnij dane osobiste i kraj

### 3. Dodawanie zestawów do kolekcji
- Przejdź do sekcji "Kolekcja"
- Kliknij "Dodaj Zestaw"
- Wprowadź numer zestawu (np. 75192)
- Kliknij "Wyszukaj" aby automatycznie pobrać dane
- Uzupełnij dodatkowe informacje

### 4. Dodawanie do listy życzeń
- Przejdź do sekcji "Lista życzeń"
- Kliknij "Dodaj Zestaw"
- Wprowadź numer zestawu i ustaw priorytet

## 🐛 Rozwiązywanie problemów

### Błąd połączenia z BricksEconomy
- API może być czasowo niedostępne
- Aplikacja będzie działać bez automatycznego pobierania danych
- Można ręcznie wprowadzić nazwę zestawu

### Błąd migracji bazy danych
- Sprawdź połączenie z PostgreSQL
- Upewnij się, że masz uprawnienia do tworzenia tabel
- Sprawdź logi w konsoli

### Problemy z autoryzacją
- Sprawdź czy token jest zapisany w localStorage
- Wyloguj się i zaloguj ponownie
- Sprawdź czy backend działa na porcie 3000

## 📝 Uwagi

- Wszystkie ceny są domyślnie w PLN
- Wyszukiwanie zestawów działa przez numer (np. 75192)
- Minifigurki można dodawać po nazwie
- Dane są cache'owane przez 24h dla lepszej wydajności

## 🔄 Następne kroki

Możliwe rozszerzenia:
- Edycja elementów kolekcji
- Import/eksport kolekcji
- Integracja z innymi API LEGO
- Zaawansowane statystyki i wykresy
- Powiadomienia o zmianach cen
