# 🦞 OpenClaw 集成指南

将 Course AI Tutor 从 Spring AI 迁移到 OpenClaw 的完整指南。

## 📋 迁移概览

### 原架构 (Spring AI)

```
Vue 3 前端 (3001) → Spring AI 后端 (8082) → AI Model
                     ├─ PlannerAgent
                     ├─ TutorAgent
                     ├─ HelperAgent
                     ├─ EvaluatorAgent
                     ├─ CompanionAgent
                     └─ AgentManager
```

### 新架构 (OpenClaw)

```
多渠道入口 → OpenClaw Gateway (18789) → AI Model
             ├─ skill-agent-manager
             ├─ skill-study-planner
             ├─ skill-tutor
             ├─ skill-homework-helper
             ├─ skill-evaluator
             └─ skill-companion
```

## 🔄 智能体映射

| Spring AI | OpenClaw Skill | 变化说明 |
|-----------|---------------|----------|
| PlannerAgent | skill-study-planner | 保持游戏化规划特色 |
| TutorAgent | skill-tutor | 保持苏格拉底式教学 |
| HelperAgent | skill-homework-helper | 更名为更直观的命名 |
| EvaluatorAgent | skill-evaluator | 功能保持一致 |
| CompanionAgent | skill-companion | 增加情绪反馈系统 |
| AgentManager | skill-agent-manager | 增强意图识别能力 |

## 📦 安装步骤

### 步骤 1: 安装 Node.js (如未安装)

```bash
# 检查版本
node --version  # 需要 >= 22.16.0

# 如需要升级，访问 https://nodejs.org
```

### 步骤 2: 安装 OpenClaw

```bash
npm install -g openclaw@latest

# 验证安装
openclaw --version
```

### 步骤 3: 初始化 OpenClaw

```bash
# 运行 onboarding
openclaw onboard --install-daemon
```

按照提示完成：
1. **Gateway 配置**
   - 端口：18789（默认）
   - 是否安装为系统服务：是

2. **Workspace 设置**
   - Workspace 名称：course-ai-tutor
   - 工作目录：`E:\download\course-ai-tutor-main\openclaw-skills`

3. **AI 配置**
   - Provider: siliconflow
   - API Key: `sk-286b643e163489c7eb9038d8967cb69f` (或你的密钥)
   - Base URL: `https://api.siliconflow.cn/v1`
   - Model: `Qwen/Qwen2.5-Coder-32B-Instruct`

4. **消息渠道**（可选）
   - 暂时跳过，后续可添加

### 步骤 4: 安装 Skills

```bash
cd E:\download\course-ai-tutor-main\openclaw-skills

# 批量安装所有 skills
for dir in skill-*; do
  cd "$dir" && npm install && cd ..
done
```

### 步骤 5: 注册 Skills

```bash
cd E:\download\course-ai-tutor-main\openclaw-skills

# 注册每个 skill
openclaw skill link ./skill-agent-manager
openclaw skill link ./skill-study-planner
openclaw skill link ./skill-tutor
openclaw skill link ./skill-homework-helper
openclaw skill link ./skill-evaluator
openclaw skill link ./skill-companion
```

### 步骤 6: 配置 AI Provider

编辑 `~/.openclaw/config.json`:

```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "sk-286b643e163489c7eb9038d8967cb69f",
    "baseUrl": "https://api.siliconflow.cn/v1",
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "temperature": 0.7,
    "maxTokens": 2048
  },
  "gateway": {
    "port": 18789,
    "verbose": true
  }
}
```

### 步骤 7: 启动 Gateway

```bash
# 前台运行（调试用）
openclaw gateway --port 18789 --verbose

# 后台运行（如已安装 daemon）
openclaw gateway start
```

## 🧪 测试验证

### 测试 1: 智能体管理器

```bash
openclaw skill run skill-agent-manager handleMessage --message "我想制定学习计划" --userId 1
```

预期输出：
```json
{
  "success": true,
  "agentType": "planner",
  "message": "...",
  "timestamp": "..."
}
```

### 测试 2: 学习规划

```bash
openclaw skill run skill-study-planner createPlan --userId 1 --goal "学习 Python" --currentLevel "beginner"
```

### 测试 3: 苏格拉底式教学

```bash
openclaw skill run skill-tutor teach --userId 1 --topic "什么是变量"
```

### 测试 4: 陪伴聊天

```bash
openclaw skill run skill-companion chat --userId 1 --message "你好"
```

### 测试 5: 获取智能体状态

```bash
openclaw skill run skill-agent-manager getStatus
```

预期输出：
```json
{
  "status": "online",
  "manager": "active",
  "agents": [
    {"name": "Planner", "status": "online"},
    {"name": "Tutor", "status": "online"},
    {"name": "Helper", "status": "online"},
    {"name": "Evaluator", "status": "online"},
    {"name": "Companion", "status": "online"}
  ]
}
```

## 🔗 前端集成

