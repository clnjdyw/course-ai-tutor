# 🎉 前后端已连接！

## ✅ 连接状态

| 服务 | 状态 | 端口 | 地址 |
|------|------|------|------|
| **前端** | ✅ 运行中 | 3001 | http://localhost:3001 |
| **后端** | ✅ 运行中 | 8081 | http://localhost:8081 |
| **代理** | ✅ 已配置 | - | /api → localhost:8081 |

---

## 🌐 访问地址

### 前端（用户界面）
```
本地：http://localhost:3001
局域网：http://172.24.51.55:3001
公网：http://106.14.186.171:3001
```

### 后端（API 服务）
```
本地：http://localhost:8081
局域网：http://172.24.51.55:8081
公网：http://106.14.186.171:8081
```

---

## 🔌 连接架构

```
┌─────────────────────────────────────┐
│          用户浏览器                  │
│          http://localhost:3001      │
└─────────────┬───────────────────────┘
              │
              │ HTTP 请求
              │ /api/planner/plan
              ▼
┌─────────────────────────────────────┐
│       Vite Dev Server (前端)        │
│       Port: 3001                    │
│                                     │
│   Proxy: /api → http://localhost:8081│
└─────────────┬───────────────────────┘
              │
              │ 转发 API 请求
              ▼
┌─────────────────────────────────────┐
│    Express Mock Backend (后端)      │
│    Port: 8081                       │
│                                     │
│  - /api/planner/plan               │
│  - /api/tutor/teach                │
│  - /api/helper/answer              │
│  - /api/evaluator/evaluate         │
└─────────────────────────────────────┘
```

---

## 📊 API 接口

### 1. 学习规划 API

**请求**：
```bash
curl -X POST http://localhost:8081/api/planner/plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "goal": "学习 Spring Boot",
    "currentLevel": "BEGINNER",
    "availableTime": "每天 2 小时"
  }'
```

**响应**：
```json
{
  "success": true,
  "planContent": "# 📚 个性化学习计划\n\n## 学习目标\n...",
  "agentType": "planner"
}
```

### 2. 智能教学 API

**请求**：
```bash
curl -X POST http://localhost:8081/api/tutor/teach \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "topic": "什么是依赖注入？",
    "level": "BEGINNER"
  }'
```

**响应**：
```json
{
  "success": true,
  "content": "# 什么是依赖注入？\n\n## 定义\n...",
  "topic": "依赖注入",
  "agentType": "tutor"
}
```

### 3. 实时答疑 API

**请求**：
```bash
curl -X POST http://localhost:8081/api/helper/answer \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "question": "IOC 和 DI 有什么区别？"
  }'
```

**响应**：
```json
{
  "success": true,
  "answer": "# IOC 和 DI 的区别\n\n## IOC（控制反转）\n...",
  "question": "IOC 和 DI 的区别",
  "agentType": "helper"
}
```

### 4. 学习评估 API

**请求**：
```bash
curl -X POST http://localhost:8081/api/evaluator/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "exerciseId": 1,
    "question": "什么是 IOC?",
    "studentAnswer": "IOC 是控制反转...",
    "correctAnswer": "IOC 是一种设计思想..."
  }'
```

**响应**：
```json
{
  "success": true,
  "feedback": "# 作业批改结果\n\n## 评分：85 分 ⭐⭐⭐⭐\n...",
  "score": 85,
  "agentType": "evaluator"
}
```

---

## 🎯 测试连接

### 测试 1：健康检查
```bash
curl http://localhost:8081/api/health
# {"status":"ok","timestamp":"..."}
```

### 测试 2：前端代理
```bash
curl http://localhost:3001/api/health
# 应该返回相同结果（通过 Vite 代理）
```

### 测试 3：公网访问
```bash
curl http://106.14.186.171:8081/api/health
# 从外网访问后端
```

---

## 🎨 前端界面

现在访问前端可以看到完整功能：

### 1. 学习规划
- 输入学习目标
- 点击"生成学习计划"
- **AI 会返回详细的学习计划**

### 2. 智能教学
- 输入想学的知识点
- 点击"发送"
- **AI 会详细讲解该知识点**

### 3. 实时答疑
- 输入问题
- 点击"提交问题"
- **AI 会给出详细解答**

### 4. 学习评估
- 填写作业信息
- 点击"开始批改"
- **AI 会评分并给出反馈**

---

## 📝 配置文件

### 前端代理配置 (vite.config.js)
```javascript
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',  // 后端地址
        changeOrigin: true
      }
    }
  }
}
```

### 后端服务配置 (server.js)
```javascript
const PORT = 8081

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务地址：http://0.0.0.0:${PORT}`)
})
```

---

## 🚀 启动命令

### 启动后端
```bash
cd ~/.openclaw/workspace/course-ai-tutor-mock
node server.js
```

### 启动前端
```bash
cd ~/.openclaw/workspace/course-ai-tutor-frontend
npm run dev -- --host
```

### 同时启动（使用两个终端）
```bash
# 终端 1 - 后端
node ~/.openclaw/workspace/course-ai-tutor-mock/server.js

# 终端 2 - 前端
cd ~/.openclaw/workspace/course-ai-tutor-frontend && npm run dev -- --host
```

---

## 📊 服务状态监控

### 查看进程
```bash
# 前端进程
ps aux | grep vite

# 后端进程
ps aux | grep node
```

### 查看端口
```bash
# 前端端口
netstat -tlnp | grep 3001

# 后端端口
netstat -tlnp | grep 8081
```

### 查看日志
- **前端日志**：在运行前端的终端窗口
- **后端日志**：在运行后端的终端窗口

---

## 🔧 故障排查

### 问题 1：前端无法调用 API

**检查**：
```bash
# 1. 后端是否运行
curl http://localhost:8081/api/health

# 2. 代理是否配置
cat ~/.openclaw/workspace/course-ai-tutor-frontend/vite.config.js

# 3. 前端是否重启
ps aux | grep vite
```

**解决**：
```bash
# 重启前端
cd ~/.openclaw/workspace/course-ai-tutor-frontend
# Ctrl+C 停止
npm run dev -- --host
```

### 问题 2：后端返回错误

**检查**：
```bash
# 查看后端日志
# 在运行后端的终端窗口查看

# 测试 API
curl -X POST http://localhost:8081/api/planner/plan \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"goal":"test"}'
```

### 问题 3：公网无法访问

**检查**：
```bash
# 检查防火墙
sudo iptables -L INPUT -n | grep 8081

# 检查端口监听
netstat -tlnp | grep 8081
```

**解决**：
```bash
# 开放端口
sudo iptables -I INPUT -p tcp --dport 8081 -j ACCEPT
```

---

## 🎉 完成！

**前后端已完全连接！** 🎊

现在访问 http://localhost:3001 或 http://106.14.186.171:3001 即可体验完整功能！

---

**创建时间**: 2026-03-06 00:15  
**前端**: ✅ http://106.14.186.171:3001  
**后端**: ✅ http://106.14.186.171:8081  
**状态**: ✅ 已连接
