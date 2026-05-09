# 三阶段开发总结

## 项目概述

**项目名称**：基于 Spring AI 的课程辅导类 Manus 智能体系统

**技术栈**：
- 后端：Spring Boot 3 + Spring AI + MySQL + PostgreSQL (PGVector)
- 前端：Vue 3 + Vite + Element Plus
- AI：SiliconFlow API（Qwen 系列模型）

---

## Phase 1: 用户认证与角色权限隔离（RBAC）

### 目标
完善用户注册、登录、角色权限管理，确保 Student、Teacher、Admin 三种角色有明确的权限隔离。

### 改动文件（4个）

**后端（3个）：**
1. **`User.java`** - 新增字段：
   - `subjectPreferences` (TEXT) - 学科偏好，JSON 数组
   - `learningGoal` (TEXT) - 学习目标

2. **`AuthController.java`** - 三处改动：
   - 修复安全漏洞：注册时只允许 `student`/`teacher` 自注册，`admin` 无法自注册
   - `RegisterRequest` 扩展：添加 `subjectPreferences` 和 `learningGoal`
   - 新增 `POST /api/auth/profile/init` 接口，用于注册后补充学习偏好
   - `/me` 和 `login` 响应中返回新字段

3. **`SecurityConfig.java`** - 新增路由保护：
   - `/api/teacher/**` 要求 `ROLE_TEACHER` 或 `ROLE_ADMIN`

**前端（1个）：**
1. **`router/index.js`** - 修复角色层级：
   - Admin 可以访问 Teacher 路由
   - 将严格等值检查改为层级检查

### 核心成果
✅ 修复了注册时的角色安全漏洞（防止客户端伪造 admin 角色）  
✅ 实现了学科偏好和学习目标的存储  
✅ 完善了角色层级（admin > teacher > student）  
✅ 后端路由保护完整（`/api/admin/**`, `/api/teacher/**`）

---

## Phase 2: 知识库（RAG）管理后台闭环

### 目标
实现完整的文档上传解析流程，支持 PDF/Word 课件上传，自动向量化并存入 PGVector，实现"不同智能体调用不同知识库"的隔离需求。

### 改动文件（10个）

**后端（9个）：**

**新增文件（7个）：**
1. **`KnowledgeBase.java`** - 知识库实体，包含 `agentId`、`courseId` 隔离字段
2. **`Document.java`** - 文档实体，包含 `agentId`、`courseId`、`status`、`chunkCount`
3. **`KnowledgeBaseRepository.java`** - 知识库数据访问层
4. **`DocumentRepository.java`** - 文档数据访问层
5. **`VectorStoreConfig.java`** - PGVector 配置，创建独立的 PostgreSQL 数据源
6. **`RagService.java`** - RAG 服务，封装向量检索逻辑，支持按 `agent_id`/`course_id` 过滤
7. **`TeacherController.java`** - 教师端控制器，提供：
   - `GET /api/teacher/knowledge-bases` - 获取知识库列表
   - `POST /api/teacher/knowledge-bases` - 创建知识库
   - `POST /api/teacher/documents/upload` - 上传文档（PDF/Word/TXT）
   - `GET /api/teacher/documents` - 获取文档列表
   - `DELETE /api/teacher/documents/{id}` - 删除文档

**修改文件（2个）：**
1. **`pom.xml`** - 添加依赖：
   - `spring-ai-pdf-document-reader`（PDF 解析）
   - `spring-ai-tika-document-reader`（Word/TXT 解析）
   - `postgresql`（PGVector 驱动）

2. **`application.yml`** - 新增配置：
   - `spring.datasource-pgvector.*` - PostgreSQL 连接配置
   - `spring.ai.openai.embedding.options.model` - Embedding 模型配置
   - `spring.ai.vectorstore.pgvector.*` - 向量索引配置

**前端（1个）：**
1. **`TeacherVectorDB.vue`** - 知识库管理页面：
   - 新增文件上传组件（Element Plus Upload）
   - 支持拖拽上传 PDF/Word/TXT
   - 新增 `agentId`、`courseId` 关联字段
   - 新增上传模式切换（文件上传 / 文本输入）

### 核心成果
✅ 完整的文档上传解析流程（PDF/Word/TXT → 解析 → 切片 → 向量化 → 存储）  
✅ 元数据隔离（每个 chunk 包含 `agent_id`、`course_id`、`document_id`、`knowledge_base_id`）  
✅ 教师管理界面（创建知识库、上传课件、查看文档列表）  
✅ 向量检索支持按 `agent_id` / `course_id` 过滤

---

## Phase 3: 多模态（图片识别）交互支持

### 目标
升级聊天接口，支持接收图片（Base64 编码），调用多模态 AI 模型（如 Qwen2-VL），让 HelperAgent 能够识别用户上传的数学题或代码截图并进行讲解。

### 改动文件（6个）

**后端（5个）：**

**新增文件（1个）：**
1. **`MultimodalService.java`** - 多模态 AI 服务：
   - 封装图片识别逻辑
   - 支持 Base64 图片输入
   - 自动降级到纯文本模式（如果多模态失败）

**修改文件（4个）：**
1. **`ChatRequest.java`** - 扩展请求体：
   - `imageBase64` - Base64 编码的图片
   - `imageUrl` - 图片 URL（可选）
   - `imageMimeType` - 图片类型

