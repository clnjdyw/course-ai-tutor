# 课程辅导 AI 系统 - 综合测试脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "课程辅导 AI 系统 - 综合测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到脚本所在目录
Set-Location $PSScriptRoot

# [1/4] 检查依赖
Write-Host "[1/4] 检查依赖..." -ForegroundColor Yellow
if (-Not (Test-Path "node_modules")) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    npm install
}

# [2/4] 安装xlsx库
Write-Host ""
Write-Host "[2/4] 安装xlsx库用于生成Excel报告..." -ForegroundColor Yellow
npm install xlsx

# [3/4] 运行Playwright测试
Write-Host ""
Write-Host "[3/4] 运行Playwright测试..." -ForegroundColor Yellow
Write-Host "注意: 请确保前端(http://localhost:5173)和后端(http://localhost:8081)已启动" -ForegroundColor Red
Write-Host ""
Write-Host "按任意键继续测试..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

npx playwright test tests/e2e/comprehensive-test.spec.cjs --config=playwright.config.cjs --reporter=list

# [4/4] 生成Excel报告
Write-Host ""
Write-Host "[4/4] 生成Excel测试报告..." -ForegroundColor Yellow
node tests/generate-excel-report.cjs

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "测试完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "查看报告:" -ForegroundColor Cyan
Write-Host "  - Excel报告: test-report.xlsx" -ForegroundColor White
Write-Host "  - 测试截图: test-screenshots\" -ForegroundColor White
Write-Host "  - 测试结果: test-results.json" -ForegroundColor White
Write-Host ""
