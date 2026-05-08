@echo off
title Springer - Application Launcher
color 0A
cd /d "%~dp0"

echo.
echo  ============================================
echo    SPRINGER - Application Launcher
echo  ============================================
echo.

REM -- Load config --
if not exist config.bat (
    echo  [ERROR] config.bat not found!
    pause
    exit /b 1
)
call config.bat

REM -- Check prerequisites --
echo  [1/5] Checking prerequisites...

where java >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Java not found! Install JDK 21+
    pause
    exit /b 1
)
echo        Java ............ OK

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found! Install Node 18+
    pause
    exit /b 1
)
echo        Node.js ......... OK

if exist "springer\mvnw.cmd" (
    echo        Maven ........... OK (using mvnw)
    set MVN_CMD=mvnw.cmd
) else (
    where mvn >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [ERROR] Maven not found!
        pause
        exit /b 1
    )
    echo        Maven ........... OK
    set MVN_CMD=mvn
)

REM -- Check MySQL Service --
echo.
echo  [2/5] Checking MySQL service...
sc query %MYSQL_SERVICE% >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARNING] MySQL service "%MYSQL_SERVICE%" not found. Continuing...
) else (
    sc query %MYSQL_SERVICE% | findstr "RUNNING" >nul 2>&1
    if %errorlevel% neq 0 (
        echo        MySQL is stopped. Starting...
        net start %MYSQL_SERVICE% >nul 2>&1
        if %errorlevel% neq 0 (
            echo  [WARNING] Could not start MySQL. Run as Administrator or start manually.
            pause >nul
        ) else (
            echo        MySQL ........... Started
        )
    ) else (
        echo        MySQL ........... Running
    )
)

REM -- Test Database Connection --
echo.
echo  [3/5] Testing database connection...
powershell -command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('%DB_HOST%', %DB_PORT%); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARNING] Cannot reach MySQL at %DB_HOST%:%DB_PORT%
    set /p CONTINUE="  Continue anyway? (Y/N): "
    if /i not "%CONTINUE%"=="Y" exit /b 1
) else (
    echo        Database ........ Connected
)

REM -- Start Backend (skip if already running) --
echo.
echo  [4/5] Starting Spring Boot backend...
powershell -command "try { Invoke-WebRequest -Uri 'http://localhost:%BACKEND_PORT%/v3/api-docs' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo        Backend ......... Already Running
    goto backend_ready
)
start "Springer Backend" cmd /k "title Springer Backend & color 0B & cd /d %~dp0springer & %MVN_CMD% spring-boot:run"

REM -- Wait for backend --
echo        Waiting for backend to start...
set RETRIES=0
:wait_backend
timeout /t 5 /nobreak >nul
set /a RETRIES+=1
powershell -command "try { Invoke-WebRequest -Uri 'http://localhost:%BACKEND_PORT%/v3/api-docs' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo        Backend ......... Ready
    goto backend_ready
)
if %RETRIES% lss 24 (
    echo        Still waiting... (%RETRIES%/24)
    goto wait_backend
)
echo  [WARNING] Backend took too long. Starting frontend anyway...

:backend_ready

REM -- Start Frontend --
echo.
echo  [5/5] Starting React frontend...
start "Springer Frontend" cmd /k "title Springer Frontend & color 0E & cd /d %~dp0springer_frontend & npm run dev"

REM -- Open browser --
echo        Waiting for frontend to start...
timeout /t 5 /nobreak >nul
echo  Opening browser at %BROWSER_URL%
start "" "%BROWSER_URL%"

echo.
echo  ============================================
echo    Springer is running!
echo  ============================================
echo.
echo    Backend:  http://localhost:%BACKEND_PORT%
echo    Swagger:  http://localhost:%BACKEND_PORT%/swagger-ui.html
echo    Frontend: %BROWSER_URL%
echo.
echo    To stop: double-click stop-springer.bat
echo  ============================================
echo.
pause >nul
