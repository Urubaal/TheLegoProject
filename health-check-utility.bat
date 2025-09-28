@echo off
REM Health Check Utility for LEGO Purchase Suggestion System
REM Provides comprehensive health monitoring for all services

echo 🏥 Health Check Utility - LEGO Purchase Suggestion System
echo ========================================================

set "all_healthy=1"

echo.
echo [INFO] Checking all services...

REM Check Docker
echo [1/5] Docker Engine...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Engine: RUNNING
) else (
    echo ❌ Docker Engine: NOT RUNNING
    set "all_healthy=0"
)

REM Check Redis
echo [2/5] Redis Cache...
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis: HEALTHY
) else (
    echo ❌ Redis: UNHEALTHY or NOT RUNNING
    set "all_healthy=0"
)

REM Check Database
echo [3/5] PostgreSQL Database...
docker-compose exec -T database pg_isready -U lego_user -d lego_purchase_system >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database: HEALTHY
) else (
    echo ❌ Database: UNHEALTHY or NOT RUNNING
    set "all_healthy=0"
)

REM Check Backend
echo [4/5] Backend API...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend: HEALTHY
) else (
    echo ❌ Backend: UNHEALTHY or NOT RUNNING
    set "all_healthy=0"
)

REM Check Frontend
echo [5/5] Frontend...
curl -s http://localhost:5500 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: HEALTHY
) else (
    echo ❌ Frontend: UNHEALTHY or NOT RUNNING
    set "all_healthy=0"
)

echo.
echo ========================================================
if "%all_healthy%"=="1" (
    echo 🎉 ALL SERVICES ARE HEALTHY!
    echo ✅ System is fully operational
) else (
    echo ⚠️  SOME SERVICES ARE UNHEALTHY
    echo ❌ System needs attention
)
echo ========================================================

echo.
echo 📊 Detailed Service Status:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 📈 Resource Usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo.
echo 🔧 Troubleshooting Commands:
echo    View logs: docker-compose logs -f [service]
echo    Restart service: docker-compose restart [service]
echo    Full restart: docker-compose down && docker-compose up -d
echo    Check logs: docker-compose logs [service] --tail=50

pause

