@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   OpenClaw Course AI Tutor 完整安装脚本
echo ========================================
echo.

REM 检查 Node.js
echo [1/8] 检查 Node.js 版本...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js >= 22.16.0
    echo 下载地址：https://nodejs.org
    pause
    exit /b 1
)
echo [成功] Node.js 已安装
node --version
echo.

REM 设置 npm 镜像源
echo [2/8] 配置 npm 镜像源...
npm config set registry https://registry.npmmirror.com
echo [成功] 镜像源已设置为 npmmirror
echo.

REM 安装 OpenClaw
echo [3/8] 安装 OpenClaw...
echo 注意：如果安装失败，请手动运行：npm install -g openclaw@latest
call npm install -g openclaw@latest 2>&1 | findstr /v "npm notice"
if %errorlevel% neq 0 (
    echo [警告] OpenClaw 自动安装失败，请手动安装
    echo 运行：npm install -g openclaw@latest
    echo.
) else (
    echo [成功] OpenClaw 安装完成
)
echo.

REM 验证 OpenClaw
echo [4/8] 验证 OpenClaw 安装...
openclaw --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] OpenClaw 未正确安装，请检查上方错误信息
    echo.
) else (
    echo [成功] OpenClaw 已安装
    openclaw --version
)
echo.

REM 安装 Skills 依赖
echo [5/8] 安装 Skills 依赖...
cd /d "%~dp0openclaw-skills"
for /d %%i in (skill-*) do (
    echo 安装 %%i...
    cd "%%i"
    call npm install --silent
    cd ..
)
echo [成功] Skills 依赖安装完成
echo.

REM 创建 OpenClaw 配置目录
echo [6/8] 创建配置目录...
if not exist "%USERPROFILE%\.openclaw" mkdir "%USERPROFILE%\.openclaw"
echo [成功] 配置目录已创建
echo.

REM 创建配置文件
echo [7/8] 创建配置文件...
set CONFIG_FILE=%USERPROFILE%\.openclaw\config.json
if not exist "%CONFIG_FILE%" (
    echo 创建默认配置文件...
    (
        echo {
        echo   "ai": {
        echo     "provider": "openai",
        echo     "apiKey": "YOUR_API_KEY_HERE",
        echo     "baseUrl": "https://api.siliconflow.cn/v1",
        echo     "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
        echo     "temperature": 0.7,
        echo     "maxTokens": 2048
        echo   },
        echo   "gateway": {
        echo     "port": 18789,
        echo     "verbose": true
        echo   },
        echo   "workspace": "course-ai-tutor",
        echo   "moodSystem": {
        echo     "enabled": true
        echo   }
        echo }
    ) > "%CONFIG_FILE%"
    echo [成功] 配置文件已创建：%CONFIG_FILE%
    echo.
    echo [重要] 请编辑配置文件，设置你的 API Key：
    echo   1. 打开：%CONFIG_FILE%
    echo   2. 将 "YOUR_API_KEY_HERE" 替换为你的实际 API Key
    echo.
) else (
    echo [信息] 配置文件已存在：%CONFIG_FILE%
)
echo.

REM 注册 Skills
echo [8/8] 注册 Skills 到 OpenClaw...
cd /d "%~dp0openclaw-skills"
for /d %%i in (skill-*) do (
    echo 注册 %%i...
    call openclaw skill link .\%%i 2>&1 | findstr /v "npm"
)
echo [完成] Skills 注册完成
echo.

echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 下一步操作：
echo.
echo 1. 配置 API Key
echo    编辑：%USERPROFILE%\.openclaw\config.json
echo    将 "YOUR_API_KEY_HERE" 替换为你的实际 API Key
echo.
echo 2. 启动 Gateway
echo    cd /d "%~dp0openclaw-skills"
echo    npm start
echo    或：openclaw gateway --port 18789 --verbose
echo.
echo 3. 测试 Skills
echo    openclaw skill run skill-companion chat --message "你好" --userId test_001
echo.
echo 4. 查看文档
echo    - openclaw-skills/README.md
echo    - openclaw-skills/MOOD_SYSTEM_COMPLETE.md
echo    - OPENCLAW_INTEGRATION.md
echo.
echo ========================================
echo.
pause
