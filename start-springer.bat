@echo off
title Springer - Application Launcher
color 0A
cd /d "%~dp0"

echo.
echo  ============================================
echo    SPRINGER - Application Launcher
echo  ============================================
echo    - Creates database if missing
echo    - Runs Flyway migrations (schema + data)
echo    - Auto-validates schema (Hibernate)
echo    - Builds backend if needed
echo    - Installs frontend deps if needed
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
echo  [1/6] Checking prerequisites...

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
echo  [2/6] Checking MySQL service...
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

REM -- Test Database Connection & Create DB if needed --
echo.
echo  [3/6] Checking database...
powershell -command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('%DB_HOST%', %DB_PORT%); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARNING] Cannot reach MySQL at %DB_HOST%:%DB_PORT%
    set /p CONTINUE="  Continue anyway? (Y/N): "
    if /i not "%CONTINUE%"=="Y" exit /b 1
    goto skip_db_check
)

echo        MySQL ........... Connected
echo        Creating database if not exists...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;" 2>nul
if %errorlevel% equ 0 (
    echo        Database ........ Ready (%DB_NAME%)
    goto skip_db_check
)
echo  [WARNING] Could not create database. Ensure it exists manually.

:skip_db_check

REM -- Start Backend (skip if already running) --
echo.
echo  [4/6] Preparing backend...
cd /d "%~dp0springer"
if not exist "target" (
    echo        Building backend for first time...
    call %MVN_CMD% clean install -DskipTests
    if %errorlevel% neq 0 (
        echo  [ERROR] Backend build failed!
        pause
        exit /b 1
    )
    echo        Backend ......... Built
) else (
    echo        Backend ......... Already built
)
cd /d "%~dp0"

powershell -command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('localhost', %BACKEND_PORT%); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
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
powershell -command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('localhost', %BACKEND_PORT%); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
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
echo  [5/6] Preparing frontend...
cd /d "%~dp0springer_frontend"
if not exist "node_modules" (
    echo        Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo        Frontend ........ Dependencies installed
) else (
    echo        Frontend ........ Dependencies OK
)
cd /d "%~dp0"

echo  [6/6] Starting React frontend...
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
