@echo off
chcp 65001 >nul
echo ========================================
echo   OpenClaw Gateway 启动脚本
echo ========================================
echo.

cd /d "%~dp0openclaw-skills"

REM 检查配置文件
set CONFIG_FILE=%USERPROFILE%\.openclaw\config.json
if not exist "%CONFIG_FILE%" (
    echo [错误] 配置文件不存在：%CONFIG_FILE%
    echo 请先运行安装脚本：install-openclaw.bat
    pause
    exit /b 1
)

REM 检查 API Key
findstr /c:"YOUR_API_KEY_HERE" "%CONFIG_FILE%" >nul 2>&1
if not errorlevel 1 (
    echo [警告] API Key 尚未配置！
    echo 请编辑：%CONFIG_FILE%
    echo 将 "YOUR_API_KEY_HERE" 替换为你的实际 API Key
    echo.
    pause
)

echo 启动 OpenClaw Gateway...
echo 端口：18789
echo 工作目录：%CD%
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

openclaw gateway --port 18789 --verbose
