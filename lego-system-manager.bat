@echo off
REM LEGO Purchase Suggestion System - Main Manager
REM Central hub for all system operations

:main_menu
cls
echo.
echo ████████████████████████████████████████████████████████████████████████
echo ██                                                                    ██
echo ██    🚀 LEGO Purchase Suggestion System - Main Manager              ██
echo ██                                                                    ██
echo ████████████████████████████████████████████████████████████████████████
echo.
echo 🎯 QUICK ACTIONS:
echo    [1] 🚀 Start System (Universal - Auto-optimized)
echo    [2] ⚡ Quick Start (Ultra-fast)
echo    [3] 🛠️  Development Mode
echo    [4] 🏭 Production Mode
echo.
echo 🔧 SYSTEM MANAGEMENT:
echo    [5] 🏥 Health Check & Status
echo    [6] 📊 Performance Monitor
echo    [7] 🔄 Switch Configuration
echo    [8] 💾 Backup Configurations
echo    [9] 🧹 Clean Old Logs
echo.
echo 🧪 TESTING & BENCHMARKS:
echo    [10] 🏁 Benchmark Startup Performance
echo    [11] 🔍 View System Logs
echo    [12] 🛑 Stop All Services
echo.
echo 📚 HELP & INFO:
echo    [13] 📖 View Documentation
echo    [14] ❓ System Information
echo    [15] 🚪 Exit
echo.
echo ========================================================================

set /p choice="Enter your choice (1-15): "

if "%choice%"=="1" goto universal_start
if "%choice%"=="2" goto quick_start
if "%choice%"=="3" goto dev_start
if "%choice%"=="4" goto prod_start
if "%choice%"=="5" goto health_check
if "%choice%"=="6" goto performance_monitor
if "%choice%"=="7" goto switch_config
if "%choice%"=="8" goto backup_configs
if "%choice%"=="9" goto clean_logs
if "%choice%"=="10" goto benchmark
if "%choice%"=="11" goto view_logs
if "%choice%"=="12" goto stop_services
if "%choice%"=="13" goto view_docs
if "%choice%"=="14" goto system_info
if "%choice%"=="15" goto exit
goto invalid_choice

:universal_start
cls
echo 🚀 Starting Universal System Manager...
call start-universal.bat
goto main_menu

:quick_start
cls
echo ⚡ Starting Quick Start...
call quick-start-optimized.bat
goto main_menu

:dev_start
cls
echo 🛠️ Starting Development Mode...
call start-dev-optimized.bat
goto main_menu

:prod_start
cls
echo 🏭 Starting Production Mode...
call start-prod-optimized.bat
goto main_menu

:health_check
cls
echo 🏥 Running Health Check...
call health-check-utility.bat
goto main_menu

:performance_monitor
cls
echo 📊 Running Performance Monitor...
call performance-monitor.bat
goto main_menu

:switch_config
cls
echo 🔄 Opening Configuration Switcher...
call switch-config.bat
goto main_menu

:backup_configs
cls
echo 💾 Creating Configuration Backup...
call backup-configs.bat
goto main_menu

:clean_logs
cls
echo 🧹 Cleaning Old Logs...
call cleanup-logs.bat
goto main_menu

:benchmark
cls
echo 🏁 Running Startup Benchmark...
call benchmark-startup.bat
goto main_menu

:view_logs
cls
echo 🔍 Viewing System Logs...
echo.
echo 📋 Available log commands:
echo.
echo    View all logs: docker-compose logs -f
echo    View specific service: docker-compose logs -f [service]
echo    View recent logs: docker-compose logs --tail=50
echo.
echo 📊 Running containers:
docker-compose ps
echo.
echo 🔧 Log file locations:
echo    Backend logs: ./backend/logs/
echo    Docker logs: docker-compose logs
echo.
pause
goto main_menu

:stop_services
cls
echo 🛑 Stopping All Services...
echo.
echo [INFO] Stopping all Docker containers...
docker-compose down
echo.
echo [INFO] Cleaning up unused resources...
docker system prune -f
echo.
echo ✅ All services stopped and cleaned up!
echo.
pause
goto main_menu

:view_docs
cls
echo 📖 Documentation...
echo.
if exist "OPTIMIZED_STARTUP_GUIDE.md" (
    echo 📚 OPTIMIZED_STARTUP_GUIDE.md - Complete optimization guide
    echo 📋 README.md - Project overview
    echo 🔧 DEVELOPMENT_RULES.md - Development guidelines
    echo 🚀 DEPLOYMENT.md - Deployment instructions
    echo.
    echo 💡 To view documentation:
    echo    - Open OPTIMIZED_STARTUP_GUIDE.md in your text editor
    echo    - Or run: type OPTIMIZED_STARTUP_GUIDE.md
) else (
    echo 📋 README.md - Project overview
    echo 🔧 DEVELOPMENT_RULES.md - Development guidelines
    echo 🚀 DEPLOYMENT.md - Deployment instructions
)
echo.
pause
goto main_menu

:system_info
cls
echo ❓ System Information...
echo.
echo 🖥️  System Details:
echo    OS: Windows
echo    Docker: 
docker --version 2>nul || echo "Not available"
echo    Docker Compose:
docker-compose --version 2>nul || echo "Not available"
echo.
echo 📁 Project Structure:
echo    Backend: ./backend/
echo    Frontend: ./frontend/
echo    Configurations: ./
echo    Scripts: ./
echo.
echo 🔧 Available Scripts:
for %%f in (*.bat) do echo    %%f
echo.
echo 📊 Docker Status:
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Docker is running
    echo    📋 Active containers:
    docker-compose ps 2>nul || echo "No active containers"
) else (
    echo    ❌ Docker is not running
)
echo.
pause
goto main_menu

:invalid_choice
echo.
echo ❌ Invalid choice. Please enter a number between 1-14.
echo.
pause
goto main_menu

:exit
echo.
echo 👋 Thank you for using LEGO Purchase Suggestion System Manager!
echo 🎉 Have a great day!
echo.
pause
exit
