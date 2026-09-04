@echo off
cd /d "%~dp0"
title ALUHIC - Application Server
echo =======================================================
echo                 STARTING ALUHIC SYSTEM                
echo =======================================================
echo.
echo Opening browser at http://localhost:3333 in 5 seconds...
start /b cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3333"

echo Starting server...
echo (Keep this window open while testing. Close it to stop the server)
echo.
call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Application stopped or failed to start!
    echo Please make sure SETUP_FOR_QA.bat was completed and PostgreSQL is running.
)
pause
