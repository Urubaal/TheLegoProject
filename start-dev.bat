@echo off
REM LEGO Purchase Suggestion System - Development Startup Script (Windows)
REM Optimized for fast development startup

echo 🚀 Starting LEGO Purchase Suggestion System (Development Mode)
echo ==============================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Clean up any existing containers
echo [INFO] Cleaning up existing containers...
docker-compose down --remove-orphans >nul 2>&1

REM Remove unused Docker resources
echo [INFO] Cleaning up unused Docker resources...
docker system prune -f >nul 2>&1

REM Start services in optimized order
echo [INFO] Starting Redis cache...
docker-compose up -d redis

echo [INFO] Starting PostgreSQL database...
docker-compose up -d database

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
timeout /t 30 /nobreak >nul

REM Start backend
echo [INFO] Starting backend API...
docker-compose up -d backend

REM Wait for backend to be ready
echo [INFO] Waiting for backend to be ready...
timeout /t 30 /nobreak >nul

REM Start frontend
echo [INFO] Starting frontend...
docker-compose up -d frontend

REM Wait for frontend to be ready
echo [INFO] Waiting for frontend to be ready...
timeout /t 15 /nobreak >nul

REM Show status
echo.
echo ==============================================================
echo ✅ All services started successfully!
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:5500
echo    Backend API: http://localhost:3000
echo    Health Check: http://localhost:3000/api/health
echo.
echo 🗄️  Database:
echo    Host: localhost
echo    Port: 5432
echo    Database: lego_purchase_system
echo    User: lego_user
echo.
echo 🔴 Redis:
echo    Host: localhost
echo    Port: 6379
echo.
echo 📊 Useful commands:
echo    View logs: docker-compose logs -f [service]
echo    Stop all: docker-compose down
echo    Restart: docker-compose restart [service]
echo    Shell access: docker-compose exec [service] sh
echo.
echo ==============================================================

REM Show running containers
echo [INFO] Running containers:
docker-compose ps

echo.
echo ✅ Development environment is ready! 🎉
pause
