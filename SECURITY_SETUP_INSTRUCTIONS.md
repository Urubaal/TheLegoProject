# 🔐 Instrukcje bezpieczeństwa - Konfiguracja haseł

## ⚠️ WAŻNE - Konfiguracja bezpieczeństwa

Aplikacja została zaktualizowana pod kątem bezpieczeństwa. **WSZYSTKIE HASŁA MUSZĄ BYĆ USTAWIONE W PLIKU .env!**

## 🚀 Szybka konfiguracja

### 1. Utwórz plik .env
```bash
cp env.example .env
```

### 2. Ustaw bezpieczne hasła w pliku .env

**OBOWIĄZKOWE zmienne do zmiany:**

```env
# 🔑 HASŁA BAZY DANYCH - ZMIEŃ NA BEZPIECZNE!
POSTGRES_PASSWORD=TwojeBezpieczneHaslo123!
JWT_SECRET=TwojJWTSecretKlucz2024!@#$%^&*()_+{}[]|\\:";'<>?,./~`

# 📧 KONFIGURACJA EMAIL - ZMIEŃ NA SWOJE!
EMAIL_USER=twoj-email@gmail.com
EMAIL_PASS=twoje-haslo-aplikacji-gmail

# 🔴 REDIS (opcjonalnie)
REDIS_PASSWORD=TwojeRedisHaslo123!
```

### 3. Uruchom aplikację
```bash
docker-compose up -d
```

## 🛡️ Bezpieczeństwo haseł

### Wymagania dla haseł:
- **POSTGRES_PASSWORD**: Minimum 12 znaków, zawierać cyfry, wielkie i małe litery, znaki specjalne
- **JWT_SECRET**: Minimum 32 znaki, unikalny i losowy
- **EMAIL_PASS**: Hasło aplikacji Gmail (nie hasło do konta!)

### Przykłady bezpiecznych haseł:
```env
POSTGRES_PASSWORD=MySecureDb2024!@#$%^&*()_+{}[]|\\:";'<>?,./~`
JWT_SECRET=JWTSecretKey2024!@#$%^&*()_+{}[]|\\:";'<>?,./~`RandomString123
EMAIL_PASS=abcd efgh ijkl mnop  # Hasło aplikacji Gmail (16 znaków)
```

## 🔧 Rozwiązywanie problemów

### Błąd: "POSTGRES_PASSWORD is not set"
```bash
# Sprawdź czy plik .env istnieje
ls -la .env

# Jeśli nie istnieje, utwórz go
cp env.example .env
# Następnie edytuj .env i ustaw hasła
```

### Błąd połączenia z bazą danych
1. Sprawdź czy hasło w `.env` jest poprawne
2. Zatrzymaj kontenery: `docker-compose down`
3. Usuń wolumeny: `docker-compose down -v`
4. Uruchom ponownie: `docker-compose up -d`

### Sprawdzenie konfiguracji
```bash
# Sprawdź czy zmienne są ustawione
docker-compose config
```

## 🚨 Ostrzeżenia bezpieczeństwa

### ❌ NIE RÓB TEGO:
- Nie commituj pliku `.env` do Git
- Nie udostępniaj haseł w kodzie
- Nie używaj domyślnych haseł w produkcji
- Nie zostawiaj pustych wartości w .env

### ✅ DOBRE PRAKTYKI:
- Używaj silnych, unikalnych haseł
- Regularnie zmieniaj hasła
- Używaj menedżera haseł
- Monitoruj logi bezpieczeństwa

## 📋 Lista sprawdzeń bezpieczeństwa

- [ ] Plik `.env` został utworzony
- [ ] Wszystkie hasła zostały zmienione z domyślnych
- [ ] Plik `.env` jest w `.gitignore`
- [ ] Hasła są silne (12+ znaków, znaki specjalne)
- [ ] JWT_SECRET jest unikalny
- [ ] EMAIL_PASS to hasło aplikacji Gmail

## 🔍 Weryfikacja bezpieczeństwa

Po uruchomieniu aplikacji sprawdź:

1. **Nagłówki HTTP** - wersja nginx nie powinna być widoczna:
```bash
curl -I http://localhost:5500
# Powinno pokazać: Server: nginx (bez wersji)
```

2. **Logi aplikacji** - brak błędów bezpieczeństwa:
```bash
docker-compose logs backend | grep -i error
```

3. **Połączenie z bazą** - sprawdź czy backend łączy się poprawnie:
```bash
docker-compose logs backend | grep -i "database\|postgres"
```

---
**Status bezpieczeństwa: ✅ UKRYTA WERSJA NGINX + BEZPIECZNE HASŁA**

*Ostatnia aktualizacja: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