2. **`ChatResponse.java`** - 添加时间戳字段

3. **`AgentController.java`** - 升级 chat 接口：
   - 检测请求是否包含图片
   - 如果有图片，调用 `MultimodalService.chatWithImage()`
   - 否则走原有的 `CompanionAgent.chat()` 流程

4. **`application.yml`** - 配置多模态模型：
   ```yaml
   app:
     multimodal:
       enabled: true
       model: Pro/Qwen/Qwen2-VL-72B-Instruct
   ```

**前端（1个）：**
1. **`HelperView.vue`** - 实时答疑页面：
   - 新增图片上传按钮（`el-upload`）
   - 图片预览组件
   - 将图片转为 Base64 并发送给后端
   - 支持移除已上传的图片

### 核心成果
✅ 后端支持接收 Base64 图片  
✅ 调用多模态 AI 模型（Qwen2-VL-72B）  
✅ 前端图片上传、预览、Base64 转换  
✅ 自动降级到纯文本模式（容错机制）

---

## 技术亮点

### 1. 安全性
- 修复了注册时的角色安全漏洞（防止客户端伪造 admin 角色）
- JWT 认证 + Spring Security 路由保护
- 角色层级管理（admin > teacher > student）

### 2. 可扩展性
- 知识库元数据隔离（`agent_id`、`course_id`），支持多租户场景
- 向量检索支持灵活过滤（按智能体、课程、知识库）
- 多模态服务独立封装，易于切换模型

### 3. 用户体验
- 教师后台：拖拽上传课件，自动向量化
- 学生端：上传图片即可获得 AI 解答
- 自动降级机制：多模态失败时自动切换到纯文本模式

### 4. 性能优化
- PGVector HNSW 索引加速向量检索
- Spring AI 的 TokenTextSplitter 智能分块（500 tokens/块，50 tokens 重叠）
- 前端图片 Base64 编码（减少文件存储开销）

---

## 部署清单

### 环境依赖

1. **MySQL** - 用户数据、知识库元数据
2. **PostgreSQL + PGVector** - 向量存储
3. **SiliconFlow API Key** - AI 模型调用

### 环境变量

```env
# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_ai_tutor
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# PostgreSQL + PGVector
PGVECTOR_HOST=localhost
PGVECTOR_PORT=5432
PGVECTOR_DB=course_ai_vector
PGVECTOR_USERNAME=postgres
PGVECTOR_PASSWORD=your_postgres_password

# SiliconFlow API
SILICONFLOW_API_KEY=your_api_key_here

# 多模态模型（可选）
MULTIMODAL_MODEL=Pro/Qwen/Qwen2-VL-72B-Instruct

# JWT
JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits
JWT_EXPIRATION_MS=604800000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

### 启动步骤

1. **安装 PostgreSQL + PGVector**（参考 `PHASE2_DEPLOYMENT.md`）
2. **配置环境变量**（创建 `.env` 文件）
3. **启动后端**：
   ```bash
   cd course-ai-tutor-spring
   mvn clean install
   mvn spring-boot:run
   ```
4. **启动前端**：
   ```bash
   cd course-ai-tutor-frontend
   npm install
   npm run dev
   ```

---

## API 接口总览

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/profile/init` - 初始化学习偏好

### 教师端
- `GET /api/teacher/knowledge-bases` - 获取知识库列表
- `POST /api/teacher/knowledge-bases` - 创建知识库
- `POST /api/teacher/documents/upload` - 上传文档（支持 PDF/Word/TXT）
- `GET /api/teacher/documents` - 获取文档列表
- `DELETE /api/teacher/documents/{id}` - 删除文档

### 智能体
- `POST /api/agent/chat` - 聊天接口（支持多模态）
- `POST /api/agent/request` - 统一请求入口
- `POST /api/agent/request/stream` - 流式请求（SSE）

---

## 文件改动统计

| Phase | 新增文件 | 修改文件 | 总计 |
|-------|---------|---------|------|
| Phase 1 | 0 | 4 | 4 |
| Phase 2 | 8 | 3 | 11 |
| Phase 3 | 2 | 4 | 6 |
| **总计** | **10** | **11** | **21** |

---

## 下一步建议

### 短期优化
1. **前端图片压缩**：上传前压缩图片，减少传输体积
2. **向量检索缓存**：对高频查询结果进行缓存
3. **错误监控**：接入 Sentry 或 ELK 监控异常

### 中期扩展
1. **语音输入**：前端录音 → Whisper 识别 → AI 解答
2. **实时协作**：WebSocket 实现多人在线答疑
3. **学习报告**：基于向量检索生成个性化学习报告

### 长期规划
1. **私有化部署**：支持本地 LLM（如 Ollama）
2. **移动端适配**：开发 React Native / Flutter 移动应用
3. **多语言支持**：国际化（i18n）

---

## 总结

三个 Phase 全部完成，实现了：
- ✅ 完善的用户认证与角色权限管理
- ✅ 完整的 RAG 知识库管理闭环
- ✅ 多模态（图片识别）交互支持

项目已具备生产环境部署的基础能力，可以开始内测和用户反馈收集。🎉
