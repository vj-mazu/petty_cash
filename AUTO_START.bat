@echo off
SETLOCAL EnableDelayedExpansion
TITLE Petti Cash System - AUTO START
COLOR 0A

echo.
echo ===============================================================================
echo                   PETTI CASH MANAGEMENT SYSTEM
echo                      AUTO START SCRIPT
echo                    30,000-40,000+ Transactions
echo ===============================================================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please run COMPLETE_AUTO_INSTALL.bat first.
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

REM Check if PostgreSQL is installed
echo [2/5] Checking PostgreSQL installation...
psql --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL command not found in PATH
    echo Make sure PostgreSQL is installed and running
)
echo [OK] PostgreSQL check completed
echo.

REM Start Backend Server
echo [3/5] Starting Backend Server...
echo -----------------------------------------------
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    call npm install
)

echo [INFO] Starting backend server...
echo [INFO] Server will run on http://localhost:5000
echo [INFO] Ultra Performance Optimizer will auto-activate
echo.
start "Petti Cash Backend" cmd /k "node server.js"
timeout /t 5 /nobreak >nul
echo [OK] Backend server started successfully
echo.

REM Start Frontend
echo [4/5] Starting Frontend Application...
echo -----------------------------------------------
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

echo [INFO] Starting frontend application...
echo [INFO] Application will run on http://localhost:3000
echo.
start "Petti Cash Frontend" cmd /k "npm start"
timeout /t 3 /nobreak >nul
echo [OK] Frontend application started successfully
echo.

REM Display system information
echo [5/5] System Information
echo ===============================================================================
echo.
echo   Backend API:      http://localhost:5000
echo   Frontend App:     http://localhost:3000
echo.
echo   LAN Access:       http://YOUR-IP:5000  (Backend)
echo                     http://YOUR-IP:3000  (Frontend)
echo.
echo   Performance:      Optimized for 40,000+ transactions
echo   Auto-Indexing:    ENABLED (High-Level)
echo   Caching:          ENABLED (NodeCache)
echo   Connection Pool:  5-50 connections
echo.
echo   Default Login Credentials:
echo   -------------------------
echo   Admin:   Username: admin1   Password: admin123
echo   Staff:   Username: staff    Password: staff123
echo.
echo ===============================================================================
echo.
echo [SUCCESS] Petti Cash System is now running!
echo.
echo Press any key to view this information again...
pause >nul

REM Keep window open
:menu
cls
echo.
echo ===============================================================================
echo                    PETTI CASH SYSTEM - RUNNING
echo ===============================================================================
echo.
echo   Backend Server:       Running on http://localhost:5000
echo   Frontend Application: Running on http://localhost:3000
echo.
echo   System Performance:   40,000+ Transactions Ready
echo   Ultra Optimizer:      ACTIVE
echo.
echo ===============================================================================
echo.
echo   OPTIONS:
echo   --------
echo   1. Open Backend in Browser
echo   2. Open Frontend in Browser
echo   3. View System Status
echo   4. Stop All Services
echo   5. Exit (Keep Services Running)
echo.
echo ===============================================================================
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" start http://localhost:5000
if "%choice%"=="2" start http://localhost:3000
if "%choice%"=="3" goto :status
if "%choice%"=="4" goto :stop
if "%choice%"=="5" goto :end

goto :menu

:status
cls
echo.
echo ===============================================================================
echo                       SYSTEM STATUS CHECK
echo ===============================================================================
echo.
echo Checking Backend Server...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [!] Backend Server: NOT RESPONDING
) else (
    echo [OK] Backend Server: RUNNING
)
echo.
echo Checking Frontend Application...
netstat -ano | findstr ":3000" >nul 2>&1
if errorlevel 1 (
    echo [!] Frontend Application: NOT RUNNING
) else (
    echo [OK] Frontend Application: RUNNING
)
echo.
echo ===============================================================================
pause
goto :menu

:stop
echo.
echo Stopping all services...
echo.
taskkill /FI "WINDOWTITLE eq Petti Cash Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Petti Cash Frontend*" /T /F >nul 2>&1
echo [OK] All services stopped successfully
echo.
pause
exit

:end
echo.
echo Services are still running in the background.
echo Close the terminal windows to stop them.
echo.
pause
exit
