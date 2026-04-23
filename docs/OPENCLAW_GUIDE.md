# OpenClaw Skills 集成指南

## 概述

OpenClaw Skills 是 AI 技能扩展系统，将 6 个核心智能体封装为独立的可调用技能，运行在端口 18789。

## 前置要求

- Node.js >= 18
- npm >= 8
- DashScope 或 SiliconFlow API Key

## 安装

### 方式一：一键安装（Windows）

```cmd
install-openclaw.bat
```

### 方式二：手动安装

```bash
# 安装 OpenClaw CLI
npm install -g openclaw@latest

# 安装 Skills 依赖
cd openclaw-skills
npm install

# 安装各 Skill 依赖
cd skill-agent-manager && npm install && cd ..
cd skill-study-planner && npm install && cd ..
cd skill-tutor && npm install && cd ..
cd skill-homework-helper && npm install && cd ..
cd skill-evaluator && npm install && cd ..
cd skill-companion && npm install && cd ..
```

## 配置

编辑 `%USERPROFILE%\.openclaw\config.json`：

```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "your-api-key-here",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

## 启动 Gateway

```cmd
start-gateway.bat
```

或手动：

```bash
cd openclaw-skills
npm start
```

Gateway 启动后监听 http://localhost:18789

## 可用 Skills

| Skill | 功能 |
|-------|------|
| `skill-agent-manager` | 智能体管理器，自动路由请求 |
| `skill-study-planner` | 学习规划，制定个性化计划 |
| `skill-tutor` | 苏格拉底式教学讲解 |
| `skill-homework-helper` | 答疑辅导，作业帮助 |
| `skill-evaluator` | 学习评估，作业批改 |
| `skill-companion` | 情感陪伴，情绪反馈 |

## 使用示例

```bash
# 智能路由（推荐）
openclaw skill run skill-agent-manager handleMessage \
  --message "我想制定学习计划" --userId user_001

# 学习规划
openclaw skill run skill-study-planner createPlan \
  --userId user_001 --goal "学习 Python"

# 教学讲解
openclaw skill run skill-tutor teach \
  --userId user_001 --topic "什么是递归"

# 情感陪伴
openclaw skill run skill-companion chat \
  --message "今天学习好累" --userId user_001
```

## 情绪反馈系统

CompanionAgent 根据答题正确率动态调整教学策略：

| 情绪 | 触发条件 | 教学节奏 |
|------|---------|---------|
| HAPPY | 正确率 ≥ 80% | normal |
| EXCITED | 正确率 ≥ 80% + 连续 7 天 | fast |
| NEUTRAL | 正确率 50%-80% | normal |
| CONCERNED | 正确率 < 50% | slow |
| ENCOURAGING | 需要额外支持 | slow |

情绪服务文件：`openclaw-skills/shared/mood-service.js`

## 测试

```bash
cd openclaw-skills
node test/test-skills.js    # 全量测试
node test/test-tutor.js     # Tutor 单元测试
```

## 故障排除

**问题：openclaw 命令未找到**
```bash
npm install -g openclaw@latest
# 重新打开终端
```

**问题：API Key 无效**
- 检查 `%USERPROFILE%\.openclaw\config.json` 中的 apiKey
- 确认 API Key 在对应平台有效

**问题：端口 18789 被占用**
```bash
# 查找占用进程
netstat -ano | findstr 18789
# 结束进程
taskkill /PID <pid> /F
```
