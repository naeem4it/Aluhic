@echo off
cd /d "%~dp0"
title ALUHIC - Application Server
echo =======================================================
echo                 STARTING ALUHIC SYSTEM                
echo =======================================================
echo.
echo Initializing server (Vite and modules compile in ~10-15s)...
echo The browser will open automatically once the server is ready.
echo.
echo [NOTE] Keep this window OPEN while testing.
echo        Close this window only when you want to STOP the server.
echo =======================================================
echo.

:: Smart launcher: Polls localhost:3333 every second and opens browser as soon as ready
start /b cmd /c "for /l %%i in (1,1,40) do (curl -s -o nul http://localhost:3333 && (start http://localhost:3333 & exit) || timeout /t 1 >nul) & start http://localhost:3333"

call npm.cmd run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Application stopped or failed to start!
    echo Please make sure SETUP_FOR_QA.bat was completed and PostgreSQL is running.
)
pause

