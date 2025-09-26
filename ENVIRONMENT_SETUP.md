# Environment Setup Guide

## Pliki konfiguracyjne

### 1. `env.example` 
- **Przeznaczenie:** Szablon z przykładowymi wartościami konfiguracyjnymi
- **Status:** Zawarty w repozytorium
- **Zawartość:** Wszystkie zmienne środowiskowe z przykładowymi wartościami

### 2. `.env`
- **Przeznaczenie:** Rzeczywisty plik konfiguracyjny dla lokalnego środowiska
- **Status:** NIE jest zawarty w repozytorium (w .gitignore)
- **Zawartość:** Twoje rzeczywiste wartości konfiguracyjne

## Konfiguracja dla developmentu

### Krok 1: Skopiuj szablon
```bash
copy env.example .env
```

### Krok 2: Dostosuj konfigurację
Edytuj plik `.env` i ustaw odpowiednie wartości:

```env
# Backend Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please

# Frontend Configuration  
FRONTEND_URL=http://localhost:8080

# Database Configuration
DATABASE_URL=postgresql://lego_user@localhost:5432/lego_purchase_system
POSTGRES_DB=lego_purchase_system
POSTGRES_USER=lego_user
# POSTGRES_PASSWORD= (no password required - using trust authentication)

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

## Uruchomienie

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   node server.js
   ```

## Porty domyślne

- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:8080
- **Database:** localhost:5432

## Bezpieczeństwo

- **NIGDY** nie commituj pliku `.env` do repozytorium
- Używaj silnych haseł w środowisku produkcyjnym
- Zmień domyślne klucze JWT w środowisku produkcyjnym
