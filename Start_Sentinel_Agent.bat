@echo off
title Sentinel Cyber Defense Agent
echo ========================================================
echo   SENTINEL AUTONOMOUS AGENT LAUNCHER
echo ========================================================
echo.
echo Starting Sentinel in background...
start pythonw sentinel_auto_agent.pyw
echo.
echo [+] Sentinel Agent is now running SILENTLY in the background!
echo [+] Auto-detecting real username, USB plug-ins, and screenshots.
echo.
timeout /t 3
exit

