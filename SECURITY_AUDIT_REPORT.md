# 🔒 Raport Audytu Bezpieczeństwa - LEGO Purchase System

**Data audytu:** 2025-09-30  
**Audytor:** AI Security Audit  
**Wersja systemu:** 1.0.0

---

## 📊 Podsumowanie Wykonawcze

### Status Ogólny: ⚠️ WYMAGA POPRAWY

**Statystyki:**
- 🔴 Krytyczne: 6 problemów
- 🟠 Średnie: 4 problemy
- 🟡 Niskie: 4 problemy
- ✅ Dobre praktyki: 8 zaimplementowanych

---

## 🚨 PROBLEMY KRYTYCZNE (Wymagają natychmiastowej uwagi)

### 1. ❌ Redis Required vs Optional - Sprzeczność w dokumentacji
**Lokalizacja:** `backend/server.js:486-488`  
**Priorytet:** KRYTYCZNY  
**Opis:** Kod wymaga Redis do startu, ale dokumentacja mówi że jest opcjonalny z fallback mode.

**Obecny kod:**
```javascript
error('Failed to establish Redis connection after all retries - REDIS IS REQUIRED');
throw new Error('Redis connection failed - system cannot start without Redis');
```

**Problem:**
- System crashuje bez Redis
- Dokumentacja (Cursor Rules, PROJECT_STATUS.md) mówi "Redis jest opcjonalny - fallback mode"
- Wprowadza w błąd użytkowników

**Rozwiązanie:**
```javascript
// Option A: Prawdziwy fallback mode (ZALECANE)
if (!await initializeRedis()) {
  warn('Redis unavailable - running in fallback mode without cache');
  // System działa dalej, ale bez cache
}

// Option B: Aktualizacja dokumentacji
// Zmienić wszędzie "Redis opcjonalny" na "Redis wymagany"
```

**Wpływ:** 🔴 Wysoki - Aplikacja nie startuje w niektórych środowiskach

---

### 2. ❌ JWT w localStorage - Podatność na XSS
**Lokalizacja:** `frontend/script.js:358, 421`  
**Priorytet:** KRYTYCZNY  
**Opis:** JWT tokeny przechowywane w localStorage są podatne na kradzież przez XSS.

**Obecny kod:**
```javascript
localStorage.setItem('authToken', data.data.token);
localStorage.setItem('brickBuyToken', data.data.token);
```

**Zagrożenia:**
- XSS attack może ukraść token
- Brak ochrony przed CSRF
- localStorage dostępne dla wszystkich skryptów

**Rozwiązanie:**
```javascript
// Option A: httpOnly Cookies (NAJLEPSZE)
// Backend:
res.cookie('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24h
});

// Frontend: Cookie jest automatycznie wysyłane
fetch(url, { credentials: 'include' })

// Option B: SessionStorage z dodatkowymi zabezpieczeniami
sessionStorage.setItem('authToken', encryptToken(token));
```

**Wpływ:** 🔴 Krytyczny - Możliwa kradzież sesji użytkownika

---

### 3. ❌ Hardcoded API URL w Frontend
**Lokalizacja:** `frontend/script.js:24`  
**Priorytet:** WYSOKI  
**Opis:** API URL jest hardcoded, co uniemożliwia deployment.

**Obecny kod:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Problem:**
- Nie działa w produkcji
- Wymaga modyfikacji kodu przy każdym deployment
- Mixed content errors (http vs https)

**Rozwiązanie:**
```javascript
// config.js
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  // Produkcja - użyj tego samego hosta
  return `${window.location.protocol}//${window.location.host}/api`;
};

const API_BASE_URL = getApiUrl();
```

**Wpływ:** 🔴 Wysoki - Blokuje deployment produkcyjny

---

### 4. ❌ Brak CSRF Protection
**Lokalizacja:** Backend routes  
**Priorytet:** KRYTYCZNY  
**Opis:** Wszystkie POST/PUT/DELETE endpointy są podatne na CSRF.

**Problem:**
- Brak tokenów CSRF
- Atakujący może wykonać akcje w imieniu użytkownika
- Szczególnie niebezpieczne dla: delete account, change password

**Rozwiązanie:**
```javascript
// backend/server.js
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Dodać do routes
app.use('/api/', csrfProtection);

