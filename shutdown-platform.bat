@echo off
REM ========================================
REM Shutdown Platform Script for Windows
REM Stops all running platform processes
REM ========================================

echo ========================================
echo   Collective Souls - Shutting Down
echo ========================================
echo.

echo [1/3] Stopping Backend Server...
taskkill /F /FI "WINDOWTITLE eq Backend Server*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Backend Server*" >nul 2>&1
echo      Backend stopped.
echo.

echo [2/3] Stopping Frontend Server...
taskkill /F /FI "WINDOWTITLE eq Frontend Server*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Frontend Server*" >nul 2>&1
echo      Frontend stopped.
echo.

echo [3/3] Stopping all Node processes related to this project...
taskkill /F /IM node.exe >nul 2>&1
echo      All Node processes stopped.
echo.

echo ========================================
echo   Platform Shutdown Complete!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
