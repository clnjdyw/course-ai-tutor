# 课程辅导 AI - 自动化 E2E 测试 (PowerShell)
# 用法: 在 course-ai-tutor-frontend 目录下运行 .\run-tests.ps1

$ErrorActionPreference = "Stop"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  课程辅导 AI - 自动化 E2E 测试" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Step 1: 安装依赖
Write-Host "[1/4] 检查并安装依赖..." -ForegroundColor Yellow
npm install --silent
Write-Host "  OK 依赖安装完成" -ForegroundColor Green

# Step 2: 安装浏览器
Write-Host ""
Write-Host "[2/4] 安装 Playwright 浏览器..." -ForegroundColor Yellow
try {
    & npx playwright install chromium 2>&1 | Out-Null
    Write-Host "  OK Chromium 就绪" -ForegroundColor Green
} catch {
    Write-Host "  WARN 浏览器安装可能有问题，继续..." -ForegroundColor Yellow
}

# Step 3: 启动 Vite
Write-Host ""
Write-Host "[3/4] 启动 Vite 开发服务器..." -ForegroundColor Yellow
$viteProcess = Start-Process -FilePath "npx" -ArgumentList "vite", "--port", "5173", "--strictPort" -PassThru -WindowStyle Hidden
Write-Host "  等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "  OK Vite 服务器已启动 (http://localhost:5173)" -ForegroundColor Green

# Step 4: 运行测试
Write-Host ""
Write-Host "[4/4] 运行 E2E 测试..." -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray

try {
    $output = & npx playwright test --config=playwright.config.cjs --reporter=list 2>&1
    $output | ForEach-Object { Write-Host $_ }
} catch {
    Write-Host $_ -ForegroundColor Red
}

Write-Host ""
Write-Host "--------------------------------------------" -ForegroundColor Gray

# 生成报告
Write-Host ""
Write-Host "生成中文测试报告..." -ForegroundColor Yellow
try {
    node tests\run-tests.cjs
} catch {
    Write-Host "  WARN 报告生成可能有问题: $_" -ForegroundColor Yellow
}

# 清理
Write-Host ""
Write-Host "停止 Vite 服务器..." -ForegroundColor Yellow
Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  测试完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "测试报告:" -ForegroundColor Cyan
Write-Host "  HTML: tests\reports\html\index.html"
Write-Host "  JSON: tests\reports\results.json"
Write-Host "  中文: tests\reports\测试报告_*.md"
Write-Host ""
