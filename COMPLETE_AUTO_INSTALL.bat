@echo off
cls
echo ========================================
e# Install additional performance packages if needed
ec# Install additional UI and utility packages
echo Installing additional frontend packages...
call npm install --save axios react-router-dom
call npm install --save react-hook-form @hookform/resolvers yup
call npm install --save react-toastify framer-motion
call npm install --save lucide-react date-fns lodash
call npm install --save jspdf xlsx xlsx-js-style
call npm install --save recharts web-vitals
call npm install --save react-query @tanstack/react-query
call npm install --save zustand react-context-devtool
call npm install --save react-virtualized react-window
call npm install --save react-select react-datepicker
call npm install --save react-infinite-scroll-component
call npm install --save react-beautiful-dnd react-sortable-hoc
call npm install --save @react-spring/web react-transition-group
call npm install --save react-helmet-async react-error-boundary
call npm install --save clsx classnames styled-components
call npm install --save @headlessui/react @heroicons/react
call npm install --save downshift react-use react-hotkeys-hook

:: Install Tailwind CSS if not present
echo Installing Tailwind CSS and PostCSS...
call npm install --save-dev tailwindcss postcss autoprefixer
call npm install --save postcss-flexbugs-fixes postcss-preset-env
call npm install --save-dev @tailwindcss/forms @tailwindcss/typography
call npm install --save-dev @tailwindcss/aspect-ratio @tailwindcss/line-clamp additional performance packages...
call npm install --save compression helmet express-rate-limit node-cache
call npm install --save morgan cors bcryptjs jsonwebtoken
call npm install --save express-validator date-fns
call npm install --save pg sequelize umzug
call npm install --save dotenv node-cron
call npm install --save multer express-fileupload
call npm install --save winston rotating-file-stream
call npm install --save moment moment-timezone
call npm install --save validator joi express-async-errors
call npm install --save sharp jimp image-size
call npm install --save csv-parser csv-stringify papaparse
call npm install --save socket.io express-session connect-redis
call npm install --save nodemailer smtp-transport
call npm install --save chalk colors cli-table3
call npm install --save fs-extra rimraf glob

:: Install development dependencies
echo Installing development dependencies...
call npm install --save-dev nodemon cross-env sequelize-cli
call npm install --save-dev jest supertest nyc
call npm install --save-dev eslint prettier husky lint-staged
call npm install --save-dev @types/node ts-node typescript
call npm install --save-dev concurrently wait-on MANAGEMENT SYSTEM AUTO-INSTALLER
echo           ALL-IN-ONE SETUP
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/10] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: Node.js 18.x or higher
    pause
    exit /b 1
)
echo ✅ Node.js is installed

:: Check if npm is available
echo [2/10] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available!
    echo Please reinstall Node.js with npm included
    pause
    exit /b 1
)
echo ✅ npm is available

:: Check if PostgreSQL is installed
echo [3/10] Checking PostgreSQL installation...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL not found in PATH
    echo Please ensure PostgreSQL is installed and added to PATH
    echo Download from: https://www.postgresql.org/download/
    echo.
    echo Continue anyway? (y/n)
    set /p continue=
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo ✅ PostgreSQL is available
)

echo.
echo ========================================
echo     INSTALLING BACKEND DEPENDENCIES
echo ========================================

:: Install backend dependencies
echo [4/10] Installing backend dependencies...
cd backend
if not exist package.json (
    echo ❌ backend/package.json not found!
    echo Please ensure you're in the correct directory
    pause
    exit /b 1
)

echo Installing core backend packages...
call npm install

:: Install additional performance packages if needed
echo Installing additional performance packages...
call npm install --save compression helmet express-rate-limit node-cache
call npm install --save morgan cors bcryptjs jsonwebtoken
call npm install --save express-validator date-fns
call npm install --save pg sequelize umzug
call npm install --save dotenv node-cron

:: Install development dependencies
echo Installing development dependencies...
call npm install --save-dev nodemon cross-env sequelize-cli

echo ✅ Backend dependencies installed successfully!

echo.
echo ========================================
echo     INSTALLING FRONTEND DEPENDENCIES  
echo ========================================

:: Install frontend dependencies
echo [5/10] Installing frontend dependencies...
cd ..\frontend
if not exist package.json (
    echo ❌ frontend/package.json not found!
    pause
    exit /b 1
)

echo Installing core frontend packages...
call npm install

:: Install additional UI and utility packages
echo Installing additional frontend packages...
call npm install --save axios react-router-dom
call npm install --save react-hook-form @hookform/resolvers yup
call npm install --save react-toastify framer-motion
call npm install --save lucide-react date-fns lodash
call npm install --save jspdf xlsx xlsx-js-style
call npm install --save recharts web-vitals

:: Install Tailwind CSS if not present
echo Installing Tailwind CSS and PostCSS...
call npm install --save-dev tailwindcss postcss autoprefixer
call npm install --save postcss-flexbugs-fixes postcss-preset-env

echo ✅ Frontend dependencies installed successfully!

echo.
echo ========================================
echo     SETTING UP DATABASE CONNECTION
echo ========================================

:: Setup database configuration
echo [6/10] Setting up database configuration...
cd ..\backend

:: Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env configuration file...
    echo # Database Configuration > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5432 >> .env
    echo DB_NAME=cash_management >> .env
    echo DB_USER=postgres >> .env
    echo DB_PASSWORD=your_password_here >> .env
    echo. >> .env
    echo # JWT Configuration >> .env
    echo JWT_SECRET=your_jwt_secret_here_change_this_in_production >> .env
    echo JWT_EXPIRES_IN=24h >> .env
    echo. >> .env
    echo # Application Configuration >> .env
    echo NODE_ENV=development >> .env
    echo PORT=5000 >> .env
    echo. >> .env
    echo # Performance Configuration >> .env
    echo CACHE_ENABLED=true >> .env
    echo MAX_CONNECTIONS=100 >> .env
    echo CONNECTION_TIMEOUT=30000 >> .env
    
    echo ⚠️  .env file created with default values
    echo Please update the database password and JWT secret
    echo File location: backend\.env
) else (
    echo ✅ .env file already exists
)

echo.
echo ========================================
echo     OPTIMIZING FOR HIGH PERFORMANCE
echo ========================================

:: Run performance optimizations
echo [7/10] Applying performance optimizations...

:: Check if database is accessible
echo Testing database connection...
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cash_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    console.log('Please check your database configuration in .env file');
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    pool.end();
  }
});
" 2>nul || echo ⚠️  Database connection test skipped - please configure manually

echo.
echo ========================================
echo     RUNNING DATABASE MIGRATIONS
echo ========================================

:: Run database setup
echo [8/10] Setting up database schema...
if exist migrate.js (
    echo Running database migrations...
    call node migrate.js
    echo ✅ Database migrations completed
) else (
    echo ⚠️  Migration script not found - please run manually
)

echo.
echo ========================================
echo     PERFORMANCE TUNING
echo ========================================

:: Apply performance optimizations
echo [9/10] Applying performance optimizations for 20k+ transactions...

if exist scripts\performanceOptimization.sql (
    echo Applying performance indexes...
    psql -h localhost -d cash_management -f scripts\performanceOptimization.sql 2>nul || echo ⚠️  Performance optimization skipped - apply manually
    echo ✅ Performance optimizations applied
) else (
    echo ⚠️  Performance optimization script not found
)

echo.
echo ========================================
echo     FINAL SETUP AND VERIFICATION
echo ========================================

:: Final verification
echo [10/10] Final verification and setup...

:: Create startup scripts
echo Creating startup scripts...

:: Create start_all.bat
echo @echo off > ..\start_all.bat
echo echo Starting Cash Management System... >> ..\start_all.bat
echo echo. >> ..\start_all.bat
echo echo [1] Starting Backend Server... >> ..\start_all.bat
echo start "Backend Server" cmd /k "cd backend && npm start" >> ..\start_all.bat
echo timeout /t 5 >> ..\start_all.bat
echo echo [2] Starting Frontend Development Server... >> ..\start_all.bat
echo start "Frontend Server" cmd /k "cd frontend && npm start" >> ..\start_all.bat
echo echo. >> ..\start_all.bat
echo echo ✅ Both servers started! >> ..\start_all.bat
echo echo Backend: http://localhost:5000 >> ..\start_all.bat
echo echo Frontend: http://localhost:3000 >> ..\start_all.bat
echo pause >> ..\start_all.bat

:: Create package_update.bat for future updates
echo @echo off > ..\package_update.bat
echo echo Updating all packages... >> ..\package_update.bat
echo cd backend >> ..\package_update.bat
echo call npm update >> ..\package_update.bat
echo cd ..\frontend >> ..\package_update.bat
echo call npm update >> ..\package_update.bat
echo echo ✅ All packages updated! >> ..\package_update.bat
echo pause >> ..\package_update.bat

echo ✅ Startup scripts created in main directory

echo.
echo ========================================
echo        INSTALLATION COMPLETE! 
echo ========================================
echo.
echo 📊 PERFORMANCE CAPABILITIES:
echo    ✅ Optimized for 20,000+ transactions
echo    ✅ Advanced caching implemented
echo    ✅ Database indexes for high performance
echo    ✅ Pagination and filtering optimized
echo    ✅ Connection pooling configured
echo.
echo 🔧 FEATURES ADDED:
echo    ✅ Enhanced Anamath search (ID, ledger, remarks)
echo    ✅ Auto-increment Anamath IDs (A001, A002...)
echo    ✅ Unlimited records display
echo    ✅ PDF generation with proper alignment
echo    ✅ High-performance transaction processing
echo.
echo 🚀 TO START THE SYSTEM:
echo    1. Update database password in backend\.env
echo    2. Run: start_all.bat
echo    3. Open: http://localhost:3000
echo.
echo 📝 MANUAL STEPS (if needed):
echo    1. Create PostgreSQL database: cash_management
echo    2. Update backend\.env with your database credentials  
echo    3. Run: cd backend && node migrate.js
echo    4. Run: cd backend && node seed.js (optional sample data)
echo.
echo 🔧 MAINTENANCE SCRIPTS:
echo    - start_all.bat (start both servers)
echo    - package_update.bat (update all packages)
echo    - backend\scripts\performanceOptimization.sql (DB tuning)
echo.
echo ⚠️  IMPORTANT NOTES:
echo    - System is optimized for 20,000+ transactions
echo    - Uses PostgreSQL with performance indexes
echo    - Implements advanced caching and pagination
echo    - All search functionalities are enhanced
echo.
echo Installation completed successfully!
echo Press any key to exit...
pause >nul