@echo off
REM Configuration Backup Utility for LEGO Purchase Suggestion System
REM Creates timestamped backups of all configurations

echo 💾 Configuration Backup Utility - LEGO Purchase Suggestion System
echo ================================================================

REM Create backup directory with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "MIN=%dt:~10,2%"
set "BACKUP_DIR=backup-configs-%YYYY%-%MM%-%DD%-%HH%-%MIN%"

echo [INFO] Creating backup directory: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" >nul 2>&1

echo.
echo [1/5] Backing up Docker configurations...
if exist docker-compose.yml (
    copy docker-compose.yml "%BACKUP_DIR%\docker-compose.yml" >nul 2>&1
    echo ✅ docker-compose.yml backed up
) else (
    echo ⚠️  docker-compose.yml not found
)

if exist docker-compose-optimized.yml (
    copy docker-compose-optimized.yml "%BACKUP_DIR%\docker-compose-optimized.yml" >nul 2>&1
    echo ✅ docker-compose-optimized.yml backed up
) else (
    echo ⚠️  docker-compose-optimized.yml not found
)

echo.
echo [2/5] Backing up startup scripts...
for %%f in (*.bat) do (
    if exist "%%f" (
        copy "%%f" "%BACKUP_DIR%\%%f" >nul 2>&1
        echo ✅ %%f backed up
    )
)

echo.
echo [3/5] Backing up package configurations...
if exist package.json (
    copy package.json "%BACKUP_DIR%\package.json" >nul 2>&1
    echo ✅ package.json backed up
)

if exist backend\package.json (
    copy backend\package.json "%BACKUP_DIR%\backend-package.json" >nul 2>&1
    echo ✅ backend/package.json backed up
)

echo.
echo [4/5] Backing up environment files...
if exist .env (
    copy .env "%BACKUP_DIR%\.env" >nul 2>&1
    echo ✅ .env backed up
) else (
    echo ⚠️  .env not found
)

if exist env.example (
    copy env.example "%BACKUP_DIR%\env.example" >nul 2>&1
    echo ✅ env.example backed up
)

echo.
echo [5/5] Creating backup manifest...
echo # Configuration Backup Manifest > "%BACKUP_DIR%\MANIFEST.txt"
echo Backup created: %date% %time% >> "%BACKUP_DIR%\MANIFEST.txt"
echo Backup directory: %BACKUP_DIR% >> "%BACKUP_DIR%\MANIFEST.txt"
echo. >> "%BACKUP_DIR%\MANIFEST.txt"
echo ## Files backed up: >> "%BACKUP_DIR%\MANIFEST.txt"
dir "%BACKUP_DIR%" /b >> "%BACKUP_DIR%\MANIFEST.txt"
echo ✅ Backup manifest created

echo.
echo ================================================================
echo 🎉 Configuration backup completed successfully!
echo.
echo 📁 Backup location: %BACKUP_DIR%
echo 📋 Backup manifest: %BACKUP_DIR%\MANIFEST.txt
echo.
echo 📊 Backup contents:
dir "%BACKUP_DIR%" /b
echo.
echo 💡 To restore configurations:
echo    1. Copy files from %BACKUP_DIR%\ to project root
echo    2. Run switch-config.bat to choose configuration
echo    3. Use start-universal.bat to start system
echo.
echo 🔄 To create another backup:
echo    Run this script again to create a new timestamped backup
echo ================================================================

pause

