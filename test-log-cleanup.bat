@echo off
REM Test Log Cleanup Functionality for LEGO Purchase Suggestion System
REM Creates test log files and tests the cleanup functionality

echo 🧪 Test Log Cleanup Functionality
echo ==================================

echo [INFO] This script will test the log cleanup functionality
echo [INFO] by creating test log files with different dates.
echo.
set /p confirm="Continue with test? (y/n): "
if /i not "%confirm%"=="y" goto exit

echo.
echo [1/5] Creating test log directory...
if not exist "backend\logs\" (
    mkdir "backend\logs\" >nul 2>&1
    echo ✅ Test log directory created
) else (
    echo ✅ Test log directory exists
)

echo.
echo [2/5] Creating test log files with different dates...

REM Create test log files with different dates
echo Test application log from 2025-09-25 > "backend\logs\application-2025-09-25.log"
echo Test audit log from 2025-09-25 > "backend\logs\audit-2025-09-25.log"
echo Test error log from 2025-09-25 > "backend\logs\error-2025-09-25.log"

echo Test application log from 2025-09-26 > "backend\logs\application-2025-09-26.log"
echo Test audit log from 2025-09-26 > "backend\logs\audit-2025-09-26.log"
echo Test error log from 2025-09-26 > "backend\logs\error-2025-09-26.log"

echo Test application log from 2025-09-27 > "backend\logs\application-2025-09-27.log"
echo Test audit log from 2025-09-27 > "backend\logs\audit-2025-09-27.log"
echo Test error log from 2025-09-27 > "backend\logs\error-2025-09-27.log"

echo Test application log from 2025-09-28 > "backend\logs\application-2025-09-28.log"
echo Test audit log from 2025-09-28 > "backend\logs\audit-2025-09-28.log"
echo Test error log from 2025-09-28 > "backend\logs\error-2025-09-28.log"

echo Test application log from 2025-09-29 > "backend\logs\application-2025-09-29.log"
echo Test audit log from 2025-09-29 > "backend\logs\audit-2025-09-29.log"
echo Test error log from 2025-09-29 > "backend\logs\error-2025-09-29.log"

echo ✅ Test log files created

echo.
echo [3/5] Showing created test files...
echo 📁 Test log files created:
for %%f in (backend\logs\*.log) do (
    echo    📄 %%f
)

echo.
echo [4/5] Testing log cleanup with 2-day retention...
echo [INFO] Running cleanup with 2-day retention (should remove files older than 2025-09-27)...
echo.
call cleanup-logs.bat 2

echo.
echo [5/5] Verifying cleanup results...
echo 📁 Remaining log files after cleanup:
if exist "backend\logs\*.log" (
    for %%f in (backend\logs\*.log) do (
        echo    ✅ %%f
    )
) else (
    echo    📁 No log files found
)

echo.
echo ==================================
echo 🧪 TEST RESULTS SUMMARY
echo ==================================
echo.
echo 📊 Expected behavior:
echo    - Files from 2025-09-25 and 2025-09-26 should be DELETED (older than 2 days)
echo    - Files from 2025-09-27, 2025-09-28, and 2025-09-29 should be KEPT (within 2 days)
echo.
echo 🔍 Manual verification:
echo    Check the files listed above to confirm cleanup worked correctly
echo.
echo 🧹 Cleanup test files:
echo    To remove all test files: del backend\logs\*.log
echo.
echo 💡 Integration test:
echo    Run any startup script to test automatic log cleanup
echo ==================================

:exit
echo.
echo ✅ Log cleanup test completed!
echo 💡 The cleanup functionality is now integrated into all startup scripts.
echo.
pause

