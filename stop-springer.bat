@echo off
title Springer - Stop All Services
color 0C
cd /d "%~dp0"

echo.
echo  ============================================
echo    SPRINGER - Stopping Services
echo  ============================================
echo.

REM -- Load config to get ports --
if exist config.bat call config.bat
if "%BACKEND_PORT%"=="" set BACKEND_PORT=8080
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=5173

REM -- Kill backend by port --
echo  Stopping backend (port %BACKEND_PORT%)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT%" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  Backend ......... Stopped

REM -- Kill frontend by port --
echo  Stopping frontend (port %FRONTEND_PORT%)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT%" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  Frontend ........ Stopped

echo.
echo  ============================================
echo    All Springer services stopped.
echo  ============================================
echo.
pause >nul
