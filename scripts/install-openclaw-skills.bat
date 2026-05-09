@echo off
chcp 65001 >nul
echo ========================================
echo   OpenClaw Course AI Tutor 快速安装脚本
echo ========================================
echo.

REM 检查 Node.js
echo [1/7] 检查 Node.js 版本...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js >= 22.16.0
    echo 下载地址：https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('node --version') do set NODE_VERSION=%%i
echo [成功] Node.js 版本：%NODE_VERSION%
echo.

REM 安装 OpenClaw
echo [2/7] 安装 OpenClaw...
npm install -g openclaw@latest
if %errorlevel% neq 0 (
    echo [错误] OpenClaw 安装失败
    pause
    exit /b 1
)
echo [成功] OpenClaw 安装完成
echo.

REM 验证 OpenClaw
echo [3/7] 验证 OpenClaw 安装...
openclaw --version
echo.

REM 创建 Skills 目录（如果不存在）
echo [4/7] 检查 Skills 目录...
if not exist "%~dp0openclaw-skills" (
    echo [错误] openclaw-skills 目录不存在
    pause
    exit /b 1
)
echo [成功] Skills 目录存在
echo.

REM 安装所有 Skills
echo [5/7] 安装 Skills 依赖...
cd /d "%~dp0openclaw-skills"

for /d %%i in (skill-*) do (
    echo 安装 %%i...
    cd "%%i"
    call npm install
    cd ..
)
echo [成功] 所有 Skills 依赖安装完成
echo.

REM 注册 Skills
echo [6/7] 注册 Skills 到 OpenClaw...
for /d %%i in (skill-*) do (
    echo 注册 %%i...
    openclaw skill link .\%%i
)
echo [成功] Skills 注册完成
echo.

REM 检查配置
echo [7/7] 检查 OpenClaw 配置...
openclaw doctor
echo.

echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 下一步：
echo 1. 配置 AI Key: openclaw config set ai.apiKey YOUR_API_KEY
echo 2. 启动 Gateway: openclaw gateway --port 18789 --verbose
echo 3. 测试 Skills: openclaw skill run skill-companion chat --message "你好" --userId 1
echo.
echo 详细文档：%~dp0OPENCLAW_INTEGRATION.md
echo.
pause
