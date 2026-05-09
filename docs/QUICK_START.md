# 快速启动指南

## 前置条件

- Node.js >= 18（[下载](https://nodejs.org)）
- DashScope API Key（[获取](https://dashscope.aliyun.com)）

## 第一步：配置环境变量

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
copy .env.example .env
```

用文本编辑器打开 `.env`，填入你的 API Key：

```env
DASHSCOPE_API_KEY=your-actual-api-key-here
```

## 第二步：启动后端

打开 **CMD（命令提示符）**，运行：

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
npm install
node src\server.js
```

启动成功后看到：

```
========================================
   🚀 Course AI Tutor - Backend Server
========================================
   环境：development
   本地访问：http://localhost:8081
========================================
✅ 后端服务已启动
```

验证：浏览器访问 http://localhost:8081/api/health，返回 `{"status":"ok"}` 即成功。

## 第三步：启动前端

打开**另一个 CMD 窗口**：

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-frontend
npm install
npm run dev
```

访问：http://localhost:5173

## 可选：启动 RAG 知识库服务

```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-rag
npm install
node src\server.js
```

## 常见问题

**端口被占用**：修改 `course-ai-tutor-backend/.env` 中的 `PORT=8081` 为其他端口，同时更新前端 `.env` 中的 `VITE_API_BASE_URL`。

**npm 下载慢**：
```cmd
npm config set registry https://registry.npmmirror.com
```

**更多问题**：见 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
