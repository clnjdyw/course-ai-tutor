# 🦞 OpenClaw Course AI Tutor Skills

基于 OpenClaw 的课程辅导 AI 智能体系统，用 6 个专业技能替换原有的 Spring AI 智能体。

## 📦 Skills 列表

| Skill | 功能 | 说明 |
|-------|------|------|
| `skill-agent-manager` | 智能体管理器 | 意图识别、请求路由、多智能体协调 |
| `skill-study-planner` | 学习规划 | 制定游戏化学习计划、关卡式目标拆解 |
| `skill-tutor` | 教学讲解 | 苏格拉底式教学、知识点讲解、练习题生成 |
| `skill-homework-helper` | 答疑辅导 | 作业帮助、问题解答、代码调试 |
| `skill-evaluator` | 评估批改 | 作业评分、学习报告、薄弱点分析 |
| `skill-companion` | 陪伴聊天 | 情感支持、情绪反馈、心理疏导 |

## 🚀 快速开始

### 前置要求

- Node.js >= 22.16.0 (推荐 Node 24)
- OpenClaw >= 1.0.0
- npm / pnpm / bun

### 1. 安装 OpenClaw

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

### 2. 初始化 OpenClaw

```bash
openclaw onboard --install-daemon
```

按照提示完成：
- Gateway 配置
- Workspace 设置
- 认证配置（API Key）
- 消息渠道连接（可选）

### 3. 安装 Skills

```bash
cd E:\download\course-ai-tutor-main\openclaw-skills

# 安装每个 skill
cd skill-agent-manager && npm install && cd ..
cd skill-study-planner && npm install && cd ..
cd skill-tutor && npm install && cd ..
cd skill-homework-helper && npm install && cd ..
cd skill-evaluator && npm install && cd ..
cd skill-companion && npm install && cd ..
```

### 4. 注册 Skills 到 OpenClaw

在 OpenClaw 配置中注册 skills：

```bash
openclaw skill link ./skill-agent-manager
openclaw skill link ./skill-study-planner
openclaw skill link ./skill-tutor
openclaw skill link ./skill-homework-helper
openclaw skill link ./skill-evaluator
openclaw skill link ./skill-companion
```

### 5. 配置 AI 模型

编辑 OpenClaw 配置文件（通常在 `~/.openclaw/config.json`）：

```json
{
  "ai": {
    "provider": "siliconflow",
    "apiKey": "your-api-key",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

### 6. 启动 Gateway

```bash
openclaw gateway --port 18789 --verbose
```

### 7. 测试 Skills

```bash
# 测试智能体管理器
openclaw skill run skill-agent-manager handleMessage \
  --message "我想制定一个学习计划" \
  --userId 1

# 测试陪伴智能体
openclaw skill run skill-companion chat \
  --message "你好" \
  --userId 1
```

## 📡 API 接口

### 统一请求入口

所有智能体通过 `skill-agent-manager` 统一入口访问：

```javascript
// 发送消息
openclaw skill run skill-agent-manager handleMessage {
  "message": "我想学习 Python",
  "userId": 1,
  "context": {}
}

// 获取智能体状态
openclaw skill run skill-agent-manager getStatus

// 获取智能体列表
openclaw skill run skill-agent-manager getList
```

### 直接调用各 Skill

```javascript
// 学习规划
openclaw skill run skill-study-planner createPlan {
  "userId": 1,
  "goal": "学习 Python 编程",
  "currentLevel": "beginner",
  "availableTime": "每天 1 小时"
}

// 教学讲解
openclaw skill run skill-tutor teach {
  "userId": 1,
  "topic": "什么是变量",
  "studentLevel": "beginner"
}

// 答疑辅导
openclaw skill run skill-homework-helper answer {
  "userId": 1,
  "content": "这个代码为什么报错？",
  "subject": "编程"
}

// 作业评估
openclaw skill run skill-evaluator evaluateHomework {
  "userId": 1,
  "homeworkContent": "学生答案...",
  "standardAnswer": "参考答案..."
}

