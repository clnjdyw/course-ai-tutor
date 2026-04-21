@echo off
cd /d %~dp0
echo ========================================
echo    Starting Frontend Server
echo ========================================
call npm run dev
pause