// Lub użyć SameSite cookies (prostsze)
res.cookie('authToken', token, {
  sameSite: 'strict', // Zapobiega CSRF
  httpOnly: true
});
```

**Wpływ:** 🔴 Krytyczny - Możliwe przejęcie konta

---

### 5. ❌ Słaba walidacja haseł
**Lokalizacja:** `backend/middleware/validation.js:9-13`  
**Priorytet:** WYSOKI  
**Opis:** Walidacja hasła jest zbyt słaba.

**Obecny kod:**
```javascript
.isLength({ min: 8 })
.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
```

**Braki:**
- ❌ Brak znaków specjalnych
- ❌ Brak maksymalnej długości (DoS przez długie hasła)
- ❌ Brak sprawdzania popularnych haseł (password123, qwerty)
- ❌ Brak sprawdzania powtórzeń (aaaaaaa8A)

**Rozwiązanie:**
```javascript
.isLength({ min: 10, max: 128 })
.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
.withMessage('Password must contain lowercase, uppercase, number and special character')
.custom((value) => {
  const commonPasswords = ['password', 'qwerty', '123456', 'password123'];
  if (commonPasswords.some(p => value.toLowerCase().includes(p))) {
    throw new Error('Password too common');
  }
  return true;
})
```

**Wpływ:** 🟠 Średni - Ułatwia brute force attack

---

### 6. ❌ Stack Trace w Error Messages
**Lokalizacja:** `backend/middleware/errorHandler.js:85-88`  
**Priorytet:** ŚREDNI  
**Opis:** Stack trace ujawnia strukturę aplikacji.

**Obecny kod:**
```javascript
...(process.env.NODE_ENV === 'development' && { 
  stack: error.stack,
  details: error.message 
})
```

**Problem:**
- Atakujący widzi ścieżki plików
- Może odkryć użyte biblioteki i wersje
- Łatwiej znaleźć exploity

**Rozwiązanie:**
```javascript
// NIGDY nie wysyłaj stack trace do klienta
// Zamiast tego loguj po stronie serwera
logError('Application error', {
  error: error.message,
  stack: error.stack, // Tylko w logach
  ...
});

// Do klienta tylko generic message
res.status(statusCode).json({
  success: false,
  error: error.isOperational ? error.message : 'Internal Server Error',
  requestId: req.id // Dla supportu
});
```

**Wpływ:** 🟠 Średni - Information disclosure

---

## 🟠 PROBLEMY ŚREDNIEJ WAGI

### 7. ⚠️ Brak Rate Limiting na Password Reset
**Lokalizacja:** `backend/routes/auth.js`  
**Opis:** Endpoint `/auth/forgot-password` może być spamowany.

**Rozwiązanie:**
```javascript
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // max 3 requests per email per hour
  keyGenerator: (req) => req.body.email, // Per email, nie IP
  message: 'Too many password reset attempts. Try again later.'
});

app.post('/api/auth/forgot-password', passwordResetLimiter, ...);
```

---

### 8. ⚠️ Brak Query Timeouts
**Lokalizacja:** `backend/models/User.js`  
**Opis:** Database queries mogą wisieć w nieskończoność.

**Rozwiązanie:**
```javascript
// Dodać do każdego query
const result = await pool.query({
  text: query,
  values: values,
  statement_timeout: 5000 // 5s max
});
```

---

### 9. ⚠️ Console.log w Production
**Lokalizacja:** `backend/models/User.js:77-79, 133-139`  
**Opis:** console.log powinien być zastąpiony structured logging.

**Rozwiązanie:**
```javascript
// Zamiast console.log
info('Creating user', { email: userData.email }); // NIE loguj hasła!

