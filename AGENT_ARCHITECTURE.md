# 🧠 智能体联动系统架构文档

## 📋 系统架构概述

本系统采用 **中枢智能体 + 子智能体 + 共享知识库 + 思维链引擎** 的架构设计，实现各功能模块的智能化联动。

---

## 🏗️ 核心组件

### 1. 中枢智能体 (Main Agent)
**位置**: `src/agents/MainAgent.js`

**职责**:
- 接收用户输入
- 解析用户意图
- 调度子智能体执行任务
- 协调各模块间的交互

**核心方法**:
```javascript
- parseIntent(userInput)        // 解析用户意图
- handleRequest(userId, input)  // 处理用户请求
- dispatchTask(taskType, ctx)   // 调度任务到子智能体
- registerSubAgent(name, agent) // 注册子智能体
```

---

### 2. 共享知识库 (Shared Knowledge Base)
**位置**: `src/agents/SharedKnowledgeBase.js`

**职责**:
- 存储用户信息、学习数据、知识点结构
- 管理智能体间的事件通信
- 维护智能体注册表
- 提供统一的数据访问接口

**核心方法**:
```javascript
- set(key, value, agentType)           // 存储共享数据
- get(key)                             // 获取共享数据
- publishEvent(type, source, target)   // 发布事件
- getEvents(targetAgent, limit)        // 获取事件
- registerAgent(name, type, caps)      // 注册智能体
- getUserProfile(userId)               // 获取用户完整画像
- updateLearningRecord(userId, record) // 更新学习记录
```

**数据表结构**:
- `agent_shared_data` - 共享数据表
- `agent_events` - 事件总线表
- `agent_registry` - 智能体注册表

---

### 3. 思维链引擎 (Chain-of-Thought Engine)
**位置**: `src/agents/ChainOfThoughtEngine.js`

**职责**:
- 定义不同场景下的推理路径
- 管理模块调用顺序
- 执行思维链流程

**预设推理路径**:

#### ① 知识讲解思维链 (knowledge_teaching)
```
用户中心 → 知识点管理 → 教学智能体 → 学习记录
1. 获取用户画像和学习偏好
2. 获取知识点结构和依赖关系
3. 生成教学内容
4. 更新学习记录
```

#### ② 智能问答思维链 (qa_answering)
```
中枢解析 → 用户上下文 → 知识检索 → 答疑智能体 → 交互记录
1. 解析用户问题意图
2. 获取用户上下文
3. 从知识库检索相关信息
4. 生成个性化回答
5. 记录交互历史
```

#### ③ 个性化学习思维链 (personalized_learning)
```
用户中心 → 进度分析 → 知识图谱 → 规划智能体 → 题库生成 → 学习提醒
1. 获取用户完整画像
2. 分析学习进度和薄弱环节
3. 获取知识点图谱
4. 生成个性化学习规划
5. 生成自定义题库
6. 设置学习提醒
```

#### ④ 错题复习思维链 (wrong_question_review)
```
错题收集 → 薄弱分析 → 复习内容 → 相似练习 → 掌握更新
1. 获取错题列表
2. 分析薄弱知识点
3. 生成复习内容
4. 生成相似练习题
5. 更新掌握程度
```

#### ⑤ 心理辅导思维链 (psychological_counseling)
```
情绪检测 → 历史交互 → 心理辅导 → 情绪记录
1. 检测用户情绪状态
2. 获取用户历史交互
3. 生成心理辅导内容
4. 记录情绪状态
```

---

## 🔄 模块联动逻辑

### 用户中心模块
```
功能: 管理用户身份、角色、偏好、学习目标
联动:
  用户登录 → 同步用户信息到共享知识库
  其他模块 → 从共享知识库读取用户画像
```

### 智能问答模块
```
功能: 提供知识解答、习题模拟、心理辅导
联动:
  接收问题 → 中枢智能体解析意图
  选择子智能体 → 从共享知识库获取用户数据
  生成回答 → 更新学习记录
```

### 知识点管理模块
```
功能: 拆分、结构化知识点，关联智能体
联动:
  知识点拆分 → 建立依赖关系图
  存储到共享知识库 → 供其他模块调用
  遇到困难 → 动态调整学习路径
```

### 个性化学习模块
```
功能: 生成学习规划和题库
联动:
  获取学习进度 → 分析薄弱环节
  结合知识图谱 → 生成学习路径
  实时更新状态 → 反馈给问答模块
```

