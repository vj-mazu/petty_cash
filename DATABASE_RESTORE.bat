@echo off
chcp 65001 >nul
color 0E
title Database Restore - Cash Management System

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          🔄 DATABASE RESTORE UTILITY                          ║
echo ║          Cash Management System                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set ROOT=%~dp0
set BACKUP_FOLDER=%ROOT%database_backups

echo ⚠️  WARNING: This will REPLACE all current data!
echo.
echo Make sure you have a backup of current data before proceeding.
echo.
echo Press Ctrl+C to cancel, or
pause

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

echo.
echo Database: %DB_NAME%
echo User: %DB_USER%
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo.

REM Check if backup folder exists
if not exist "%BACKUP_FOLDER%" (
    echo ❌ No backups found!
    echo Backup folder does not exist: %BACKUP_FOLDER%
    echo.
    echo Run DATABASE_BACKUP.bat first to create a backup.
    pause
    exit /b 1
)

REM List available backups
echo Available backups:
echo ══════════════════════════════════════════════════════════════════
echo.
dir /b "%BACKUP_FOLDER%\*.sql" 2>nul
if %errorlevel% neq 0 (
    echo ❌ No backup files found in: %BACKUP_FOLDER%
    echo.
    echo Run DATABASE_BACKUP.bat first to create a backup.
    pause
    exit /b 1
)
echo.
echo ══════════════════════════════════════════════════════════════════
echo.

REM Get backup file from user
set /p BACKUP_FILE="Enter backup filename to restore: "

if not exist "%BACKUP_FOLDER%\%BACKUP_FILE%" (
    echo.
    echo ❌ Backup file not found: %BACKUP_FILE%
    echo.
    pause
    exit /b 1
)

echo.
echo ══════════════════════════════════════════════════════════════════
echo 🔄 Starting restore process...
echo ══════════════════════════════════════════════════════════════════
echo.
echo File: %BACKUP_FILE%
echo.
echo This will:
echo 1. Drop existing database
echo 2. Create fresh database
echo 3. Restore all data from backup
echo.
echo ⚠️  ALL CURRENT DATA WILL BE LOST!
echo.
echo Press Ctrl+C to cancel, or
pause

REM Set PostgreSQL password
set PGPASSWORD=%DB_PASSWORD%

echo.
echo Step 1/3: Dropping existing database...
dropdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% --if-exists %DB_NAME%

echo Step 2/3: Creating fresh database...
createdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% %DB_NAME%

echo Step 3/3: Restoring data from backup...
pg_restore -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -v "%BACKUP_FOLDER%\%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo ✅ RESTORE SUCCESSFUL!
    echo ══════════════════════════════════════════════════════════════════
    echo.
    echo All data has been restored from:
    echo %BACKUP_FILE%
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo 🎯 Next steps:
    echo ══════════════════════════════════════════════════════════════════
    echo 1. Restart backend server
    echo 2. Login with your original credentials
    echo 3. All your data should be back!
    echo.
) else (
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo ❌ RESTORE FAILED!
    echo ══════════════════════════════════════════════════════════════════
    echo.
    echo Possible issues:
    echo 1. Backup file is corrupted
    echo 2. Database credentials incorrect
    echo 3. PostgreSQL version mismatch
    echo 4. No permission to create database
    echo.
)

REM Clear password
set PGPASSWORD=

echo.
echo Press any key to exit...
pause >nul
