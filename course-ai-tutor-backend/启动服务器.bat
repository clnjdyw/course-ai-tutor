@echo off
chcp 65001 >nul
echo ========================================
echo    AI智能辅导系统 - 完整启动脚本
echo ========================================
echo.

echo [步骤1/3] 正在检查并安装后端依赖...
cd /d "%~dp0"
if not exist "node_modules" (
    echo.
    echo ⚠️  检测到未安装依赖，正在安装...
    echo 这可能需要1-2分钟，请稍候...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败！
        echo 请检查网络连接或手动运行：npm install
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [步骤2/3] 正在启动后端服务器...
echo.
echo ========================================
echo 🚀 后端服务器信息：
echo ========================================
echo 📡 地址：http://localhost:8081
echo 🔗 API：http://localhost:8081/api/health
echo 🧠 智能体：http://localhost:8081/api/agent/status
echo ========================================
echo.
echo 💡 提示：
echo - 保持此窗口打开以维持服务器运行
echo - 按 Ctrl+C 可停止服务器
echo.
echo ========================================

node src\server.js

echo.
echo ========================================
echo 服务器已停止
echo ========================================
pause