### 辅助功能模块
```
功能: 笔记、错题收集、学习提醒
联动:
  自动收集 → 存储到共享知识库
  错题记录 → 调整学习策略
  学习计划 → 触发提醒推送
```

---

## 📡 API 接口

### 智能体统一接口

#### 1. 统一请求入口
```
POST /api/agent/request
Body: {
  type: 'teaching|question|planning|review|counseling',
  content: '用户输入内容',
  context: {},
  knowledgeBaseId: '知识库ID'
}
```

#### 2. 聊天接口
```
POST /api/agent/chat
Body: {
  message: '消息内容',
  messageType: 'text|image|audio',
  imageUrl: '图片URL',
  audioUrl: '音频URL'
}
```

#### 3. 获取智能体状态
```
GET /api/agent/status
```

#### 4. 获取智能体列表
```
GET /api/agent/list
```

#### 5. 获取思维链路径
```
GET /api/agent/paths
```

#### 6. 同步用户信息
```
POST /api/agent/sync-user
Body: {
  learningGoal: '学习目标',
  subjectPreferences: ['学科偏好'],
  ...其他用户信息
}
```

#### 7. 获取共享知识
```
GET /api/agent/knowledge/:key
```

#### 8. 获取事件列表
```
GET /api/agent/events?limit=50
```

---

## 🎯 智能体交互流程示例

```
1. 用户登录
   ↓
2. 用户中心智能体同步用户信息到共享知识库
   ↓
3. 用户提问："我想学习Spring Boot"
   ↓
4. 中枢智能体解析问题类型 → 识别为"teaching"意图
   ↓
5. 选择"知识讲解思维链"路径
   ↓
6. 执行思维链步骤:
   - 步骤1: 从共享知识库获取用户画像
   - 步骤2: 获取Spring Boot知识点结构
   - 步骤3: 调用教学智能体生成内容
   - 步骤4: 更新学习记录
   ↓
7. 返回个性化教学内容
   ↓
8. 辅助功能智能体记录笔记
   ↓
9. 个性化学习智能体调整学习规划
```

---

## 🔧 扩展性设计

### 添加新的子智能体

1. 创建智能体类
```javascript
// src/agents/MyAgent.js
class MyAgent {
  async execute(context) {
    // 实现智能体逻辑
    return { result: 'success' }
  }
}
export default new MyAgent()
```

2. 注册到中枢智能体
```javascript
import mainAgent from './agents/MainAgent.js'
import myAgent from './agents/MyAgent.js'

mainAgent.registerSubAgent('my-agent', myAgent)
```

3. 注册到共享知识库
```javascript
import sharedKB from './agents/SharedKnowledgeBase.js'

sharedKB.registerAgent('my-agent', 'custom', {
  description: '我的智能体',
  capabilities: ['capability1', 'capability2']
})
```

---

## 📊 数据流管理

### 数据一致性保证
- 所有用户数据通过共享知识库统一管理
- 使用事件总线实现模块间松耦合通信
- 每次数据更新都记录时间戳

### 实时性保证
- 智能体执行任务时实时读取共享知识库
- 任务完成后立即更新学习记录
- 事件发布后立即通知目标智能体

---

## 🚀 启动指南

### 启动后端服务器
```cmd
cd e:\download\course-ai-tutor-main\course-ai-tutor-backend
npm install
node src\server.js
```

### 验证智能体系统
```bash
# 获取智能体状态
curl http://localhost:8081/api/agent/status

# 获取思维链路径
curl http://localhost:8081/api/agent/paths

# 发送请求
curl -X POST http://localhost:8081/api/agent/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"teaching","content":"讲解Spring Boot"}'
```

---

## 📝 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite (sql.js)
- **架构模式**: 智能体架构 + 事件驱动
- **通信机制**: 共享知识库 + 事件总线

---

## ✨ 核心优势

1. **松耦合**: 各智能体通过共享知识库和事件总线通信
2. **可扩展**: 新智能体可通过注册快速接入
3. **智能化**: 思维链引擎实现复杂推理路径
4. **个性化**: 基于用户画像提供定制化服务
5. **闭环**: 数据在各模块间流动形成完整闭环

---

**版本**: v2.0  
**更新日期**: 2026-04-19
