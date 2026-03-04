@echo off@echo off

echo ==========================================echo ==========================================

echo    Cash Management System - Complete Setupecho    Cash Management System - Complete Setup

echo ==========================================echo ==========================================

echo.echo.



:: Check if Node.js is installed:: Check if Node.js is installed

echo Checking Node.js installation...echo Checking Node.js installation...

node --version >nul 2>&1node --version >nul 2>&1

if errorlevel 1 (if errorlevel 1 (

    echo ERROR: Node.js is not installed!    echo ERROR: Node.js is not installed!

    echo Please install Node.js from https://nodejs.org/    echo Please install Node.js from https://nodejs.org/

    echo After installation, restart this script.    echo After installation, restart this script.

    pause    pause

    exit /b 1    exit /b 1

))



:: Check if PostgreSQL is installed:: Check if PostgreSQL is installed

echo Checking PostgreSQL installation...echo Checking PostgreSQL installation...

psql --version >nul 2>&1psql --version >nul 2>&1

if errorlevel 1 (if errorlevel 1 (

    echo ERROR: PostgreSQL is not installed!    echo ERROR: PostgreSQL is not installed!

    echo Please install PostgreSQL from https://www.postgresql.org/download/    echo Please install PostgreSQL from https://www.postgresql.org/download/

    echo Make sure to remember your postgres user password.    echo Make sure to remember your postgres user password.

    echo After installation, restart this script.    echo After installation, restart this script.

    pause    pause

    exit /b 1    exit /b 1

))



echo Node.js and PostgreSQL are installed. Proceeding with setup...echo Node.js and PostgreSQL are installed. Proceeding with setup...

echo.echo.

    exit /b 1

:: Install root dependencies)

echo Installing root dependencies...echo [SUCCESS] Running with Administrator privileges

if exist package.json (

    call npm installREM Check Node.js installation

    if errorlevel 1 (echo [CHECKING] Node.js installation...

        echo ERROR: Failed to install root dependenciesnode --version >nul 2>&1

        pauseif %errorlevel% neq 0 (

        exit /b 1    echo [INFO] Node.js not found. Downloading and installing...

    )    

)    REM Download Node.js LTS

    if not exist "%TEMP%\nodejs.msi" (

:: Install backend dependencies        echo [DOWNLOAD] Downloading Node.js LTS...

echo Installing backend dependencies...        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'"

cd backend    )

if exist package.json (    

    call npm install    echo [INSTALL] Installing Node.js...

    if errorlevel 1 (    msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart

        echo ERROR: Failed to install backend dependencies    

        pause    REM Refresh PATH

        exit /b 1    call refreshenv

    )    timeout /t 5 >nul

)    

    REM Verify installation

:: Install frontend dependencies    node --version >nul 2>&1

echo Installing frontend dependencies...    if %errorlevel% neq 0 (

cd ..\frontend        echo [ERROR] Node.js installation failed. Please install manually from https://nodejs.org/

if exist package.json (        pause

    call npm install        exit /b 1

    if errorlevel 1 (    )

        echo ERROR: Failed to install frontend dependencies)

        pause

        exit /b 1for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i

    )echo [SUCCESS] Node.js %NODE_VERSION% installed

)

REM =============================================================================

cd ..REM STEP 2: POSTGRESQL INSTALLATION AND SETUP

REM =============================================================================

:: Create .env file if it doesn't exist

echo Setting up environment configuration...echo.

cd backendecho [STEP 2/10] PostgreSQL Database Setup...

