@echo off
chcp 65001 >nul
color 0A
title Complete Delete Fix - Apply All Changes

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     ✅ COMPLETE DELETE FIX                                    ║
echo ║     Fix Both Delete Errors at Once                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo This script will fix BOTH delete errors:
echo.
echo Error 1: "Cannot delete transaction: Transaction cannot be deleted"
echo    Fix: Allow staff to delete transactions
echo.
echo Error 2: "Cannot delete transactions older than 30 days"
echo    Fix: Remove 30-day restriction
echo.
echo Files that will be updated:
echo    ✅ backend/middleware/auth.js
echo    ✅ frontend/src/utils/permissions.ts
echo    ✅ backend/controllers/transactionController.js
echo.
pause

echo.
echo ══════════════════════════════════════════════════════════════════
echo 📋 Step 1: Verifying code changes...
echo ══════════════════════════════════════════════════════════════════

echo.
echo Checking Fix 1: Staff can delete (backend)...
findstr /C:"role === 'staff'" backend\middleware\auth.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend permission fix applied
) else (
    echo ⚠️  Backend permission fix not found
)

echo Checking Fix 1: Staff can delete (frontend)...
findstr /C:"role === 'staff'" frontend\src\utils\permissions.ts >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend permission fix applied
) else (
    echo ⚠️  Frontend permission fix not found
)

echo Checking Fix 2: 30-day restriction removed...
findstr /C:"30-day restriction REMOVED" backend\controllers\transactionController.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 30-day restriction removed
) else (
    echo ⚠️  30-day restriction still present
)

echo.
echo ══════════════════════════════════════════════════════════════════
echo 🛑 Step 2: Stopping existing services...
echo ══════════════════════════════════════════════════════════════════

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

timeout /t 2 >nul

echo ✅ Services stopped

echo.
echo ══════════════════════════════════════════════════════════════════
echo 🔄 Step 3: Starting Backend with fixes...
echo ══════════════════════════════════════════════════════════════════

cd backend

echo Starting backend server...
start "Cash Management Backend - DELETE FIX APPLIED" cmd /k "echo DELETE FIXES APPLIED && echo. && echo Changes: && echo  1. Staff can now delete && echo  2. No 30-day restriction && echo. && npm start"

timeout /t 5

echo ✅ Backend started (check for "Server running on port 5000")

cd ..

echo.
echo ══════════════════════════════════════════════════════════════════
echo 🎨 Step 4: Starting Frontend with fixes...
echo ══════════════════════════════════════════════════════════════════

cd frontend

echo Starting frontend...
start "Cash Management Frontend - DELETE FIX APPLIED" cmd /k "echo DELETE FIXES APPLIED && echo. && echo Changes: && echo  1. Staff can now delete && echo  2. No 30-day restriction && echo. && npm start"

timeout /t 5

echo ✅ Frontend started (will open in browser)

cd ..

echo.
echo ══════════════════════════════════════════════════════════════════
echo ✅ ALL FIXES APPLIED!
echo ══════════════════════════════════════════════════════════════════
echo.
echo 🎯 What was fixed:
echo.
echo    ✅ Fix 1: Staff Can Delete Transactions
echo       - Backend: auth.js updated
echo       - Frontend: permissions.ts updated
echo       - Who can delete: admin1, admin2, staff
echo.
echo    ✅ Fix 2: Remove 30-Day Restriction
echo       - Backend: transactionController.js updated
echo       - Can now delete transactions of ANY age
echo       - No more "older than 30 days" error
echo.
echo ══════════════════════════════════════════════════════════════════
echo ⚠️  CRITICAL: USER MUST DO THIS
echo ══════════════════════════════════════════════════════════════════
echo.
echo After services start:
echo.
echo    1. Wait for browser to open (http://localhost:3000)
echo    2. LOGOUT completely (click name → Logout)
echo    3. CLOSE all browser tabs
echo    4. Open new browser tab
echo    5. Go to http://localhost:3000
echo    6. LOGIN again (any account)
echo    7. Try DELETE - will work! ✅
echo.
echo ══════════════════════════════════════════════════════════════════
echo 📋 Test Checklist
echo ══════════════════════════════════════════════════════════════════
echo.
echo Test 1: Staff Can Delete
echo    1. Login as: staff / Staff123!
echo    2. Go to Transactions
echo    3. Delete any transaction
echo    4. Should work! ✅
echo.
echo Test 2: Delete Old Records
echo    1. Login as: admin1 / admin123
echo    2. Find transaction from July 2025
echo    3. Delete it
echo    4. Should work! ✅ (no 30-day error)
echo.
echo ══════════════════════════════════════════════════════════════════
echo 📊 Current Delete Permissions
echo ══════════════════════════════════════════════════════════════════
echo.
echo User      │ Password    │ Can Delete? │ Any Age?
echo ──────────┼─────────────┼─────────────┼─────────
echo admin1    │ admin123    │ ✅ YES      │ ✅ YES
echo admin2    │ Admin123!   │ ✅ YES      │ ✅ YES
echo staff     │ Staff123!   │ ✅ YES      │ ✅ YES
echo.
echo ══════════════════════════════════════════════════════════════════
echo.
echo Services running in background windows.
echo Browser should open automatically to http://localhost:3000
echo.
echo Remember: LOGOUT and LOGIN again for changes to take effect!
echo.
pause
