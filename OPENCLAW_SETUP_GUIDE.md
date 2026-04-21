# 🦞 OpenClaw 集成指南 - 完整版

将 OpenClaw 完整集成到 Course AI Tutor 系统的详细步骤。

## 📋 前置要求

| 要求 | 版本 | 检查命令 |
|------|------|---------|
| **Node.js** | >= 22.16.0 (推荐 24) | `node --version` |
| **npm** | >= 10.0 | `npm --version` |
| **操作系统** | Windows 10+/macOS/Linux | - |
| **网络** | 可访问 npm 镜像源 | - |

## 🚀 快速集成（推荐）

### 步骤 1: 运行安装脚本

```bash
cd E:\download\course-ai-tutor-main
install-openclaw.bat
```

安装脚本会自动完成：
- ✅ 检查 Node.js 版本
- ✅ 配置 npm 镜像源
- ✅ 安装 OpenClaw
- ✅ 安装 Skills 依赖
- ✅ 创建配置文件
- ✅ 注册 Skills

### 步骤 2: 配置 API Key

编辑配置文件：
```
%USERPROFILE%\.openclaw\config.json
```

将 `YOUR_API_KEY_HERE` 替换为你的实际 API Key：
```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "sk-286b643e163489c7eb9038d8967cb69f",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

### 步骤 3: 启动 Gateway

```bash
cd E:\download\course-ai-tutor-main
start-gateway.bat
```

或手动启动：
```bash
cd openclaw-skills
npm start
```

### 步骤 4: 测试 Skills

```bash
# 测试陪伴智能体
openclaw skill run skill-companion chat --message "你好" --userId test_001

# 测试学习规划
openclaw skill run skill-study-planner createPlan --userId test_001 --goal "学习 Python"

# 测试智能体管理器
openclaw skill run skill-agent-manager handleMessage --message "我想制定学习计划" --userId test_001
```

## 📦 手动集成（备选）

如果自动安装失败，请按以下步骤手动集成：

### 1. 安装 OpenClaw

```bash
# 设置镜像源
npm config set registry https://registry.npmmirror.com

# 安装 OpenClaw
npm install -g openclaw@latest

# 验证安装
openclaw --version
```

### 2. 安装 Skills 依赖

```bash
cd E:\download\course-ai-tutor-main\openclaw-skills

# 安装所有 Skills
for /d %i in (skill-*) do @cd "%i" && npm install && cd ..
```

### 3. 创建配置文件

创建 `%USERPROFILE%\.openclaw\config.json`:

```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "YOUR_API_KEY",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "temperature": 0.7,
    "maxTokens": 2048
  },
  "gateway": {
    "port": 18789,
    "verbose": true
  },
  "workspace": "course-ai-tutor",
  "moodSystem": {
    "enabled": true
  }
}
```

### 4. 注册 Skills

```bash
cd E:\download\course-ai-tutor-main\openclaw-skills

openclaw skill link ./skill-agent-manager
openclaw skill link ./skill-study-planner
openclaw skill link ./skill-tutor
openclaw skill link ./skill-homework-helper
openclaw skill link ./skill-evaluator
openclaw skill link ./skill-companion
```

### 5. 验证安装

```bash
# 检查 OpenClaw 状态
openclaw doctor

# 查看已注册的 Skills
openclaw skill list

# 启动 Gateway
openclaw gateway --port 18789 --verbose
```

## 🧪 测试指南

### 运行所有测试

```bash
cd E:\download\course-ai-tutor-main\openclaw-skills
node test/test-skills.js
```

### 单独测试每个 Skill

```bash
# 1. 测试陪伴智能体
openclaw skill run skill-companion chat --message "你好" --userId test_001

# 2. 测试情绪反馈
openclaw skill run skill-companion moodFeedback --userId test_001 --accuracy 85 --questionCount 20 --streakDays 3

# 3. 测试学习规划
openclaw skill run skill-study-planner createPlan --userId test_001 --goal "学习 Python 编程"

# 4. 测试教学讲解
openclaw skill run skill-tutor teach --userId test_001 --topic "什么是变量"

# 5. 测试答疑辅导
openclaw skill run skill-homework-helper answer --userId test_001 --content "这个代码为什么报错？"

# 6. 测试作业评估
openclaw skill run skill-evaluator evaluateHomework --userId test_001 --homeworkContent "print(\"Hello\")"

# 7. 测试智能体管理器
openclaw skill run skill-agent-manager handleMessage --message "我想学习 Python" --userId test_001

# 8. 测试情绪状态查询
openclaw skill run skill-companion getMoodState --userId test_001

# 9. 测试情绪历史
openclaw skill run skill-companion getMoodHistory --userId test_001 --limit 5
```

## 📡 API 接口

### HTTP API (Gateway 启动后)

Gateway 启动后，可以通过 HTTP API 访问：

```bash
# 发送消息
curl -X POST http://localhost:18789/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_001",
    "message": "你好"
  }'

# 获取智能体状态
curl http://localhost:18789/api/agent/status