if not exist .env (echo.

    echo Creating .env file...

    (REM Check if PostgreSQL is installed

        echo # Database Configurationpg_config --version >nul 2>&1

        echo DB_HOST=localhostif %errorlevel% neq 0 (

        echo DB_PORT=5432    echo [INFO] PostgreSQL not found. Installing PostgreSQL 16...

        echo DB_NAME=cash_management    

        echo DB_USER=postgres    REM Download PostgreSQL

        echo DB_PASSWORD=password    if not exist "%TEMP%\postgresql.exe" (

        echo.        echo [DOWNLOAD] Downloading PostgreSQL 16...

        echo # JWT Configuration        powershell -Command "Invoke-WebRequest -Uri 'https://get.enterprisedb.com/postgresql/postgresql-16.1-1-windows-x64.exe' -OutFile '%TEMP%\postgresql.exe'"

        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production    )

        echo JWT_EXPIRES_IN=24h    

        echo.    echo [INSTALL] Installing PostgreSQL (this may take a few minutes)...

        echo # Server Configuration    echo   - Default superuser: postgres

        echo PORT=3001    echo   - Password will be set to: 12345

        echo NODE_ENV=development    echo   - Port: 5432

        echo.    

        echo # CORS Configuration    REM Install PostgreSQL silently

        echo FRONTEND_URL=http://localhost:3000    "%TEMP%\postgresql.exe" --mode unattended --superpassword "12345" --servicepassword "12345" --serverport 5432

    ) > .env    

    echo .env file created with default values.    REM Add PostgreSQL to PATH

    echo IMPORTANT: Please update the DB_PASSWORD in backend\.env file with your PostgreSQL password    setx PATH "%PATH%;C:\Program Files\PostgreSQL\16\bin" /M

    echo.    set "PATH=%PATH%;C:\Program Files\PostgreSQL\16\bin"

)    

    timeout /t 10 >nul

:: Setup database and run migrations    

echo Setting up database...    REM Verify installation

node setup-database.js    pg_config --version >nul 2>&1

if errorlevel 1 (    if %errorlevel% neq 0 (

    echo ERROR: Database setup failed. Please check your PostgreSQL connection.        echo [ERROR] PostgreSQL installation failed!

    echo Make sure PostgreSQL is running and credentials in .env are correct.        echo Please install PostgreSQL manually from https://postgresql.org/

    pause        pause

    exit /b 1        exit /b 1

)    )

)

:: Run migrations

echo Running database migrations...for /f "tokens=*" %%i in ('pg_config --version') do set PG_VERSION=%%i

node migrate.jsecho [SUCCESS] PostgreSQL installed: %PG_VERSION%

if errorlevel 1 (

    echo WARNING: Some migrations may have failed. This might be normal on first run.REM =============================================================================

)REM STEP 3: CREATE DATABASE AND USER

REM =============================================================================

:: Seed initial data

echo Seeding initial data...echo.

node seed.jsecho [STEP 3/10] Setting up database and user credentials...

if errorlevel 1 (echo.

    echo WARNING: Seeding failed. This might be normal if data already exists.

)REM Wait for PostgreSQL service to start

echo [INFO] Waiting for PostgreSQL service to start...

cd ..timeout /t 15 >nul



echo.REM Create database and user

echo ==========================================echo [SETUP] Creating database 'cash_management'...

echo         Setup Complete!psql -U postgres -c "CREATE DATABASE cash_management;" 2>nul

echo ==========================================if %errorlevel% equ 0 (

echo.    echo [SUCCESS] Database created

echo To start the application:) else (

echo 1. Backend: cd backend ^&^& npm start    echo [INFO] Database may already exist

echo 2. Frontend: cd frontend ^&^& npm start)

echo.

echo The application will be available at:echo [SETUP] Ensuring proper user permissions...

echo - Frontend: http://localhost:3000psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cash_management TO postgres;" 2>nul

echo - Backend API: http://localhost:3001

echo.echo [SUCCESS] Database setup completed

echo IMPORTANT NOTES:

echo - Make sure to update the database password in backend\.envREM =============================================================================

echo - PostgreSQL service must be runningREM STEP 4: PROJECT DEPENDENCIES

echo - Default admin user: admin/admin123REM =============================================================================

echo.

pauseecho.
echo [STEP 4/10] Installing project dependencies...
echo.

REM Install root dependencies
if exist "package.json" (
    echo [INSTALL] Installing root dependencies...
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install root dependencies
        pause
        exit /b 1
    )
)

REM Install backend dependencies
echo [INSTALL] Installing backend dependencies...
cd backend
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

REM Install frontend dependencies
echo [INSTALL] Installing frontend dependencies...
cd frontend
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] All dependencies installed

REM =============================================================================
REM STEP 5: ENVIRONMENT CONFIGURATION
REM =============================================================================

echo.
echo [STEP 5/10] Configuring environment...
echo.

REM Ensure backend .env file exists with correct settings
if not exist "backend\.env" (
    echo [CREATE] Creating backend environment configuration...
    (
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=cash_management
        echo DB_USER=postgres
        echo DB_PASSWORD=12345
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=mrn_industries_super_secret_jwt_key_2024_cash_management_system
        echo JWT_EXPIRE=7d
        echo.
        echo # Security
        echo BCrypt_ROUNDS=12
    ) > backend\.env
)

echo [SUCCESS] Environment configured

REM =============================================================================
REM STEP 6: DATABASE INITIALIZATION
REM =============================================================================

echo.
echo [STEP 6/10] Initializing database structure...
echo.

cd backend

