@echo off
REM LEGO Purchase Suggestion System - OPTIMIZED Quick Start Script (Windows)
REM Ultra-fast startup with intelligent health checks

echo ⚡ OPTIMIZED Quick Start - LEGO Purchase Suggestion System
echo =========================================================

REM Check if Docker is running
echo [1/6] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check if Docker Compose is available
echo [2/6] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)
echo ✅ Docker Compose is available

REM Clean up any existing containers and old logs quickly
echo [3/6] Cleaning up existing containers and old logs...
docker-compose down --remove-orphans >nul 2>&1

REM Clean up log files older than 2 days
echo [INFO] Cleaning up log files older than 2 days...
call cleanup-logs.bat 2 >nul 2>&1

REM Start Redis and Database in parallel (they don't depend on each other)
echo [4/6] Starting infrastructure services (Redis + Database)...
start /B docker-compose up -d redis database

REM Intelligent wait for database with actual connection test
echo [5/6] Waiting for database to be ready...
:wait_database
docker-compose exec -T database pg_isready -U lego_user -d lego_purchase_system >nul 2>&1
if %errorlevel% neq 0 (
    echo    Database still starting... (checking every 2 seconds)
    timeout /t 2 /nobreak >nul
    goto wait_database
)
echo ✅ Database is ready

REM Start Backend (depends on database)
echo [6/6] Starting Backend and Frontend...
start /B docker-compose up -d backend frontend

REM Wait for backend with intelligent health check
echo Waiting for backend to be ready...
:wait_backend
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo    Backend still starting... (checking every 2 seconds)
    timeout /t 2 /nobreak >nul
    goto wait_backend
)

REM Final health check
echo.
echo 🎉 System is ready! (Total startup time optimized)
echo ==============================================================
echo 🌐 Frontend: http://localhost:5500
echo 🔧 Backend: http://localhost:3000
echo 📊 Health: http://localhost:3000/api/health
echo.
echo 📋 Running services:
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo.
echo 🚀 Quick commands:
echo    View logs: docker-compose logs -f
echo    Stop all: docker-compose down
echo    Restart: docker-compose restart [service]
echo ==============================================================

pause
