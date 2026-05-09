@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   Course AI Tutor - E2E Test
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Install dependencies...
call npm install
if %errorlevel% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

echo [2/4] Install Playwright browser...
call npx playwright install chromium
echo.

echo [3/4] Start Vite dev server...
start "Vite Server" cmd /c "npx vite --port 5173"
echo Waiting for server...
timeout /t 8 /nobreak >nul
echo.

echo [4/4] Run E2E tests...
call npx playwright test --config=playwright.config.cjs --reporter=list
echo.

echo ============================================
echo   Test Complete
echo ============================================
echo.
echo Reports:
echo   HTML: tests\reports\html\index.html
echo   JSON: tests\reports\results.json
echo   Markdown: tests\reports\*.md
echo.

echo Generating Chinese report...
call node tests\run-tests.cjs
echo.

pause
