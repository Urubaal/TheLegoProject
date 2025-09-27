@echo off
REM LEGO Purchase Suggestion System - Stop Script (Windows)
REM Gracefully stops all services

echo 🛑 Stopping LEGO Purchase Suggestion System
echo =============================================

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed.
    exit /b 1
)

REM Stop services gracefully
echo [INFO] Stopping all services...
docker-compose down

REM Remove orphaned containers
echo [INFO] Removing orphaned containers...
docker-compose down --remove-orphans >nul 2>&1

REM Ask about cleanup
set /p cleanup="Do you want to clean up unused Docker resources? (y/N): "
if /i "%cleanup%"=="y" (
    echo [INFO] Cleaning up unused Docker resources...
    docker system prune -f
    echo ✅ Docker cleanup completed
)

echo.
echo ✅ All services stopped successfully! 🎉
pause
