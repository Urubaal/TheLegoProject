# Frontend - System Logowania

Frontend aplikacji logowania z nowoczesnym interfejsem użytkownika.

## 📁 Pliki

- `index.html` - Główna strona logowania
- `styles.css` - Style CSS z responsywnym designem
- `script.js` - Logika JavaScript i komunikacja z API

## 🎨 Funkcjonalności UI

### Formularze
- **Logowanie** - email i hasło z walidacją
- **Reset hasła** - wysyłanie linku na email
- **Odzyskiwanie hasła** - ustawianie nowego hasła

### Interakcje
- Walidacja w czasie rzeczywistym
- Przełączniki widoczności hasła
- Animacje ładowania
- Powiadomienia o sukcesie/błędach
- Płynne przejścia między formularzami

### Responsywność
- Działa na desktop, tablet i mobile
- Elastyczny layout
- Optymalizacja dla różnych rozdzielczości

## 🔧 Konfiguracja

### API Endpoint
W pliku `script.js` ustaw URL backendu:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Funkcje
- Automatyczne sprawdzanie statusu logowania
- Zapamiętywanie użytkownika
- Obsługa tokenów JWT
- Przekierowania po logowaniu

## 🚀 Uruchomienie

1. **Otwórz plik `index.html` w przeglądarce**
2. **Lub uruchom lokalny serwer:**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server . -p 8000
   ```

## 🎯 Użycie

1. **Logowanie:** Wprowadź email i hasło
2. **Reset hasła:** Kliknij "Zapomniałeś hasła?" i wprowadź email
3. **Nowe hasło:** Kliknij link z emaila i ustaw nowe hasło

## 🔄 Integracja z Backendem

Frontend komunikuje się z backendem przez REST API:
- `POST /api/auth/login` - logowanie
- `POST /api/auth/forgot-password` - reset hasła
- `POST /api/auth/reset-password` - nowe hasło
- `GET /api/auth/profile` - profil użytkownika

## 📱 Responsywność

- **Desktop:** Pełny layout z efektami hover
- **Tablet:** Dostosowany do średnich ekranów
- **Mobile:** Stosowany layout, duże przyciski

## 🎨 Styling

- Nowoczesny gradient background
- Smooth animations i transitions
- Material Design inspirations
- Accessibility-friendly colors