# 获取智能体列表
curl http://localhost:18789/api/agent/list
```

### CLI API

```bash
# 通过 CLI 调用 Skills
openclaw skill run <skill-name> <action> [params]
```

## 🔧 配置说明

### 完整配置示例

```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "sk-your-api-key",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "temperature": 0.7,
    "maxTokens": 2048,
    "timeout": 60000
  },
  "gateway": {
    "port": 18789,
    "verbose": true,
    "maxConnections": 100,
    "cors": {
      "enabled": true,
      "origins": ["*"]
    }
  },
  "workspace": "course-ai-tutor",
  "moodSystem": {
    "enabled": true,
    "thresholds": {
      "excited": { "minAccuracy": 80, "minStreak": 7 },
      "happy": { "minAccuracy": 80 },
      "neutral": { "minAccuracy": 50 },
      "concerned": { "minAccuracy": 0 }
    }
  },
  "logging": {
    "level": "info",
    "file": "./logs/gateway.log"
  }
}
```

### 环境变量

也可以通过环境变量配置：

```bash
# AI 配置
export OPENCLAW_AI_PROVIDER=openai
export OPENCLAW_AI_API_KEY=sk-your-api-key
export OPENCLAW_AI_BASE_URL=https://api.siliconflow.cn/v1
export OPENCLAW_AI_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct

# Gateway 配置
export OPENCLAW_GATEWAY_PORT=18789
export OPENCLAW_GATEWAY_VERBOSE=true
```

## 🎯 集成架构

```
┌─────────────────────────────────────────────────┐
│              学生访问入口                        │
│   ┌─────────┬─────────┬─────────┬─────────┐    │
│   │   微信  │   QQ    │  Web    │ Telegram│    │
│   └─────────┴─────────┴─────────┴─────────┘    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         OpenClaw Gateway (端口 18789)            │
│   - 消息路由                                     │
│   - 会话管理                                     │
│   - 认证鉴权                                     │
│   - 日志监控                                     │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         skill-agent-manager                      │
│   - 意图识别                                     │
│   - 智能路由                                     │
│   - 情绪状态管理                                 │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌──────────┐
│   Planner   │ │  Tutor  │ │  Helper  │
│   (规划)    │ │ (教学)  │ │  (答疑)  │
└─────────────┘ └─────────┘ └──────────┘
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────┐ ┌──────────┐
│  Evaluator  │ │Companion│ │   Mood   │
│   (评估)    │ │ (陪伴)  │ │  Service │
└─────────────┘ └─────────┘ └──────────┘
```

## 📊 监控和日志

### 查看 Gateway 日志

```bash
# 实时查看日志
openclaw logs --follow

# 查看错误日志
openclaw logs --level error
```

### 查看情绪日志

```javascript
// 在代码中
console.log(`[Skill] 当前情绪：${mood.currentMood.emoji} ${mood.currentMood.description}`);
```

### 性能监控

```bash
# 查看 Gateway 状态
openclaw gateway status

# 查看 Skills 状态
openclaw skill list
```

## 🚨 故障排除

### 问题 1: OpenClaw 安装失败

**错误**: `npm install -g openclaw@latest` 失败

**解决**:
```bash
# 清理 npm 缓存
npm cache clean --force

# 使用 pnpm
npm install -g pnpm
pnpm add -g openclaw@latest

# 或手动下载
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm link
```

### 问题 2: Skills 注册失败

**错误**: `openclaw skill link` 失败

**解决**:
```bash
# 检查 OpenClaw 是否安装
openclaw --version

# 重新注册
cd openclaw-skills
for /d %i in (skill-*) do @openclaw skill link .\%i
```

### 问题 3: Gateway 启动失败

**错误**: `Port 18789 is already in use`

**解决**:
```bash
# 查找占用端口的进程
netstat -ano | findstr 18789

# 杀死进程
taskkill /PID <PID> /F

# 或使用其他端口
openclaw gateway --port 18790
```

### 问题 4: API Key 无效

**错误**: `Invalid API Key`

**解决**:
1. 检查配置文件中的 API Key 是否正确
2. 确认 API Key 有足够的额度
3. 检查 API 端点是否正确

### 问题 5: Skills 找不到

**错误**: `Skill not found`

**解决**:
```bash
# 重新注册 Skills
cd openclaw-skills
openclaw skill link ./skill-agent-manager
# ... 其他 Skills

# 验证注册
openclaw skill list
```

## 📚 相关文档

- **[openclaw-skills/README.md](openclaw-skills/README.md)** - Skills 使用指南
- **[openclaw-skills/MOOD_SYSTEM_COMPLETE.md](openclaw-skills/MOOD_SYSTEM_COMPLETE.md)** - 情绪反馈系统完成总结
- **[openclaw-skills/MOOD_FEEDBACK_SYSTEM.md](openclaw-skills/MOOD_FEEDBACK_SYSTEM.md)** - 情绪反馈系统详细文档
- **[OPENCLAW_INTEGRATION.md](OPENCLAW_INTEGRATION.md)** - 原集成指南
- **[SPRING_AI_TO_OPENCLAW_MIGRATION.md](SPRING_AI_TO_OPENCLAW_MIGRATION.md)** - 架构对比

## 🎉 完成检查清单

- [ ] Node.js >= 22.16.0
- [ ] OpenClaw 安装成功
- [ ] 配置文件创建完成
- [ ] API Key 已配置
- [ ] Skills 依赖安装完成
- [ ] Skills 注册成功
- [ ] Gateway 可以启动
- [ ] 至少一个 Skill 测试通过
- [ ] 情绪反馈系统正常工作

---

**更新时间**: 2026-04-17  
**状态**: ✅ 已完成  
**Skills**: 6/6  
**情绪系统**: ✅ 已集成  
**文档**: ✅ 完整
