@echo off
chcp 65001 >nul
color 0B
title Database Backup - Cash Management System

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          📦 DATABASE BACKUP                                   ║
echo ║          Cash Management System                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo This will create a backup of your entire database.
echo.
echo Backup will include:
echo    ✅ All transactions
echo    ✅ All ledgers
echo    ✅ All users
echo    ✅ All anamath entries
echo    ✅ Opening balances
echo    ✅ System settings
echo.
pause

REM Get date and time for backup filename
set DATETIME=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATETIME=%DATETIME: =0%

REM Create backup directory
set BACKUP_DIR=%~dp0database_backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set BACKUP_FILE=%BACKUP_DIR%\cash_db_backup_%DATETIME%.sql

echo.
echo ══════════════════════════════════════════════════════════════════
echo 📋 Backup Information
echo ══════════════════════════════════════════════════════════════════
echo.
echo Backup file: %BACKUP_FILE%
echo.
echo Starting backup...
echo.

REM PostgreSQL connection details (from .env)
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGDATABASE=cash_management
set PGPASSWORD=postgres

REM Run pg_dump to create backup
echo Creating database dump...
pg_dump -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -F c -b -v -f "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo ✅ BACKUP COMPLETED SUCCESSFULLY!
    echo ══════════════════════════════════════════════════════════════════
    echo.
    echo Backup saved to:
    echo %BACKUP_FILE%
    echo.
    echo File size:
    for %%A in ("%BACKUP_FILE%") do echo %%~zA bytes
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo 📋 What's Backed Up:
    echo ══════════════════════════════════════════════════════════════════
    echo    ✅ All transactions (with transaction numbers)
    echo    ✅ All ledgers (with balances)
    echo    ✅ All users (with roles and permissions)
    echo    ✅ All anamath entries
    echo    ✅ Opening balances
    echo    ✅ System settings
    echo    ✅ Database structure (tables, indexes)
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo 💡 How to Restore:
    echo ══════════════════════════════════════════════════════════════════
    echo    1. Run: DATABASE_RESTORE.bat
    echo    2. Select this backup file
    echo    3. Database will be restored
    echo.
    echo ⚠️  Keep this backup file safe!
    echo.
) else (
    echo.
    echo ══════════════════════════════════════════════════════════════════
    echo ❌ BACKUP FAILED!
    echo ══════════════════════════════════════════════════════════════════
    echo.
    echo Possible reasons:
    echo    1. PostgreSQL not installed
    echo    2. pg_dump not in PATH
    echo    3. Database not accessible
    echo    4. Wrong credentials
    echo.
    echo Please check:
    echo    - PostgreSQL is installed
    echo    - Database is running
    echo    - Credentials in .env are correct
    echo.
)

echo.
pause