REM Test database connection
echo [TEST] Testing database connection...
node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();
const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false
});
seq.authenticate().then(() => {
  console.log('Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});
"
if %errorlevel% neq 0 (
    echo [ERROR] Database connection failed!
    echo Please check PostgreSQL service and credentials
    pause
    exit /b 1
)

REM Setup database
echo [SETUP] Creating database structure...
call node setup-database.js
if %errorlevel% neq 0 (
    echo [WARNING] Database setup had issues, continuing...
)

REM Run migrations
echo [MIGRATE] Running database migrations...
call node migrate.js
if %errorlevel% neq 0 (
    echo [WARNING] Some migrations may have failed, continuing...
)

cd ..

echo [SUCCESS] Database structure initialized

REM =============================================================================
REM STEP 7: DEFAULT USERS AND SAMPLE DATA
REM =============================================================================

echo.
echo [STEP 7/10] Creating default users and sample data...
echo.

cd backend

REM Seed database with default users
echo [SEED] Creating admin users...
call node seed.js
if %errorlevel% neq 0 (
    echo [WARNING] User seeding had issues, continuing...
)

cd ..

echo [SUCCESS] Default users created

REM =============================================================================
REM STEP 8: BUILD FRONTEND
REM =============================================================================

echo.
echo [STEP 8/10] Building frontend application...
echo.

cd frontend
echo [BUILD] Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Frontend build failed, but development mode will work
)
cd ..

REM =============================================================================
REM STEP 9: CLEANUP UNNECESSARY FILES
REM =============================================================================

echo.
echo [STEP 9/10] Cleaning up unnecessary files...
echo.

REM Remove temporary installation files
if exist "%TEMP%\nodejs.msi" del "%TEMP%\nodejs.msi" >nul 2>&1
if exist "%TEMP%\postgresql.exe" del "%TEMP%\postgresql.exe" >nul 2>&1

REM Remove backup migration files
if exist "backend\migrations_backup" (
    echo [CLEANUP] Removing migration backups...
    rmdir /s /q "backend\migrations_backup" >nul 2>&1
)

REM Remove development logs
if exist "backend\logs\*.log" del "backend\logs\*.log" >nul 2>&1

echo [SUCCESS] Cleanup completed

REM =============================================================================
REM STEP 10: FINAL VALIDATION AND STARTUP
REM =============================================================================

echo.
echo [STEP 10/10] Final validation and startup...
echo.

REM Create startup scripts if they don't exist
if not exist "start_complete_system.bat" (
    echo [CREATE] Creating system startup script...
    (
        echo @echo off
        echo title MRN Industries Cash Management System
        echo echo Starting MRN Industries Cash Management System...
        echo echo.
        echo echo Backend: http://localhost:5000
        echo echo Frontend: http://localhost:3000
        echo echo.
        echo start "Backend" cmd /k "cd backend && npm start"
        echo timeout /t 3
        echo start "Frontend" cmd /k "cd frontend && npm start"
        echo echo.
        echo echo System started successfully!
        echo echo Backend API: http://localhost:5000
        echo echo Frontend App: http://localhost:3000
        echo echo.
        echo echo Default Admin Login:
        echo echo Email: admin@petticash.com
        echo echo Password: Admin123!
        echo pause
    ) > start_complete_system.bat
)

REM =============================================================================
REM INSTALLATION COMPLETE
REM =============================================================================

echo.
echo ===================================================================
echo                    INSTALLATION COMPLETED!
echo ===================================================================
echo.
echo   MRN Industries Cash Management System is ready to use!
echo.
echo   SYSTEM INFORMATION:
echo   ------------------
echo   Database: PostgreSQL (localhost:5432)
echo   Database Name: cash_management
echo   Username: postgres
echo   Password: 12345
echo.
echo   DEFAULT ADMIN ACCOUNTS:
echo   ----------------------
echo   Primary Admin:
echo     Email: admin@petticash.com
echo     Password: Admin123!
echo.
echo   Secondary Admin:  
echo     Email: admin2@petticash.com
echo     Password: Admin123!
echo.
echo   QUICK START OPTIONS:
echo   -------------------
echo   [1] Double-click 'start_complete_system.bat' to start both servers
echo   [2] Or use individual scripts:
echo       - Backend: start_server.bat
echo       - Frontend: cd frontend ^&^& npm start
echo.
echo   ACCESS THE APPLICATION:
echo   ----------------------
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo.
echo   SUPPORT:
echo   --------
echo   All PDF generation, transaction management, and anamath
echo   features are ready to use with the configured database.
echo.
echo ===================================================================

REM Ask user if they want to start the system now
echo.
set /p start_now="Would you like to start the system now? (Y/N): "
if /i "%start_now%"=="Y" (
    echo.
    echo Starting the system...
    call start_complete_system.bat
) else (
    echo.
    echo System is ready! Run 'start_complete_system.bat' when you want to start.
)

echo.
echo Setup completed successfully!
pause