# 🔐 System Logowania - Frontend & Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)

Kompletny system logowania z funkcjonalnościami rejestracji, logowania, resetu i odzyskiwania hasła. Nowoczesny frontend z responsywnym designem i bezpieczny backend API.

## 🌟 Funkcjonalności

- ✅ **Logowanie i rejestracja** użytkowników
- ✅ **Reset hasła** przez email
- ✅ **Odzyskiwanie hasła** z tokenem bezpieczeństwa
- ✅ **Responsywny design** - działa na wszystkich urządzeniach
- ✅ **Bezpieczeństwo** - JWT, hashowanie haseł, rate limiting
- ✅ **Nowoczesny UI** z animacjami i walidacją w czasie rzeczywistym

## 📁 Struktura Projektu

```
Projekt AI/
├── frontend/                 # Aplikacja frontend (HTML, CSS, JS)
│   ├── index.html           # Główna strona logowania
│   ├── styles.css           # Style CSS
│   └── script.js            # Logika JavaScript
├── backend/                 # API Backend (Node.js/Express)
│   ├── server.js            # Główny serwer
│   ├── package.json         # Zależności Node.js
│   ├── env.example          # Przykład konfiguracji
│   ├── routes/              # Definicje tras API
│   │   └── auth.js          # Trasy autoryzacji
│   ├── controllers/         # Kontrolery
│   │   └── authController.js # Kontroler autoryzacji
│   ├── middleware/          # Middleware
│   │   ├── auth.js          # Middleware autoryzacji
│   │   └── errorHandler.js  # Obsługa błędów
│   ├── models/              # Modele danych
│   ├── utils/               # Narzędzia pomocnicze
│   │   └── emailService.js  # Serwis email
│   └── tests/               # Testy
└── README.md               # Ten plik
```

## 🚀 Szybki Start

### 1. Clone repozytorium
```bash
git clone https://github.com/TWOJA-NAZWA/auth-system.git
cd auth-system
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edytuj .env z konfiguracją
npm run dev
```

### 3. Frontend Setup
```bash
# Otwórz frontend/index.html w przeglądarce
# Lub uruchom lokalny serwer HTTP
python -m http.server 8000
```

## 📋 Wymagania

- **Node.js** 18+ 
- **npm** 8+
- **Przeglądarka** z obsługą ES6+
- **Email SMTP** (opcjonalnie dla resetu hasła)

## ⚙️ Konfiguracja

### Backend (.env)
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:8000
```

### Frontend (script.js)
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🔧 Funkcjonalności

### Frontend
- ✅ **Formularz logowania** z walidacją
- ✅ **Reset hasła** - wysyłanie linku na email
- ✅ **Odzyskiwanie hasła** - ustawianie nowego hasła
- ✅ **Responsywny design** - działa na wszystkich urządzeniach
- ✅ **Walidacja w czasie rzeczywistym**
- ✅ **Animacje i efekty wizualne**
- ✅ **Zapamiętywanie użytkownika**

### Backend API
- ✅ **POST /api/auth/register** - Rejestracja użytkownika
- ✅ **POST /api/auth/login** - Logowanie
- ✅ **POST /api/auth/forgot-password** - Reset hasła
- ✅ **POST /api/auth/reset-password** - Ustawienie nowego hasła
- ✅ **GET /api/auth/profile** - Profil użytkownika
- ✅ **POST /api/auth/logout** - Wylogowanie
- ✅ **GET /api/health** - Status serwera

### Bezpieczeństwo
- ✅ **Hashowanie haseł** (bcrypt)
- ✅ **JWT tokens** z wygaśnięciem
- ✅ **Rate limiting** - ograniczenie liczby żądań
- ✅ **CORS** - konfiguracja cross-origin
- ✅ **Helmet** - nagłówki bezpieczeństwa
- ✅ **Walidacja danych** wejściowych

## 📧 Konfiguracja Email

Aby wysyłać emaile z resetem hasła, skonfiguruj w pliku `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASS=twoje-haslo-aplikacji
EMAIL_FROM=noreply@twoja-domena.com
```

**Uwaga:** Dla Gmail użyj hasła aplikacji, nie zwykłego hasła.

## 🧪 Testowanie

### Testowanie API
```bash
# Test logowania
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test resetu hasła
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Testowanie Frontendu
1. Otwórz `frontend/index.html` w przeglądarce
2. Przetestuj wszystkie formularze
3. Sprawdź responsywność na różnych urządzeniach

## 🔄 Przepływ Aplikacji

1. **Logowanie:**
   - Użytkownik wprowadza email i hasło
   - Frontend wysyła żądanie do `/api/auth/login`
   - Backend weryfikuje dane i zwraca JWT token
   - Token jest zapisywany w localStorage

2. **Reset hasła:**
   - Użytkownik klika "Zapomniałeś hasła?"
   - Wprowadza email i wysyła formularz
   - Backend generuje token resetujący i wysyła email
   - Użytkownik klika link w emailu

3. **Odzyskiwanie hasła:**
   - Użytkownik jest przekierowany na stronę z tokenem
   - Wprowadza nowe hasło
   - Backend weryfikuje token i aktualizuje hasło

## 🛠️ Rozwój

### Dodawanie nowych funkcji
1. **Backend:** Dodaj nowe endpointy w `routes/auth.js`
2. **Frontend:** Zaktualizuj `script.js` z nowymi funkcjami
3. **Styling:** Modyfikuj `styles.css` dla nowych elementów

### Baza danych
Obecnie używana jest pamięć (in-memory storage). Aby dodać prawdziwą bazę danych:
1. Zainstaluj ORM (np. Mongoose dla MongoDB)
2. Zaktualizuj `models/` z schematami
3. Zmodyfikuj kontrolery do pracy z bazą danych

## 📝 Licencja

MIT License - możesz swobodnie używać i modyfikować kod.

## 🤝 Contributing

Zapraszamy do współpracy! Sprawdź [CONTRIBUTING.md](CONTRIBUTING.md) aby dowiedzieć się jak możesz pomóc.

## 📄 Licencja

Ten projekt jest licencjonowany na licencji MIT - zobacz [LICENSE](LICENSE) dla szczegółów.

## 🐛 Zgłaszanie błędów

Jeśli znalazłeś błąd, otwórz [Issue](https://github.com/TWOJA-NAZWA/auth-system/issues) z opisem problemu.

## ✨ Propozycje funkcji

Masz pomysł na nową funkcję? Otwórz [Feature Request](https://github.com/TWOJA-NAZWA/auth-system/issues/new/choose)!

## 🆘 Wsparcie

Jeśli masz pytania lub problemy:
1. Sprawdź [Issues](https://github.com/TWOJA-NAZWA/auth-system/issues)
2. Sprawdź logi serwera w konsoli
3. Otwórz narzędzia deweloperskie w przeglądarce
4. Upewnij się, że wszystkie zależności są zainstalowane

## 🌟 Gwiazdki

Jeśli projekt Ci się podoba, zostaw ⭐ na GitHubie!