// 陪伴聊天
openclaw skill run skill-companion chat {
  "userId": 1,
  "message": "今天学习好累啊"
}
```

## 🎯 智能路由规则

`skill-agent-manager` 根据关键词自动识别意图并路由：

| 意图 | 关键词 | 路由到 |
|------|--------|--------|
| 学习规划 | 计划、规划、安排、目标、时间表 | skill-study-planner |
| 教学讲解 | 讲解、教学、知识点、概念、什么是 | skill-tutor |
| 答疑辅导 | 问题、答疑、帮助、怎么做、为什么 | skill-homework-helper |
| 评估批改 | 评估、批改、评分、检查、作业 | skill-evaluator |
| 陪伴聊天 | 你好、聊天、心情、开心、难过 | skill-companion |

## 🌈 情绪反馈系统

`skill-companion` 根据学生学习表现自动调整情绪：

| 正确率 | 情绪 | 表现 |
|--------|------|------|
| > 80% | 😊 HAPPY | 开心、表扬 |
| > 80% + 连续 7 天 | 🤩 EXCITED | 兴奋、庆祝 |
| 50-80% | 🙂 NEUTRAL | 肯定、鼓励 |
| < 50% | 😔 CONCERNED | 安慰、鼓励 |

## 🔧 配置说明

### 环境变量

```bash
# AI 配置
export OPENCLAW_AI_PROVIDER=siliconflow
export OPENCLAW_AI_API_KEY=your-api-key
export OPENCLAW_AI_BASE_URL=https://api.siliconflow.cn/v1
export OPENCLAW_AI_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct

# Gateway 配置
export OPENCLAW_GATEWAY_PORT=18789
export OPENCLAW_GATEWAY_VERBOSE=true
```

### 消息渠道（可选）

OpenClaw 支持多种消息渠道，学生可以通过以下方式访问 AI 导师：

- 💬 微信 / QQ
- 📱 Telegram / WhatsApp
- 💻 Discord / Slack
- 🌐 Web Chat
- 📧 Email

配置渠道请参考 [OpenClaw 官方文档](https://openclaw.io/docs)

## 📊 系统架构

```
┌─────────────────────────────────────────┐
│         学生（多种渠道访问）              │
│   微信 / QQ / Web / Telegram / ...       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         OpenClaw Gateway                │
│         (端口 18789)                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      skill-agent-manager                │
│   (意图识别 + 智能路由)                   │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│Planner │  │ Tutor  │  │ Helper │
└────────┘  └────────┘  └────────┘
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│Evaluator│ │Companion│ │  AI    │
└────────┘  └────────┘  │ Model  │
                         └────────┘
```

## 🎓 使用示例

### 制定学习计划

```bash
openclaw skill run skill-study-planner createPlan '{
  "userId": 1,
  "goal": "学习 Python 编程基础",
  "currentLevel": "beginner",
  "availableTime": "每天 1 小时，周末 2 小时",
  "preference": "喜欢动手实践"
}'
```

### 苏格拉底式教学

```bash
openclaw skill run skill-tutor teach '{
  "userId": 1,
  "topic": "什么是循环",
  "studentLevel": "beginner"
}'
```

### 作业批改

```bash
openclaw skill run skill-evaluator evaluateHomework '{
  "userId": 1,
  "homeworkContent": "print(\"Hello World\")",
  "standardAnswer": "使用 print 函数输出字符串"
}'
```

### 情绪反馈

```bash
openclaw skill run skill-companion moodFeedback '{
  "userId": 1,
  "accuracy": 85,
  "questionCount": 20,
  "streakDays": 5
}'
```

## 📝 开发新 Skills

### Skill 结构

```
skill-name/
├── package.json
├── index.js          # 主要代码
├── README.md         # 说明文档
└── test/             # 测试文件
```

### 导出格式

```javascript
export const skill = {
  name: 'skill-name',
  version: '1.0.0',
  description: '技能描述',
  
  actions: {
    async actionName(params) {
      // 实现逻辑
      return { success: true, ... };
    }
  }
};
```

## 🔍 调试

### 查看日志

```bash
# 启动 verbose 模式
openclaw gateway --verbose

# 查看特定 skill 日志
openclaw logs skill-agent-manager
```

### 测试工具

```bash
# 测试 skill
openclaw skill test skill-name

# 检查配置
openclaw doctor
```

## 📚 相关文档

- [OpenClaw 官方文档](https://openclaw.io/docs)
- [Getting Started](https://openclaw.io/docs/getting-started)
- [Skills 开发指南](https://openclaw.io/docs/skills)
- [原 Spring AI 项目文档](../course-ai-tutor-spring/README.md)

## 🎉 完成！

现在你已经成功将 Spring AI 智能体系统迁移到 OpenClaw！

**优势：**
- ✅ 支持多种消息渠道（微信、QQ、Telegram 等）
- ✅ 更灵活的技能系统
- ✅ 本地运行，隐私安全
- ✅ 易于扩展和维护

**下一步：**
1. 配置消息渠道，让学生可以通过微信/QQ 访问
2. 根据实际需求调整各 Skill 的提示词
3. 添加数据库支持，持久化学习数据
4. 开发前端界面（可选）

---

**更新时间**: 2026-04-17  
**状态**: ✅ 已完成  
**Skills**: 6 个在线
