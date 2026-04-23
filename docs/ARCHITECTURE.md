# 系统架构文档

## 整体架构

本系统采用**中枢智能体 + 子智能体 + 共享知识库 + 思维链引擎**的架构设计。

```
┌─────────────────────┐
│   Vue 3 前端         │  :5173 (dev) / :3001 (prod)
└──────────┬──────────┘
           │ HTTP/REST + JWT
           ▼
┌─────────────────────┐
│  Node.js 主后端      │  :8081
│  ┌───────────────┐  │
│  │  MainAgent    │  │  中枢协调、意图解析
│  │  TutorAgent   │  │  知识讲解
│  │  HelperAgent  │  │  答疑辅导
│  │  PlannerAgent │  │  学习规划
│  │  Evaluator    │  │  学习评估
│  │  Companion    │  │  情感陪伴
│  └───────────────┘  │
│  SharedKnowledgeBase│  共享数据层
│  ChainOfThought     │  思维链引擎
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────┐
│ SQLite  │  │ RAG 服务  │  :8083
│ (sql.js)│  │ 知识库    │
└─────────┘  └──────────┘
```

## 核心组件

### MainAgent — 中枢智能体
**文件**: `course-ai-tutor-backend/src/agents/MainAgent.js`

负责接收用户输入、解析意图、调度子智能体。

```javascript
parseIntent(userInput)        // 解析用户意图
handleRequest(userId, input)  // 处理用户请求
dispatchTask(taskType, ctx)   // 调度任务到子智能体
registerSubAgent(name, agent) // 注册子智能体
```

### SharedKnowledgeBase — 共享知识库
**文件**: `course-ai-tutor-backend/src/agents/SharedKnowledgeBase.js`

智能体间的数据共享层，基于 SQLite 实现。

数据表：
- `agent_shared_data` — 共享数据
- `agent_events` — 事件总线
- `agent_registry` — 智能体注册表

### ChainOfThoughtEngine — 思维链引擎
**文件**: `course-ai-tutor-backend/src/agents/ChainOfThoughtEngine.js`

预设推理路径：

| 路径 | 触发场景 | 步骤 |
|------|---------|------|
| `knowledge_teaching` | 知识讲解 | 用户画像 → 知识点 → 教学内容 → 学习记录 |
| `qa_answering` | 智能问答 | 意图解析 → 上下文 → 知识检索 → 个性化回答 |
| `personalized_learning` | 学习规划 | 用户画像 → 进度分析 → 知识图谱 → 规划生成 |
| `wrong_question_review` | 错题复习 | 错题收集 → 薄弱分析 → 复习内容 → 掌握更新 |
| `psychological_counseling` | 心理辅导 | 情绪检测 → 历史交互 → 辅导内容 → 情绪记录 |

## 智能体列表

| 智能体 | 文件 | 意图类型 | 职责 |
|--------|------|---------|------|
| MainAgent | `agents/MainAgent.js` | — | 中枢协调 |
| TutorAgent | `agents/sub-agents/tutor.js` | `teaching` | 知识讲解 |
| HelperAgent | `agents/sub-agents/helper.js` | `question` | 答疑辅导 |
| PlannerAgent | `agents/sub-agents/planner.js` | `planning` | 学习规划 |
| EvaluatorAgent | `agents/sub-agents/evaluator.js` | `review` | 学习评估 |
| CompanionAgent | `agents/sub-agents/companion.js` | `counseling` | 情感陪伴 |

## API 接口

```
POST /api/agent/request          统一智能体入口
POST /api/agent/request/stream   流式响应
POST /api/agent/chat             聊天（含情绪反馈）
GET  /api/agent/status           智能体状态
GET  /api/agent/list             智能体列表
GET  /api/agent/paths            思维链路径
POST /api/agent/sync-user        同步用户信息
GET  /api/agent/knowledge/:key   获取共享知识
GET  /api/agent/events           获取事件列表
```

### 请求示例

```bash
# 统一入口
curl -X POST http://localhost:8081/api/agent/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"teaching","content":"讲解什么是循环结构"}'

# 聊天（含情绪反馈）
curl -X POST http://localhost:8081/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"你好"}'
```

## 扩展：添加新智能体

```javascript
// 1. 创建智能体文件
// src/agents/sub-agents/my-agent.js
export async function handle(context) {
  return { result: 'success' }
}

// 2. 在 MainAgent 中注册
import * as myAgent from './sub-agents/my-agent.js'
this.registerSubAgent('my-agent', myAgent)

// 3. 在 SharedKnowledgeBase 中注册
sharedKB.registerAgent('my-agent', 'custom', {
  description: '我的智能体',
  capabilities: ['capability1']
})
```

## OpenClaw Skills 扩展

OpenClaw Skills 是独立的 AI 技能扩展系统，运行在 :18789。

详见 [OPENCLAW_GUIDE.md](OPENCLAW_GUIDE.md)。
