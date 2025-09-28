@echo off
REM Log Cleanup Utility for LEGO Purchase Suggestion System
REM Removes log files older than specified days

echo 🧹 Log Cleanup Utility - LEGO Purchase Suggestion System
echo =======================================================

REM Set default retention period (2 days)
set "RETENTION_DAYS=2"
if not "%1"=="" set "RETENTION_DAYS=%1"

echo [INFO] Cleaning up log files older than %RETENTION_DAYS% days...
echo [INFO] Current date: %date%

REM Calculate cutoff date (simplified approach)
echo [INFO] Calculating cutoff date...
REM Use PowerShell to get the date 2 days ago
for /f "usebackq delims=" %%i in (`powershell -command "Get-Date (Get-Date).AddDays(-%RETENTION_DAYS%) -Format 'yyyy-MM-dd'"`) do set "CUTOFF_DATE=%%i"
echo [INFO] Removing logs older than: %CUTOFF_DATE%

REM Check if logs directory exists
if not exist "backend\logs\" (
    echo ❌ Logs directory not found: backend\logs\
    echo [INFO] Creating logs directory...
    mkdir "backend\logs\" >nul 2>&1
    echo ✅ Logs directory created
    goto end
)

echo.
echo [1/4] Scanning log files...
set "FILES_DELETED=0"
set "TOTAL_SIZE=0"

REM Enable delayed expansion for variables in loops
setlocal enabledelayedexpansion

REM Process each log file (only .log files, ignore .json audit files)
for %%f in (backend\logs\*.log) do (
    set "FILENAME=%%~nf"
    set "EXTENSION=%%~xf"
    
    REM Extract date from filename (format: type-YYYY-MM-DD.log)
    for /f "tokens=2 delims=-" %%a in ("!FILENAME!") do (
        set "LOG_YEAR=%%a"
    )
    for /f "tokens=3 delims=-" %%a in ("!FILENAME!") do (
        set "LOG_MONTH=%%a"
    )
    for /f "tokens=4 delims=-" %%a in ("!FILENAME!") do (
        set "LOG_DAY=%%a"
    )
    
    REM Format log date
    set "LOG_DATE=!LOG_YEAR!-!LOG_MONTH!-!LOG_DAY!"
    
    REM Compare dates (simple string comparison works for YYYY-MM-DD format)
    if "!LOG_DATE!" lss "%CUTOFF_DATE%" (
        echo    🗑️  Deleting: %%f ^(Date: !LOG_DATE!^)
        set /a "FILES_DELETED+=1"
        
        REM Get file size before deletion
        for %%s in ("%%f") do (
            set /a "TOTAL_SIZE+=%%~zs"
        )
        
        del "%%f" >nul 2>&1
        if !errorlevel! equ 0 (
            echo       ✅ Deleted successfully
        ) else (
            echo       ❌ Failed to delete
        )
    ) else (
        echo    ✅ Keeping: %%f ^(Date: !LOG_DATE!^)
    )
)

echo.
echo [2/4] Cleaning up empty log directories...
for /d %%d in (backend\logs\*) do (
    dir "%%d" /b >nul 2>&1
    if !errorlevel! neq 0 (
        echo    🗑️  Removing empty directory: %%d
        rmdir "%%d" >nul 2>&1
    )
)

echo.
echo [3/4] Cleaning up Docker logs...
echo [INFO] Cleaning up Docker container logs...
docker system prune -f --filter "until=2d" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker logs cleaned up
) else (
    echo ⚠️  Docker log cleanup had issues (Docker may not be running)
)

echo.
echo [4/4] Generating cleanup report...

REM Convert bytes to MB
set /a "SIZE_MB=%TOTAL_SIZE%/1048576"

echo.
echo =======================================================
echo 🧹 LOG CLEANUP REPORT
echo =======================================================
echo.
echo 📊 Cleanup Summary:
echo    Retention period: %RETENTION_DAYS% days
echo    Cutoff date: %CUTOFF_DATE%
echo    Files deleted: %FILES_DELETED%
echo    Space freed: %TOTAL_SIZE% bytes (~%SIZE_MB% MB)
echo.
echo 📁 Remaining log files:
if exist "backend\logs\" (
    for %%f in (backend\logs\*.log) do (
        echo    ✅ %%f
    )
    echo.
    echo 📋 Audit configuration files (preserved):
    for %%f in (backend\logs\.*-audit.json) do (
        echo    🔧 %%f
    )
) else (
    echo    📁 No log files found
)
echo.
echo 🔧 Manual cleanup commands:
echo    Clean all logs: del backend\logs\*.log
echo    Clean specific date: del backend\logs\*2025-09-26.log
echo    Clean Docker logs: docker system prune -f
echo.
echo 💡 Log cleanup is now integrated into startup scripts
echo    Run any startup script to automatically clean old logs
echo =======================================================

:end
echo.
echo ✅ Log cleanup completed!
echo 💡 To run cleanup manually: cleanup-logs.bat [days]
echo 💡 To run cleanup with different retention: cleanup-logs.bat 7
echo.
pause
