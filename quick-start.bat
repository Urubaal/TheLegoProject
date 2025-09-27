@echo off
REM LEGO Purchase Suggestion System - Quick Start Script (Windows)
REM Fastest way to get the system running

echo ⚡ Quick Start - LEGO Purchase Suggestion System
echo ================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Quick start with minimal checks
echo [INFO] Starting all services...
docker-compose up -d

REM Wait a bit for services to start
echo [INFO] Waiting for services to initialize...
timeout /t 10 /nobreak >nul

REM Quick health check
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ System is ready!
    echo.
    echo 🌐 Frontend: http://localhost:5500
    echo 🔧 Backend: http://localhost:3000
    echo.
    echo For detailed logs: docker-compose logs -f
    echo To stop: docker-compose down
) else (
    echo ⚠️  Services are starting up. Please wait a moment and check:
    echo    http://localhost:3000/api/health
    echo.
    echo For logs: docker-compose logs -f
)

pause