### 方案 A: 保留现有前端，修改 API 调用

修改 `course-ai-tutor-frontend/src/api/request.js`:

```javascript
// 原配置
const request = axios.create({
  baseURL: 'http://localhost:8081/api',  // Mock 后端
  timeout: 60000
})

// 新配置（指向 OpenClaw Gateway）
const request = axios.create({
  baseURL: 'http://localhost:18789/api',  // OpenClaw Gateway
  timeout: 60000
})
```

### 方案 B: 使用 OpenClaw 消息渠道

学生直接通过微信/QQ/Telegram 等访问，无需 Web 前端。

配置消息渠道：

```bash
# 添加微信渠道（示例）
openclaw channel add wechat

# 添加 QQ 渠道（示例）
openclaw channel add qq

# 添加 Telegram 渠道
openclaw channel add telegram
```

### 方案 C: 混合模式

同时支持 Web 前端和消息渠道：

```
Web 前端 → OpenClaw Gateway API
微信/QQ → OpenClaw Gateway Channels
```

## 📊 数据迁移

### 从 H2 迁移到 OpenClaw 存储

原 Spring AI 使用 H2 数据库存储用户数据和学习记录。

OpenClaw 支持多种存储方式：

1. **本地文件存储**（简单）
2. **SQLite**（推荐）
3. **PostgreSQL**（生产环境）

配置存储：

```bash
# 使用 SQLite
openclaw config set storage.type sqlite
openclaw config set storage.path ./data/course-ai-tutor.db
```

### 数据迁移脚本

创建迁移脚本 `migrate-data.js`:

```javascript
// 从 H2 导出数据，导入到 OpenClaw 存储
// TODO: 根据实际需求实现
```

## ⚙️ 提示词调优

各 Skill 的系统提示词已根据原 Spring AI 配置优化，但可根据实际效果调整。

### 调整方法

编辑对应 Skill 的 `index.js` 文件中的 `SYSTEM_PROMPT` 常量。

例如，调整教学智能体：

```javascript
// skill-tutor/index.js
const SYSTEM_PROMPT = `
你是一位经验丰富的课程讲师...
// 在这里调整提示词
`;
```

### 测试提示词效果

```bash
openclaw skill run skill-tutor teach \
  --userId 1 \
  --topic "测试主题" \
  --studentLevel "beginner"
```

## 🚨 常见问题

### Q1: Gateway 启动失败

**问题**: `Error: Port 18789 is already in use`

**解决**:
```bash
# 检查端口占用
netstat -ano | findstr 18789

# 更改端口
openclaw gateway --port 18790
```

### Q2: Skill 找不到

**问题**: `Error: Skill not found`

**解决**:
```bash
# 重新注册 skill
openclaw skill link ./skill-name

# 检查已注册的 skills
openclaw skill list
```

### Q3: AI 响应慢

**问题**: API 响应超时

**解决**:
1. 检查网络连接
2. 更换 AI Provider
3. 增加 timeout 配置

```json
{
  "ai": {
    "timeout": 60000
  }
}
```

### Q4: 消息渠道连接失败

**问题**: 无法连接微信/QQ

**解决**:
- 参考 OpenClaw 官方渠道配置文档
- 检查 API Key 和认证信息
- 确保网络可达

## 📈 性能优化

### 1. 启用缓存

```bash
openclaw config set cache.enabled true
openclaw config set cache.ttl 3600
```

### 2. 调整并发

```json
{
  "gateway": {
    "maxConnections": 100,
    "timeout": 30000
  }
}
```

### 3. 日志优化

```bash
# 生产环境关闭 verbose
openclaw gateway --port 18789
```

## 🎯 下一步

### 短期（1-2 周）

- [ ] 完成所有 Skills 测试
- [ ] 配置至少一个消息渠道
- [ ] 邀请少量学生试用
- [ ] 收集反馈并优化提示词

### 中期（1 个月）

- [ ] 添加数据库支持
- [ ] 实现学习数据持久化
- [ ] 开发管理后台
- [ ] 集成更多消息渠道

### 长期（3 个月+）

- [ ] 开发专属技能（如语音交互）
- [ ] 优化情绪反馈系统
- [ ] 添加学习游戏化功能
- [ ] 支持多语言

## 📚 参考资料

- [OpenClaw 官方文档](https://openclaw.io/docs)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [原 Spring AI 项目](../course-ai-tutor-spring/README.md)
- [Skills 开发指南](./README.md)

## 🎉 完成检查清单

- [ ] OpenClaw 安装成功
- [ ] 所有 6 个 Skills 注册成功
- [ ] Gateway 正常启动
- [ ] 至少一个 Skill 测试通过
- [ ] AI 配置正确
- [ ] （可选）消息渠道配置成功
- [ ] （可选）前端集成完成

---

**迁移完成时间**: 预计 2-4 小时  
**难度**: ⭐⭐⭐ 中等  
**技术支持**: 参考 OpenClaw 官方文档
