@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo   课程辅导 AI 智能体 - 一键启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js >= 18
    pause
    exit /b 1
)

echo Node.js 已检测到，开始启动...
echo.

REM 启动后端（新窗口）
start "后端服务 - 8081" cmd /k "cd /d "%~dp0course-ai-tutor-backend" && echo 正在启动后端... && node src/server.js"
echo [+] 后端正在启动... (端口 8081)

REM 等待后端先启动
timeout /t 3 /nobreak >nul

REM 启动前端（新窗口）
start "前端服务 - 5173" cmd /k "cd /d "%~dp0course-ai-tutor-frontend" && echo 正在启动前端... && npm run dev"
echo [+] 前端正在启动... (端口 5173)

echo.
echo ========================================
echo   启动完成！
echo   后端：http://localhost:8081
echo   前端：http://localhost:5173
echo ========================================
echo.
echo 请在浏览器中打开：http://localhost:5173
echo.
echo 按任意键关闭此窗口（不影响已启动的服务）
pause >nul
