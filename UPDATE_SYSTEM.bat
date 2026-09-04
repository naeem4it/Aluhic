@echo off
title ALUHIC - Update System
echo =======================================================
echo               UPDATING ALUHIC SYSTEM                  
echo =======================================================
echo.
echo This script updates packages, database tables, and modules.
echo.

:: 1. Update npm packages if new dependencies were added
echo [1/3] Checking and updating dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed. Please check internet connection.
    pause
    exit /b 1
)
echo Dependencies up to date.
echo.

:: 2. Push database schema changes (new tables or columns)
echo [2/3] Applying database changes...
call npm run db:push
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database schema update failed. Make sure PostgreSQL is running.
    pause
    exit /b 1
)
echo Database schema updated.
echo.

:: 3. Sync any new modules or admin updates
echo [3/3] Syncing latest modules and admin settings...
call npm run db:seed
call npm run db:admin
echo.

echo =======================================================
echo              UPDATE COMPLETED SUCCESSFULLY!            
echo =======================================================
echo You can now start the application with RUN_SYSTEM.bat
echo =======================================================
pause
