@echo off
echo 🚀 Aktualizacja dokumentacji...
node update-docs.js
if %ERRORLEVEL% EQU 0 (
    echo ✅ Dokumentacja zaktualizowana pomyślnie!
    echo 📝 Sprawdź zmiany w:
    echo    - PROJECT_STATUS.md
    echo    - CHANGELOG.md
    echo    - .cursorrules
) else (
    echo ❌ Błąd podczas aktualizacji dokumentacji
    exit /b 1
)
