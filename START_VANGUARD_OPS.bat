@echo off
title Vanguard Ops: Disaster Relief Platform
cd /d "%~dp0"

echo ==========================================================
echo   VANGUARD OPS: DISASTER RELIEF MANAGEMENT SYSTEM (TY SEM 1)
echo   Starting Server and Opening Web Dashboard...
echo ==========================================================

REM Open the web browser after a brief delay
start "" http://localhost:5000

REM Launch Node server
node server/index.js

if errorlevel 1 (
    echo.
    echo An error occurred while starting the server.
    pause
)
