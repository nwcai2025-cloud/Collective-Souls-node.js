@echo off
REM ========================================
REM Test Platform Script for Windows
REM Shows if everything is up and running
REM ========================================

echo ========================================
echo   Collective Souls - Platform Status
echo ========================================
echo.

set BACKEND_RUNNING=0
set FRONTEND_RUNNING=0

REM Check Backend (port 3004)
echo [Checking] Backend Server on port 3004...
netstat -ano | findstr ":3004" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo         [OK] Backend is running on port 3004
    set BACKEND_RUNNING=1
) else (
    echo         [OFF] Backend is NOT running
)

REM Check Frontend (port 8080)
echo [Checking] Frontend Server on port 8080...
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo         [OK] Frontend is running on port 8080
    set FRONTEND_RUNNING=1
) else (
    echo         [OFF] Frontend is NOT running
)

echo.
echo ========================================
echo   Platform Status Summary
echo ========================================
echo.

if %BACKEND_RUNNING% EQU 1 (
    echo   [OK] Backend:  http://localhost:3004
) else (
    echo   [OFF] Backend:  Not running
)

if %FRONTEND_RUNNING% EQU 1 (
    echo   [OK] Frontend: http://localhost:8080
    echo   [OK] Network:  http://192.168.4.24:8080
) else (
    echo   [OFF] Frontend: Not running
)

echo.

if %BACKEND_RUNNING% EQU 1 if %FRONTEND_RUNNING% EQU 1 (
    echo   Status: ALL SYSTEMS RUNNING
    echo.
) else if %BACKEND_RUNNING% EQU 0 if %FRONTEND_RUNNING% EQU 0 (
    echo   Status: ALL SYSTEMS DOWN
    echo   Run start-platform.bat to start the platform
    echo.
) else (
    echo   Status: PARTIALLY RUNNING
    echo.
)

echo Press any key to exit...
pause >nul