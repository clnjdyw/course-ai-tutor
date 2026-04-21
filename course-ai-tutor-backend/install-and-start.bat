@echo off
chcp 65001 >nul
echo ========================================
echo    AI智能辅导系统 - 一键启动脚本
echo ========================================
echo.

echo [1/3] 正在检查并安装后端依赖...
cd /d "%~dp0"
if not exist "node_modules" (
    echo 正在安装依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败！请检查网络连接或手动运行：npm install
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [2/3] 正在启动后端服务器...
echo.
echo ========================================
echo 后端服务器地址：http://localhost:8081
echo API文档：http://localhost:8081/api/health
echo ========================================
echo.

node src\server.js

pause
