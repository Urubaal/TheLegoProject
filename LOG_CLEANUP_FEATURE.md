# 🧹 Funkcja Automatycznego Czyszczenia Logów

## 📋 Przegląd

Dodano automatyczne czyszczenie logów starszych niż 2 dni do wszystkich skryptów startowych systemu LEGO Purchase Suggestion System. Ta funkcja pomaga utrzymać system w czystości i oszczędza miejsce na dysku.

## 🎯 Główne Funkcje

### ✅ **Automatyczne Czyszczenie**
- **Wszystkie skrypty startowe** automatycznie czyszczą stare logi
- **Domyślny okres retencji**: 2 dni
- **Konfigurowalny okres**: można zmienić na dowolną liczbę dni

### 📁 **Obsługiwane Pliki**
- `application-YYYY-MM-DD.log`
- `audit-YYYY-MM-DD.log` 
- `error-YYYY-MM-DD.log`
- Wszystkie pliki w formacie `backend/logs/*-YYYY-MM-DD.log`

### 🔧 **Integracja**
- Zintegrowane z wszystkimi skryptami startowymi
- Dostępne jako osobna komenda
- Dodane do głównego menedżera systemu

## 📊 Szczegóły Implementacji

### 1. **Dedykowany Skrypt**
```bash
cleanup-logs.bat [days]
```
- **Parametr opcjonalny**: liczba dni retencji (domyślnie 2)
- **Funkcje**: skanowanie, usuwanie, raportowanie
- **Bezpieczeństwo**: sprawdza format daty przed usunięciem

### 2. **Integracja ze Skryptami Startowymi**
Wszystkie skrypty startowe zawierają teraz:
```bash
REM Clean up log files older than 2 days
echo [INFO] Cleaning up log files older than 2 days...
call cleanup-logs.bat 2 >nul 2>&1
```

### 3. **Główny Menedżer Systemu**
Dodano nową opcję:
- **[9] 🧹 Clean Old Logs** - bezpośrednie czyszczenie logów

## 🚀 Sposoby Użytkowania

### Automatyczne (ZALECANE)
```bash
# Każdy skrypt startowy automatycznie czyści logi
start-universal.bat
quick-start-optimized.bat
start-dev-optimized.bat
start-prod-optimized.bat
```

### Manualne
```bash
# Czyszczenie z domyślnym okresem (2 dni)
cleanup-logs.bat

# Czyszczenie z niestandardowym okresem
cleanup-logs.bat 7    # 7 dni
cleanup-logs.bat 30   # 30 dni

# Przez główny menedżer
lego-system-manager.bat
# Wybierz opcję [9] 🧹 Clean Old Logs
```

## 📈 Przykład Działania

### Przed Czyszczeniem:
```
backend/logs/
├── application-2025-09-26.log  ← USUNIĘTY (starszy niż 2 dni)
├── audit-2025-09-26.log        ← USUNIĘTY (starszy niż 2 dni)
├── error-2025-09-26.log        ← USUNIĘTY (starszy niż 2 dni)
├── application-2025-09-27.log  ← ZACHOWANY
├── audit-2025-09-27.log        ← ZACHOWANY
├── error-2025-09-27.log        ← ZACHOWANY
├── application-2025-09-28.log  ← ZACHOWANY
├── audit-2025-09-28.log        ← ZACHOWANY
└── error-2025-09-28.log        ← ZACHOWANY
```

### Po Czyszczeniu:
```
backend/logs/
├── application-2025-09-27.log  ← ZACHOWANY
├── audit-2025-09-27.log        ← ZACHOWANY
├── error-2025-09-27.log        ← ZACHOWANY
├── application-2025-09-28.log  ← ZACHOWANY
├── audit-2025-09-28.log        ← ZACHOWANY
└── error-2025-09-28.log        ← ZACHOWANY
```

## 🧪 Testowanie

### Skrypt Testowy
```bash
test-log-cleanup.bat
```
- Tworzy testowe pliki logów z różnymi datami
- Testuje funkcjonalność czyszczenia
- Weryfikuje poprawność działania

### Przykład Testu:
1. Tworzy pliki z datami: 25.09, 26.09, 27.09, 28.09, 29.09
2. Uruchamia czyszczenie z okresem 2 dni
3. Sprawdza czy pliki z 25.09 i 26.09 zostały usunięte
4. Sprawdza czy pliki z 27.09, 28.09, 29.09 zostały zachowane

## 📊 Raport Czyszczenia

Skrypt generuje szczegółowy raport:
```
🧹 LOG CLEANUP REPORT
=======================================================

📊 Cleanup Summary:
   Retention period: 2 days
   Cutoff date: 2025-09-27
   Files deleted: 3
   Space freed: 2048 bytes (~0 MB)

📁 Remaining log files:
   ✅ application-2025-09-27.log
   ✅ audit-2025-09-27.log
   ✅ error-2025-09-27.log
```

## 🔧 Konfiguracja

### Zmiana Okresu Retencji
```bash
# W skryptach startowych - zmień parametr:
call cleanup-logs.bat 7  # 7 dni zamiast 2

# Lub użyj niestandardowego okresu:
cleanup-logs.bat 30      # 30 dni
```

### Wyłączenie Czyszczenia
Aby wyłączyć automatyczne czyszczenie, usuń lub zakomentuj linie:
```bash
REM Clean up log files older than 2 days
REM echo [INFO] Cleaning up log files older than 2 days...
REM call cleanup-logs.bat 2 >nul 2>&1
```

## 🛡️ Bezpieczeństwo

### Walidacja Daty
- Sprawdza format daty przed usunięciem pliku
- Ignoruje pliki niepasujące do wzorca `*-YYYY-MM-DD.log`
- Bezpieczne porównywanie dat

### Backup
- Przed usunięciem sprawdza rozmiar pliku
- Generuje raport z listą usuniętych plików
- Loguje wszystkie operacje

## 💡 Korzyści

### 🚀 **Wydajność**
- Mniej plików = szybsze skanowanie katalogu
- Mniejsza fragmentacja dysku
- Lepsze wykorzystanie cache'u systemu plików

### 💾 **Przestrzeń Dysku**
- Automatyczne oszczędzanie miejsca
- Zapobiega przepełnieniu dysku
- Konfigurowalny okres retencji

### 🧹 **Utrzymanie Systemu**
- Automatyczne zarządzanie logami
- Mniej ręcznej pracy
- Spójność między środowiskami

## 🔄 Integracja z Workflow

### Development
```bash
# Codzienne uruchamianie automatycznie czyści logi
start-dev-optimized.bat
```

### Production
```bash
# Produkcyjne uruchamianie z czyszczeniem logów
start-prod-optimized.bat
```

### Maintenance
```bash
# Ręczne czyszczenie w razie potrzeby
cleanup-logs.bat 1    # Usuń logi starsze niż 1 dzień
```

## 📞 Wsparcie

### Troubleshooting
```bash
# Sprawdź czy czyszczenie działa
test-log-cleanup.bat

# Sprawdź logi ręcznie
dir backend\logs\

# Wyczyść wszystko ręcznie
del backend\logs\*.log
```

### Monitoring
- Raporty czyszczenia w konsoli
- Logi operacji w skryptach
- Informacje o zwolnionym miejscu

---

**🎉 System automatycznego czyszczenia logów jest teraz w pełni zintegrowany i gotowy do użycia!**