// Zamiast console.error
error('Error updating last_login', { error: err.message, userId: id });
```

---

### 10. ⚠️ Docker Dev Settings w Production Config
**Lokalizacja:** `docker-compose.yml:59-62`  
**Opis:** Niebezpieczne ustawienia PostgreSQL w production.

**Rozwiązanie:**
```yaml
# Usunąć z docker-compose.yml (to jest dev!)
# POSTGRES_FSYNC: "off"  # ❌ NIGDY w produkcji
# POSTGRES_SYNCHRONOUS_COMMIT: "off"  # ❌ Utrata danych!

# Lub dodać warunek
environment:
  POSTGRES_FSYNC: ${POSTGRES_FSYNC:-on}  # Default: on (safe)
```

---

## 🟡 PROBLEMY NISKIEJ WAGI (Optymalizacje)

### 11. 📌 Pool Export Broken
**Lokalizacja:** `backend/server.js:552`

```javascript
// Problem: User.js nie eksportuje pool
module.exports.pool = require('./models/User').pool || null; // Zawsze null

// Rozwiązanie:
// backend/models/User.js
module.exports = User;
module.exports.pool = pool;
```

---

### 12. 📌 Email Verification Nie Używana
**Opis:** is_active flag nie jest sprawdzany przy logowaniu.

**Rozwiązanie:**
```javascript
// W authService.js
const user = await User.findByEmail(email);

if (!user.is_active) {
  throw new AppError('Please verify your email first', 403);
}
```

---

### 13. 📌 Duplikacja Walidacji Frontend/Backend
**Opis:** Regex może rozjechać się między frontend i backend.

**Rozwiązanie:**
```javascript
// Stworzyć shared validation rules
// shared/validation-rules.js (używane przez backend i frontend)
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
export const PASSWORD_MIN_LENGTH = 10;
```

---

### 14. 📌 Brak Content Security Policy dla Inline Scripts
**Lokalizacja:** `frontend/nginx.conf:60`

**Problem:**
```nginx
script-src 'self' 'unsafe-inline' 'unsafe-eval';  # ❌ Zbyt permissive
```

**Rozwiązanie:**
```nginx
# Użyć nonce lub hash
script-src 'self' 'nonce-{random}';
# I dodać nonce do każdego <script>
```

---

## ✅ DOBRE PRAKTYKI ZAIMPLEMENTOWANE

1. ✅ Parametryzowane zapytania SQL (PostgreSQL)
2. ✅ Helmet.js security headers
3. ✅ CORS configuration
4. ✅ Rate limiting podstawowy
5. ✅ Input validation (express-validator)
6. ✅ Structured logging (Winston)
7. ✅ Docker containerization
8. ✅ Health checks i graceful shutdown

---

## 📋 PLAN NAPRAWCZY

### Faza 1: KRYTYCZNE (Natychmiast)
- [ ] Naprawić Redis fallback mode lub zaktualizować dokumentację
- [ ] Przenieść JWT z localStorage do httpOnly cookies
- [ ] Dodać dynamiczny API URL detection
- [ ] Zaimplementować CSRF protection
- [ ] Wzmocnić walidację haseł
- [ ] Usunąć stack traces z error responses

### Faza 2: ŚREDNIE (W tym tygodniu)
- [ ] Dodać rate limiting na password reset
- [ ] Dodać query timeouts
- [ ] Zastąpić console.log structured logging
- [ ] Rozdzielić Docker dev/prod configs

### Faza 3: OPTYMALIZACJE (W tym miesiącu)
- [ ] Naprawić pool export
- [ ] Zaimplementować email verification flow
- [ ] Stworzyć shared validation rules
- [ ] Wzmocnić CSP headers

---

## 🔗 Referencje

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

**Następne kroki:** Zaczynam implementację poprawek w kolejności priorytetu.

---
*Wygenerowano automatycznie przez AI Security Audit - 2025-09-30*
