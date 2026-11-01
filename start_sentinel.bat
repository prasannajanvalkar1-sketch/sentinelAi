@echo off
title Sentinel SOC Launcher
cd /d "%~dp0"

echo ========================================================
echo         STARTING SENTINEL SOC PLATFORM
echo ========================================================
echo.

echo [1/3] Starting Telemetry Backend Server (Port 8000)...
start "Sentinel Backend Server" cmd /k "python standalone_soc_server.py"

echo [2/3] Starting React Dashboard (Port 5173)...
start "Sentinel Vite Dashboard" cmd /k "npm run dev"

echo [3/3] Starting Ngrok Tunnel (Port 8000)...
start "Ngrok Tunnel" cmd /k "ngrok http 8000"

echo.
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening Dashboard in your browser...
start http://localhost:3000

echo.
echo ========================================================
echo   ALL SYSTEMS ONLINE! 
echo   Your dashboard should now open at http://localhost:3000
echo ========================================================
pause

