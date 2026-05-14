@echo off
REM ============================================================
REM  Springer - Local Configuration
REM  EACH TEAM MEMBER: Update DB_USER and DB_PASS for your setup
REM ============================================================

REM -- Database Settings --
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=Springer
set DB_USER=root
set DB_PASS=admin

REM -- Server Ports --
set BACKEND_PORT=8080
set FRONTEND_PORT=5173

REM -- MySQL Service Name (check yours in services.msc) --
set MYSQL_SERVICE=MySQL80

REM -- Browser URL --
set BROWSER_URL=http://localhost:%FRONTEND_PORT%
