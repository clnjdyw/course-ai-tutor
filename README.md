# 课程辅导 AI 系统

基于多智能体协作的 AI 辅导系统，包含 6 个 AI 智能体，支持学习规划、智能教学、实时答疑、学习评估和情感陪伴。

> ⚠️ **安全提示**：如果你克隆了此仓库，请立即前往 [DashScope 控制台](https://dashscope.aliyun.com) 撤销旧 API 密钥并生成新密钥。详见 [SECURITY.md](SECURITY.md)。

## 项目组成

| 服务 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| **Node.js 后端** | Express + Anthropic SDK | 8081 | 主后端，包含所有智能体和认证 |
| **Vue 3 前端** | Vue 3 + Vite + Element Plus | 5173 (dev) / 3001 (prod) | 用户界面 |
| **RAG 知识库** | Node.js + sql.js | 8083 | 知识库检索服务 |
| **OpenClaw Skills** | Node.js | 18789 | AI 技能扩展系统 |
| Spring Boot 后端 | Spring Boot 3 + Spring AI | 8082 | 可选，实验性 |
| Mock 服务器 | Node.js + Express | 8081 | 可选，用于无 API Key 测试 |

## 快速开始

详见 [QUICK_START.md](QUICK_START.md)。

### 1. 配置环境变量

```bash
cp course-ai-tutor-backend/.env.example course-ai-tutor-backend/.env
# 编辑 .env，填入你的 DashScope API Key
```

### 2. 启动后端

```cmd
cd course-ai-tutor-backend
npm install
node src\server.js
```

### 3. 启动前端

```cmd
cd course-ai-tutor-frontend
npm install
npm run dev
```

访问：http://localhost:5173

## 系统架构

```
┌─────────────────────┐
│   Vue 3 前端         │  :5173 (dev) / :3001 (prod)
└──────────┬──────────┘
           │ HTTP/REST + JWT
           ▼
┌─────────────────────┐
│  Node.js 主后端      │  :8081
│  ┌───────────────┐  │
│  │  MainAgent    │  │  中枢协调
│  │  TutorAgent   │  │  知识讲解
│  │  HelperAgent  │  │  答疑辅导
│  │  PlannerAgent │  │  学习规划
│  │  Evaluator    │  │  学习评估
│  │  Companion    │  │  情感陪伴
│  └───────────────┘  │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────┐
│ SQLite  │  │ RAG 服务  │  :8083
│ (sql.js)│  │ 知识库    │
└─────────┘  └──────────┘
```

## 6 个核心智能体

| 智能体 | 职责 |
|--------|------|
| **MainAgent** | 中枢协调，意图解析，任务调度 |
| **TutorAgent** | 知识点讲解，苏格拉底式教学 |
| **HelperAgent** | 答疑辅导，作业帮助 |
| **PlannerAgent** | 学习规划，目标拆解 |
| **EvaluatorAgent** | 学习评估，作业批改 |
| **CompanionAgent** | 情感支持，情绪反馈 |

## 情绪反馈系统

CompanionAgent 根据答题正确率动态调整教学策略：

| 情绪 | 触发条件 | 教学节奏 |
|------|---------|---------|
| 😊 开心 | 正确率 ≥ 80% | 正常 |
| 🤩 兴奋 | 正确率 ≥ 80% + 连续 7 天 | 快速，挑战升级 |
| 🙂 平静 | 正确率 50%-80% | 正常 |
| 😔 关心 | 正确率 < 50% | 慢速，耐心引导 |

## 主要 API

```
POST /api/auth/register     用户注册
POST /api/auth/login        用户登录
GET  /api/auth/me           获取当前用户

POST /api/agent/request     智能体统一入口
POST /api/agent/request/stream  流式响应
GET  /api/agent/status      智能体状态

GET  /api/knowledge         知识点列表
GET  /api/notes             笔记列表
GET  /api/wrong-questions   错题列表
GET  /api/progress          学习进度
GET  /api/health            健康检查
```

## 文档

- [快速开始](QUICK_START.md)
- [系统架构](docs/ARCHITECTURE.md)
- [OpenClaw 集成](docs/OPENCLAW_GUIDE.md)
- [RAG 知识库](docs/RAG_GUIDE.md)
- [部署指南](docs/DEPLOYMENT.md)
- [故障排除](TROUBLESHOOTING.md)
- [安全指南](SECURITY.md)

## 技术栈

- **后端**: Node.js 18+, Express 4, Anthropic SDK, sql.js, JWT, bcryptjs
- **前端**: Vue 3, Vite, Element Plus, ECharts, Axios
- **AI**: Claude API (通过 DashScope 代理)
- **数据库**: SQLite (嵌入式，通过 sql.js)

## 开发计划

- [x] 6 个核心智能体
- [x] 情绪反馈系统
- [x] JWT 认证
- [x] RAG 知识库集成
- [x] OpenClaw Skills 扩展
- [ ] 用户认证系统完善
- [ ] 生产级数据库（PostgreSQL）
- [ ] 单元测试覆盖
- [ ] Docker 部署支持

## 许可证

MIT License
