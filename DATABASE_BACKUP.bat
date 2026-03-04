@echo off
chcp 65001 >nul
color 0B
title Database Backup - Cash Management System

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          📦 DATABASE BACKUP UTILITY                           ║
echo ║          Cash Management System                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set ROOT=%~dp0
set BACKUP_FOLDER=%ROOT%database_backups
set DATE=%date:~10,4%-%date:~4,2%-%date:~7,2%
set TIME=%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIME=%TIME: =0%
set BACKUP_FILE=cash_backup_%DATE%_%TIME%.sql

if not exist "%BACKUP_FOLDER%" mkdir "%BACKUP_FOLDER%"

echo Creating database backup...
echo Backup file: %BACKUP_FILE%
echo.

REM Get database credentials from .env file
for /f "tokens=1,2 delims==" %%a in ('findstr /r "^DB_" backend\.env 2^>nul') do (
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
)

REM Default values if not found in .env
if "%DB_NAME%"=="" set DB_NAME=cash_management
if "%DB_USER%"=="" set DB_USER=postgres
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432

echo Database: %DB_NAME%
echo User: %DB_USER%
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo.

REM Set PostgreSQL password environment variable
set PGPASSWORD=%DB_PASSWORD%

echo Running pg_dump...
echo.

pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F c -b -v -f "%BACKUP_FOLDER%\%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo ✅ BACKUP SUCCESSFUL!
    echo ══════════════════════════════════════════════════════════════════
    echo.
    echo Backup saved to:
    echo %BACKUP_FOLDER%\%BACKUP_FILE%
    echo.
    
    REM Get file size
    for %%A in ("%BACKUP_FOLDER%\%BACKUP_FILE%") do (
        set SIZE=%%~zA
    )
    echo File size: %SIZE% bytes
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo 📋 What's included in backup:
    echo ══════════════════════════════════════════════════════════════════
    echo ✅ All transactions
    echo ✅ All ledgers
    echo ✅ All users
    echo ✅ All anamath entries
    echo ✅ All system settings
    echo ✅ Database structure
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo 💾 To restore this backup on new system:
    echo ══════════════════════════════════════════════════════════════════
    echo 1. Copy this backup file to new system
    echo 2. Run: DATABASE_RESTORE.bat
    echo 3. Select this backup file
    echo 4. All data will be restored!
    echo.
) else (
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo ❌ BACKUP FAILED!
    echo ══════════════════════════════════════════════════════════════════
    echo.
    echo Possible issues:
    echo 1. PostgreSQL not installed or not in PATH
    echo 2. Database credentials incorrect
    echo 3. Database not running
    echo 4. No permission to write to backup folder
    echo.
    echo To fix:
    echo 1. Make sure PostgreSQL is installed
    echo 2. Check backend\.env file for correct credentials
    echo 3. Ensure PostgreSQL service is running
    echo.
)

REM Clear password
set PGPASSWORD=

echo.
echo Press any key to exit...
pause >nul
