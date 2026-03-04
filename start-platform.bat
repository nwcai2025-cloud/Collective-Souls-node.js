@echo off
REM ========================================
REM Start Platform Script for Windows
REM Starts both backend and frontend
REM ========================================

echo ========================================
echo   Collective Souls - Starting Platform
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm start"
echo      Backend starting on port 3004...
echo.

echo [2/2] Starting Frontend Development Server...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "npm run dev"
echo      Frontend starting on port 8080...
echo.

cd /d "%~dp0"

echo ========================================
echo   Platform Started Successfully!
echo ========================================
echo.
echo   Backend:  http://localhost:3004
echo   Frontend: http://localhost:8080
echo   Network:  http://192.168.4.24:8080
echo.
echo   Press any key to close this window...
echo   (Servers will continue running in background)
pause >nul