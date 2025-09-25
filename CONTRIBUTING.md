# Contributing to Authentication System

Dziękujemy za zainteresowanie projektem! Oto jak możesz przyczynić się do rozwoju systemu logowania.

## 🚀 Jak zacząć

1. **Fork** repozytorium
2. **Clone** swoje fork:
   ```bash
   git clone https://github.com/TWOJA-NAZWA/auth-system.git
   cd auth-system
   ```
3. **Utwórz branch** dla swojej funkcji:
   ```bash
   git checkout -b feature/nazwa-funkcji
   ```

## 📝 Proces rozwoju

### Backend
1. Przejdź do folderu `backend/`
2. Zainstaluj zależności: `npm install`
3. Skopiuj `env.example` do `.env` i skonfiguruj
4. Uruchom serwer: `npm run dev`

### Frontend
1. Otwórz `frontend/index.html` w przeglądarce
2. Lub uruchom lokalny serwer HTTP

## 🧪 Testowanie

Przed wysłaniem Pull Request:

1. **Backend:**
   ```bash
   cd backend
   npm test
   ```

2. **Frontend:**
   - Przetestuj wszystkie formularze
   - Sprawdź responsywność
   - Przetestuj na różnych przeglądarkach

## 📋 Zasady

### Kod
- Używaj **angielskich komentarzy** w kodzie
- **Polskie** nazwy zmiennych i funkcji są OK
- Zgodność z istniejącym stylem kodu
- Dodaj testy dla nowych funkcji

### Commits
- Używaj konwencji: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- Przykłady:
  - `feat: add user registration endpoint`
  - `fix: resolve password validation bug`
  - `docs: update API documentation`

### Pull Requests
1. Opisz co robi PR
2. Wymień zmiany
3. Dodaj screenshoty jeśli dotyczy UI
4. Upewnij się, że kod się kompiluje

## 🐛 Zgłaszanie błędów

Użyj szablonu Issue:
- **Opis problemu**
- **Kroki do reprodukcji**
- **Oczekiwane vs rzeczywiste zachowanie**
- **Środowisko** (OS, przeglądarka, wersja Node.js)

## ✨ Propozycje funkcji

Przed implementacją:
1. Sprawdź czy nie ma już podobnego Issue
2. Opisz funkcję szczegółowo
3. Wyjaśnij korzyści
4. Rozważ wpływ na istniejący kod

## 📞 Pomoc

- Otwórz Issue z pytaniem
- Sprawdź dokumentację w README.md
- Przejrzyj istniejące Issues

## 🎯 Obszary do rozwoju

- [ ] Dodanie bazy danych (MongoDB/PostgreSQL)
- [ ] Testy jednostkowe i integracyjne
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Dodanie 2FA
- [ ] Social login (Google, Facebook)
- [ ] Dashboard użytkownika
- [ ] Admin panel

Dziękujemy za wkład w projekt! 🎉
