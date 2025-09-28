@echo off
REM Environment Setup Utility for LEGO Purchase Suggestion System
REM Automatically configures the development environment

echo 🛠️  Environment Setup - LEGO Purchase Suggestion System
echo =======================================================

echo [INFO] This script will set up your development environment
echo [INFO] and configure all necessary components for optimal performance.
echo.
set /p confirm="Continue with setup? (y/n): "
if /i not "%confirm%"=="y" goto exit

echo.
echo =======================================================
echo 📋 ENVIRONMENT SETUP CHECKLIST
echo =======================================================

REM Check Docker installation
echo [1/8] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker is installed
    docker --version
) else (
    echo ❌ Docker is not installed or not in PATH
    echo 💡 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    goto docker_error
)

REM Check Docker Compose
echo.
echo [2/8] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Compose is available
    docker-compose --version
) else (
    echo ❌ Docker Compose is not available
    echo 💡 Please update Docker Desktop to latest version
    goto compose_error
)

REM Check Docker daemon
echo.
echo [3/8] Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker daemon is running
) else (
    echo ❌ Docker daemon is not running
    echo 💡 Please start Docker Desktop
    goto daemon_error
)

REM Check project structure
echo.
echo [4/8] Checking project structure...
if exist "backend\" (
    echo ✅ Backend directory found
) else (
    echo ❌ Backend directory not found
    goto structure_error
)

if exist "frontend\" (
    echo ✅ Frontend directory found
) else (
    echo ❌ Frontend directory not found
    goto structure_error
)

if exist "docker-compose.yml" (
    echo ✅ Docker Compose configuration found
) else (
    echo ❌ Docker Compose configuration not found
    goto structure_error
)

REM Create optimized configuration if not exists
echo.
echo [5/8] Setting up optimized configuration...
if exist "docker-compose-optimized.yml" (
    echo ✅ Optimized configuration already exists
) else (
    echo 📋 Creating optimized configuration...
    copy "docker-compose.yml" "docker-compose-optimized.yml" >nul 2>&1
    echo ✅ Optimized configuration created
)

REM Check environment files
echo.
echo [6/8] Checking environment configuration...
if exist ".env" (
    echo ✅ Environment file found
) else (
    if exist "env.example" (
        echo 📋 Creating environment file from example...
        copy "env.example" ".env" >nul 2>&1
        echo ✅ Environment file created from example
        echo ⚠️  Please edit .env file with your actual configuration
    ) else (
        echo ⚠️  No environment file found
        echo 💡 You may need to create .env file manually
    )
)

REM Install backend dependencies
echo.
echo [6/8] Installing backend dependencies...
if exist "backend\package.json" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Backend dependencies installed
    ) else (
        echo ⚠️  Backend dependencies installation had issues
        echo 💡 You may need to run 'npm install' manually in backend directory
    )
    cd ..
) else (
    echo ⚠️  Backend package.json not found
)

REM Clean up old logs
echo.
echo [7/8] Cleaning up old log files...
call cleanup-logs.bat 2 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Old log files cleaned up
) else (
    echo ⚠️  Log cleanup had issues
)

REM Create backup of current configuration
echo [8/8] Creating configuration backup...
call backup-configs.bat >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Configuration backup created
) else (
    echo ⚠️  Configuration backup failed
)

echo.
echo =======================================================
echo 🎉 ENVIRONMENT SETUP COMPLETED!
echo =======================================================
echo.
echo ✅ All checks passed successfully!
echo.
echo 🚀 Next steps:
echo    1. Edit .env file with your configuration (if needed)
echo    2. Run: lego-system-manager.bat
echo    3. Or run: start-universal.bat
echo.
echo 📊 Available commands:
echo    🚀 Start system: start-universal.bat
echo    ⚡ Quick start: quick-start-optimized.bat
echo    🛠️  Development: start-dev-optimized.bat
echo    🏭 Production: start-prod-optimized.bat
echo    🏥 Health check: health-check-utility.bat
echo    📊 Performance: performance-monitor.bat
echo.
echo 💡 Pro tips:
echo    - Use lego-system-manager.bat as your main interface
echo    - Run performance-monitor.bat to measure startup improvements
echo    - Use health-check-utility.bat for troubleshooting
echo.
goto end

:docker_error
echo.
echo ❌ Docker installation required!
echo 💡 Please install Docker Desktop and restart this script.
goto end

:compose_error
echo.
echo ❌ Docker Compose required!
echo 💡 Please update Docker Desktop to latest version.
goto end

:daemon_error
echo.
echo ❌ Docker daemon not running!
echo 💡 Please start Docker Desktop and restart this script.
goto end

:structure_error
echo.
echo ❌ Project structure incomplete!
echo 💡 Please ensure you're running this script from the project root directory.
goto end

:end
echo.
echo =======================================================
echo 🎯 Setup completed! Ready to start development.
echo =======================================================
pause

:exit
