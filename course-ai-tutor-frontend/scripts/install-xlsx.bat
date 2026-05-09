@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 安装xlsx依赖...
npm install xlsx
echo 安装完成!
pause
