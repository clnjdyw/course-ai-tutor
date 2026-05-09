@echo off
chcp 65001 >nul
echo ========================================
echo 课程辅导 AI 系统 - 综合测试
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 检查依赖...
if not exist "node_modules" (
    echo 安装依赖...
    npm install
)

echo.
echo [2/4] 安装xlsx库用于生成Excel报告...
npm install xlsx

echo.
echo [3/4] 运行Playwright测试...
echo 注意: 请确保前端(http://localhost:5173)和后端(http://localhost:8081)已启动
echo.
pause

npx playwright test tests/e2e/comprehensive-test.spec.cjs --config=playwright.config.cjs --reporter=list

echo.
echo [4/4] 生成Excel测试报告...
node tests/generate-excel-report.cjs

echo.
echo ========================================
echo 测试完成!
echo ========================================
echo.
echo 查看报告:
echo   - Excel报告: test-report.xlsx
echo   - 测试截图: test-screenshots\
echo   - 测试结果: test-results.json
echo.
pause
