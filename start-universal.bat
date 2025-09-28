@echo off
REM Universal Startup Script for LEGO Purchase Suggestion System
REM Automatically detects and uses the best configuration for your environment

echo 🌟 Universal Startup - LEGO Purchase Suggestion System
echo =====================================================

REM Detect environment and choose optimal configuration
echo [1/6] Analyzing environment...

REM Check if optimized configuration exists
if exist docker-compose-optimized.yml (
    echo ✅ Optimized configuration detected
    set "USE_OPTIMIZED=1"
) else (
    echo 📋 Using standard configuration
    set "USE_OPTIMIZED=0"
)

REM Check Docker status
echo [2/6] Checking Docker environment...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check system resources (rough estimate)
echo [3/6] Checking system resources...
for /f "tokens=2 delims=:" %%a in ('systeminfo ^| findstr /C:"Total Physical Memory"') do set "MEMORY=%%a"
echo ✅ System memory detected: %MEMORY%

REM Choose startup method based on environment
if "%USE_OPTIMIZED%"=="1" (
    echo [4/6] Using OPTIMIZED startup sequence...
    goto optimized_startup
) else (
    echo [4/6] Using STANDARD startup sequence...
    goto standard_startup
)

:optimized_startup
REM Use optimized configuration
copy docker-compose.yml docker-compose-standard.yml >nul 2>&1
copy docker-compose-optimized.yml docker-compose.yml >nul 2>&1

echo [5/6] Starting services with OPTIMIZED configuration...
docker-compose down --remove-orphans >nul 2>&1

REM Clean up log files older than 2 days
echo [INFO] Cleaning up log files older than 2 days...
call cleanup-logs.bat 2 >nul 2>&1

REM Start infrastructure in parallel
start /B docker-compose up -d redis
start /B docker-compose up -d database

REM Wait for Redis
:wait_redis_opt
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_redis_opt
)

REM Wait for Database
:wait_database_opt
docker-compose exec -T database pg_isready -U lego_user -d lego_purchase_system >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_database_opt
)

REM Start application services
start /B docker-compose up -d backend frontend

REM Wait for backend
:wait_backend_opt
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_backend_opt
)

timeout /t 3 /nobreak >nul
goto show_results

:standard_startup
echo [5/6] Starting services with STANDARD configuration...
docker-compose down --remove-orphans >nul 2>&1

REM Clean up log files older than 2 days
echo [INFO] Cleaning up log files older than 2 days...
call cleanup-logs.bat 2 >nul 2>&1

REM Start services sequentially (standard way)
docker-compose up -d redis
timeout /t 5 /nobreak >nul

docker-compose up -d database
timeout /t 30 /nobreak >nul

docker-compose up -d backend
timeout /t 30 /nobreak >nul

docker-compose up -d frontend
timeout /t 15 /nobreak >nul

:show_results
echo [6/6] Verifying system status...

REM Health check
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ System health check: PASSED
) else (
    echo ⚠️  System health check: PENDING
)

echo.
echo =====================================================
echo 🎉 Universal startup completed!
if "%USE_OPTIMIZED%"=="1" (
    echo ⚡ OPTIMIZED configuration used - Faster startup!
) else (
    echo 📋 STANDARD configuration used - Reliable startup!
)
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:5500
echo    Backend: http://localhost:3000
echo    Health: http://localhost:3000/api/health
echo.
echo 📊 Service Status:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo.
echo 🚀 Quick Commands:
echo    Health check: health-check-utility.bat
echo    View logs: docker-compose logs -f
echo    Stop all: docker-compose down
echo    Switch config: switch-config.bat
echo =====================================================

pause
