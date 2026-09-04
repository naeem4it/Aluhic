@echo off
cd /d "%~dp0"
title ALUHIC - Initial QA Setup
echo =======================================================
echo          ALUHIC SYSTEM - QA SETUP AUTOMATION          
echo =======================================================
echo.

:: 1. Check Node.js
echo [1/6] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH!
    echo Please install Node.js LTS version from https://nodejs.org/
    echo If you just installed Node.js, please restart your computer.
    pause
    exit /b 1
)
node -v
echo Node.js is ready.
echo.

:: 2. Check and prepare .env file
echo [2/6] Checking environment configuration (.env)...
if not exist ".env" (
    echo .env file not found. Creating from .env.example...
    copy ".env.example" ".env" >nul
    echo .env created with default settings.
) else (
    echo .env file already exists.
)
echo.

:: 3. Install NPM Dependencies
echo [3/6] Installing application dependencies...
call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install failed!
    echo Check your internet connection or run Command Prompt as normal user.
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

:: 4. Initialize Database (create aluhicdb if not exists)
echo [4/6] Initializing PostgreSQL database...
call npm.cmd run db:init
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Could not connect to PostgreSQL!
    echo Please verify:
    echo  1. PostgreSQL service is running.
    echo  2. Password in your .env file matches your PostgreSQL password.
    echo     Default password expected: root
    echo.
    pause
    exit /b 1
)
echo.

:: 5. Push Database Tables and Schema
echo [5/6] Creating database tables...
call npm.cmd run db:push
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Database schema push failed!
    pause
    exit /b 1
)
echo Database tables created.
echo.

:: 6. Seed Modules and Super Admin
echo [6/6] Seeding modules and admin account...
call npm.cmd run db:seed
call npm.cmd run db:admin
echo.

echo =======================================================
echo           SETUP COMPLETED SUCCESSFULLY!                
echo =======================================================
echo.
echo You can now run the system anytime by double-clicking:
echo                    RUN_SYSTEM.bat
echo.
echo Default Login:
echo   Email:    naeem4it@gmail.com
echo   Password: #0321Blouch
echo =======================================================
pause
