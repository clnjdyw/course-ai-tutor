# 课程辅导 AI 系统

基于多智能体协作的 AI 教育平台，采用中枢协调架构 + 思维链决策引擎，包含 5 个专业子智能体。系统具备游戏化学习体验、PK 对战、成就系统、教师端管理后台、知识库检索（RAG）、自适应学习等核心功能。

> ⚠️ **安全提示**：克隆仓库后，请立即前往 [DashScope 控制台](https://dashscope.aliyun.com) 撤销旧 API 密钥并生成新密钥。详见 [SECURITY.md](docs/SECURITY.md)。

## 项目概览

| 服务 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| **Node.js 后端** | Express 4 + Anthropic SDK + sql.js | 8081 | 多智能体系统、认证、学习管理、教师/管理后台 |
| **Vue 3 前端** | Vue 3 + Vite + Element Plus + Pinia | 5173 (dev) | 学生端游戏化界面 + 教师端管理面板 |
| **数据库** | SQLite (sql.js 嵌入式) | - | 24 张数据表 + FTS5 全文搜索索引 |

## 快速开始

详见 [QUICK_START.md](docs/QUICK_START.md)。

### 前置条件

- Node.js >= 18
- DashScope API Key（[获取](https://dashscope.aliyun.com)）

### 1. 配置环境变量

```cmd
cd course-ai-tutor-backend
copy .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY
```

### 2. 启动后端

```cmd
cd course-ai-tutor-backend
npm install
node src\server.js
```

### 3. 启动前端

打开新窗口：

```cmd
cd course-ai-tutor-frontend
npm install
npm run dev
```

访问：http://localhost:5173

## 系统架构

```
┌──────────────────────────────────────────────────┐
│                  Vue 3 前端                       │  :5173
│  ┌──────────────────┬──────────────────────────┐  │
│  │    学生端         │      教师端               │  │
│  │  (游戏化界面)     │   (数据管理面板)           │  │
│  │  16 个页面        │   5 个页面                │  │
│  └──────────────────┴──────────────────────────┘  │
└────────────────────┬─────────────────────────────┘
                     │ HTTP/REST + JWT 认证
                     ▼
┌──────────────────────────────────────────────────┐
│               Node.js 主后端                      │  :8081
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │          多智能体系统                        │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │      MainAgent (中枢智能体)           │  │  │
│  │  │  - 意图解析 (7 种意图类型)            │  │  │
│  │  │  - 任务调度                           │  │  │
│  │  │  - 思维链决策 (ChainOfThoughtEngine)  │  │  │
│  │  └──────────┬───────────────────────────┘  │  │
│  │             │ 分发                          │  │
│  │     ┌───────┼───────┬───────┬──────────┐   │  │
│  │     ▼       ▼       ▼       ▼          ▼   │  │
│  │  Tutor   Helper  Planner Evaluator Companion│  │
│  │  教学     答疑     规划     评估      陪伴   │  │
│  │                                            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  工具注册中心 (9 个专业工具)          │  │  │
│  │  │  SharedKnowledgeBase (共享知识库)     │  │  │
│  │  │  StudyCoordinator (会话管理器)        │  │  │
│  │  │  UserContext (用户上下文构建)          │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  14 个 API 路由模块                         │  │
│  │  auth | agents | ai | study | learning     │  │
│  │  knowledge | notes | wrong-questions       │  │
│  │  progress | reminders | achievements       │  │
│  │  teacher | admin | knowledge-bases         │  │
│  └────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
         ┌─────────┐   ┌──────────┐
         │ SQLite  │   │ FTS5 全文│
         │ 数据库   │   │ 搜索索引  │
         └─────────┘   └──────────┘
```

## 核心智能体

系统采用中枢协调架构，MainAgent 负责意图识别和任务分发，5 个子智能体各司其职：

| 智能体 | 职责 | 教学策略 |
|--------|------|---------|
| **MainAgent** | 中枢协调，意图解析（7 种类型），思维链决策，任务调度 | 自动识别用户意图并分发到对应子智能体 |
| **TutorAgent** | 知识点讲解，苏格拉底式教学 | 循序渐进，引导式提问 |
| **HelperAgent** | 答疑辅导，作业帮助，支持文本/图片/语音消息 | 快速响应，精准解答 |
| **PlannerAgent** | 学习规划，目标拆解，自动复习，自适应学习 | 个性化学习路径生成 |
| **EvaluatorAgent** | 学习评估，作业批改，习题生成与评分 | 智能评分，薄弱点分析 |
| **CompanionAgent** | 情感支持，情绪反馈，学习鼓励 | 根据正确率动态调整教学节奏 |

### 意图识别系统

MainAgent 支持 7 种意图类型：

| 意图类型 | 关键词示例 | 分发目标 |
|---------|-----------|---------|
| `teaching` | 讲解、教学、学习、知识点、概念 | TutorAgent |
| `question` | 问题、疑问、为什么、怎么、如何 | HelperAgent |
| `planning` | 规划、计划、安排、进度、目标 | PlannerAgent |
| `review` | 复习、错题、薄弱、掌握、练习 | EvaluatorAgent |
| `counseling` | 压力、焦虑、困难、帮助、鼓励 | CompanionAgent |
| `exercise` | 题目、习题、测试、考试 | EvaluatorAgent |
| `note` | 笔记、记录、总结 | HelperAgent |

### 工具系统

集成 9 个专业工具，供智能体调用：

| 工具 | 功能 |
|------|------|
| `queryKnowledgePoints` | 查询知识点内容 |
| `queryUserProgress` | 查询用户学习进度 |
| `queryWrongQuestions` | 查询错题记录 |
| `generateExercises` | 生成练习题 |
| `getWeakPoints` | 获取薄弱知识点 |
| `saveNote` | 保存学习笔记 |
| `updateProgress` | 更新学习进度 |
| `createReminder` | 创建学习提醒 |

## 学习会话管理

StudyCoordinator 提供完整的学习会话生命周期管理：

- **会话启动** - 支持多种学习模式（提问模式等）
- **模式切换** - 动态切换学习模式
- **上下文保持** - 保留最近 3 轮对话历史
- **练习反馈** - 批量提交练习结果，触发评估-纠偏
- **会话结束** - 完整的学习记录保存

## 情绪反馈系统

CompanionAgent 根据答题正确率动态调整教学策略：

| 情绪 | 触发条件 | 教学节奏 |
|------|---------|---------|
| 😊 开心 | 正确率 ≥ 80% | 正常节奏 |
| 🤩 兴奋 | 正确率 ≥ 80% + 连续 7 天 | 快速节奏，挑战升级 |
| 🙂 平静 | 正确率 50%-80% | 正常节奏 |
| 😔 关心 | 正确率 < 50% | 慢速节奏，耐心引导 |

## 前端功能

### 学生端（16 个页面）

采用游戏化设计，包含等级系统、经验值、连续学习天数、今日任务等元素。

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录/注册 | `/login` | 用户认证，角色选择（学生/教师/管理员） |
| 学习规划 | `/planner` | AI 生成个性化学习计划，自主规划，自适应学习 |
| 智能教学 | `/tutor` | 知识点讲解，苏格拉底式对话 |
| 实时答疑 | `/helper` | 问题解答，支持文本/图片/语音 |
| 学习评估 | `/evaluator` | 作业批改，能力评估，习题生成 |
| PK 对战 | `/battle` | 实时双人答题对战，3 种模式（快速/练习/挑战） |
| 成长记录 | `/statistics` | 数据可视化展示学习统计 |
| 成就中心 | `/achievements` | 8 个成就徽章，自动解锁检查 |
| 个人中心 | `/profile` | 用户信息管理，密码修改 |
| 我的笔记 | `/notes` | 学习笔记创建与管理 |
| 错题本 | `/wrong-questions` | 错题收集、复习与掌握跟踪 |
| 历史记录 | `/history` | 学习历史查询与搜索 |
| 学习进度 | `/progress` | 知识点掌握度跟踪 |
| 学习提醒 | `/reminders` | 学习提醒设置 |
| 系统设置 | `/settings` | 系统配置 |
| 后台管理 | `/admin` | 管理员功能（需 admin 角色） |

### 教师端（5 个页面）

| 页面 | 路由 | 功能 |
|------|------|------|
| 数据总览 | `/teacher/dashboard` | 教学数据仪表盘 |
| 向量数据库 | `/teacher/vectordb` | 知识库管理（CRUD + FTS5 搜索） |
| 学生管理 | `/teacher/students` | 学生列表与学习进度查看 |
| 学情分析 | `/teacher/analytics` | 学生学习数据分析 |
| 系统设置 | `/teacher/settings` | 教师端设置 |

### 游戏化系统

- **等级系统** - 8 个等级（初学者 → 传奇），经验值累积升级
- **连续学习** - 连续学习天数跟踪
- **今日任务** - 每日 3 个任务目标
- **成就系统** - 8 个可解锁成就徽章
- **PK 对战** - 积分系统，对战记录，经验值奖励

## API 接口

### 认证模块

```
POST /api/auth/register          用户注册（student/teacher/admin）
POST /api/auth/login             用户登录
GET  /api/auth/me                获取当前用户
PUT  /api/auth/me                更新用户信息
PUT  /api/auth/password          修改密码
```

### AI 智能体模块

```
POST /api/agent/request          智能体统一入口（支持 RAG 检索）
POST /api/agent/request/stream   智能体流式响应
POST /api/agent/chat             智能体对话
GET  /api/agent/status           智能体状态
GET  /api/agent/list             智能体列表
GET  /api/agent/paths            可用思维路径
POST /api/agent/tool             直接调用工具
POST /api/agent/plan             触发自主规划
POST /api/agent/review           触发错题自动复习
POST /api/agent/adapt            自适应学习调整
GET  /api/agent/tasks            查看正在执行的任务
POST /api/agent/tasks/:id/cancel 取消任务
```

### 学习会话管理

```
POST /api/agent/study/start      启动学习会话
POST /api/agent/study/mode       切换学习模式
POST /api/agent/study/input      带会话上下文的输入
POST /api/agent/study/exercise-feedback 批量提交练习反馈
GET  /api/agent/study/session    获取会话状态
POST /api/agent/study/end        结束会话
POST /api/agent/study/eval-correct 手动触发评估-纠偏
```

### 学习功能模块

```
POST /api/planner/plan           生成学习计划
POST /api/tutor/teach            知识点讲解
POST /api/helper/answer          问题答疑（支持图文语音）
POST /api/evaluator/evaluate     学习评估
POST /api/exercise/generate      生成习题
POST /api/exercise/submit        提交习题答案
```

### 数据管理模块

```
GET  /api/knowledge              知识点列表
GET  /api/notes                  笔记列表
GET  /api/wrong-questions        错题列表
GET  /api/progress               学习进度
GET  /api/reminders              学习提醒
GET  /api/achievements           成就列表
POST /api/achievements/check     触发成就检查
GET  /api/health                 健康检查
```

### 教师端模块

```
GET  /api/teacher/students       学生列表与进度
GET  /api/teacher/students/:id   学生详细档案
```

### 管理端模块

```
GET  /api/admin/overview         系统概览
GET  /api/admin/users            用户列表
POST /api/admin/users            创建用户
PUT  /api/admin/users/:id        更新用户
DELETE /api/admin/users/:id      禁用用户
POST /api/admin/users/:id/ban    封禁/解封用户
GET  /api/admin/dashboard        管理面板统计
GET  /api/admin/learning-stats   全局学习统计
POST /api/admin/ai-analysis      AI 数据分析
GET  /api/admin/settings         系统设置
PUT  /api/admin/settings/:key    更新系统设置
GET  /api/admin/security         安全设置（敏感词/IP 黑名单）
POST /api/admin/security/sensitive-words 管理敏感词
POST /api/admin/security/ip-blacklist 管理 IP 黑名单
POST /api/admin/backup           数据备份
POST /api/admin/restore          数据恢复
POST /api/admin/maintenance      维护模式切换
```

### 知识库模块

```
GET  /api/knowledge-bases        列出知识库
POST /api/knowledge-bases        创建知识库
GET  /api/knowledge-bases/:id    知识库详情
PUT  /api/knowledge-bases/:id    更新知识库
DELETE /api/knowledge-bases/:id  删除知识库
GET  /api/knowledge-bases/:id/entries    列出条目
POST /api/knowledge-bases/:id/entries    添加条目
DELETE /api/knowledge-bases/:id/entries/:entryId 删除条目
GET  /api/knowledge-bases/:id/search     FTS5 全文搜索
```

## 数据库设计

系统使用 SQLite（sql.js 嵌入式），包含 24 张数据表和 FTS5 全文搜索索引：

### 核心表

| 表名 | 说明 |
|------|------|
| `users` | 用户信息（level/experience/role: student/teacher/admin） |
| `courses` | 课程信息 |
| `knowledge_points` | 知识点库（难度、前置知识、标签） |
| `study_plans` | 学习计划（进度、状态） |
| `conversations` | 对话记录（支持文本/图片/语音） |
| `learning_records` | 学习记录（行为类型、时长、分数） |
| `learning_sessions` | 学习会话记录 |

### 练习与评估

| 表名 | 说明 |
|------|------|
| `exercises` | 习题库（类型、难度、选项） |
| `user_exercises` | 用户答题记录 |
| `wrong_questions` | 错题本（错误分析、复习次数、掌握状态） |
| `user_progress` | 学习进度（知识点掌握度） |

### 笔记与提醒

| 表名 | 说明 |
|------|------|
| `notes` | 学习笔记（标签、公开状态） |
| `note_comments` | 笔记评论 |
| `learning_reminders` | 学习提醒 |
| `pending_notifications` | 待处理通知 |

### 成就与反馈

| 表名 | 说明 |
|------|------|
| `achievements` | 成就定义（8 个预置成就） |
| `user_achievements` | 用户成就记录 |
| `learning_feedbacks` | 学习反馈评分 |

### 知识库（RAG）

| 表名 | 说明 |
|------|------|
| `knowledge_bases` | 知识库（用户所有） |
| `knowledge_base_entries` | 知识库条目（标签、分类、置信度） |
| `knowledge_base_entries_fts` | FTS5 全文搜索虚拟表 |

### 复习与路径

| 表名 | 说明 |
|------|------|
| `review_schedules` | 复习计划（间隔、重复次数、简易度因子） |
| `learning_paths` | 学习路径 |
| `exercise_templates` | 习题模板 |

### 社区与群组

| 表名 | 说明 |
|------|------|
| `community_posts` | 社区帖子 |
| `community_comments` | 社区评论 |
| `study_groups` | 学习小组 |
| `study_group_members` | 小组成员 |

### 系统管理

| 表名 | 说明 |
|------|------|
| `system_settings` | 系统设置（含敏感词、IP 黑名单） |

## 技术栈

### 后端

- **运行时**: Node.js 18+ (ES Modules)
- **框架**: Express 4
- **AI**: Anthropic SDK (支持 DashScope 代理，默认模型 qwen3.6-plus)
- **数据库**: SQLite (sql.js 1.10.3 嵌入式)
- **搜索**: FTS5 全文搜索引擎
- **认证**: JWT (jsonwebtoken) + bcryptjs 密码加密
- **安全**: Helmet, CORS, 速率限制 (express-rate-limit)
- **其他**: compression, morgan, multer (文件上传)

### 前端

- **框架**: Vue 3.4 + Composition API
- **构建工具**: Vite 5
- **UI 库**: Element Plus 2.6 + @element-plus/icons-vue
- **状态管理**: Pinia 2.1
- **路由**: Vue Router 4
- **数据可视化**: ECharts 6
- **HTTP 客户端**: Axios 1.6
- **Markdown 渲染**: markdown-it 14 + highlight.js 11
- **样式**: Sass
- **测试**: Playwright (E2E 测试)

## 安全特性

- JWT 认证 + 角色权限控制（student/teacher/admin）
- 路由守卫（前端 + 后端双重验证）
- 速率限制（默认 15 分钟 100 次请求）
- Helmet 安全头
- CORS 跨域控制
- 敏感词过滤
- IP 黑名单
- 密码 bcrypt 加密
- 生产环境 JWT 密钥强度检查

## 文档

- [快速开始](docs/QUICK_START.md)
- [系统架构](docs/ARCHITECTURE.md)
- [RAG 知识库](docs/RAG_GUIDE.md)
- [部署指南](docs/PHASE2_DEPLOYMENT.md)
- [故障排除](docs/TROUBLESHOOTING.md)
- [安全指南](docs/SECURITY.md)
- [项目结构](docs/PROJECT_STRUCTURE.md)
- [Docker 部署](docs/DOCKER_DEPLOYMENT.md)

## 开发计划

- [x] 多智能体系统（6 个智能体）
- [x] 思维链决策引擎
- [x] 学习会话管理
- [x] 工具注册中心（9 个工具）
- [x] 共享知识库与事件系统
- [x] 情绪反馈系统
- [x] JWT 认证 + 三角色权限
- [x] 教师端管理后台
- [x] 管理员后台（用户管理、安全设置、数据备份）
- [x] 学生成就系统
- [x] PK 对战系统
- [x] 知识库管理 + FTS5 搜索
- [x] 学习提醒功能
- [x] 错题本与笔记系统
- [x] 游戏化学习体验
- [x] E2E 自动化测试 (Playwright)
- [ ] 生产级数据库（PostgreSQL）
- [ ] 单元测试覆盖
- [ ] Docker 部署支持
- [ ] 实时 WebSocket 对战
- [ ] 社区功能完善

## 许可证

MIT License
