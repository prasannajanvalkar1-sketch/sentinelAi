@echo off
title SentinelAI USB Watchdog
color 0A
cls
echo ================================================================
echo               SENTINEL AI - CLIENT USB WATCHDOG
echo ================================================================
echo Starting native Windows hardware monitor...
echo (No Python required! Works on any Windows 10/11 machine)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sentinel_usb_watcher.ps1"

pause
