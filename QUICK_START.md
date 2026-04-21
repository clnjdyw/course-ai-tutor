# 快速启动指南

## 🚀 第一步：安装后端依赖

打开 **命令提示符(CMD)**（不是PowerShell），运行：

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
npm install
```

## 🚀 第二步：启动后端服务器

在 **命令提示符(CMD)** 中运行：

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
node src\server.js
```

或者直接双击运行：
```
e:\download\course-ai-tutor-main\course-ai-tutor-backend\start.bat
```

## 🚀 第三步：启动前端（如果需要）

打开**另一个命令提示符窗口**，运行：

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-frontend
npm install
npm run dev
```

## ✅ 验证成功

后端启动成功后，你应该看到：

```
========================================
   🚀 Course AI Tutor - Backend Server
========================================
   环境：development
   服务地址：http://0.0.0.0:8081
   本地访问：http://localhost:8081
   API 前缀：/api
========================================
✅ 后端服务已启动
✅ 数据库已连接
✅ JWT 认证已启用
========================================
```

然后在浏览器访问：`http://localhost:8081/api/health`

应该看到：
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.456
}
```

## ⚠️ 重要提示

1. **必须使用 CMD（命令提示符）**，不要使用 PowerShell
2. **必须先安装依赖**（npm install）
3. **后端必须先启动**，然后再启动前端
4. 如果端口8081被占用，可以修改 `.env` 文件中的 `PORT` 值
