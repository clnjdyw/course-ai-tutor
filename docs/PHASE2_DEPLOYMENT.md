# Phase 2 部署指南：配置 PostgreSQL + PGVector

## 1. 安装 PostgreSQL

### Windows
1. 下载 PostgreSQL 安装包：https://www.postgresql.org/download/windows/
2. 运行安装程序，默认端口 5432
3. 设置 postgres 用户密码（记住这个密码）

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 2. 安装 PGVector 扩展

### 方法 A：使用预编译包（推荐）

**macOS:**
```bash
brew install pgvector
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-15-pgvector
```

**Windows:**
从 https://github.com/pgvector/pgvector/releases 下载预编译的 DLL，放到 PostgreSQL 的 `lib` 目录

### 方法 B：从源码编译

```bash
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

---

## 3. 创建数据库并启用 PGVector

连接到 PostgreSQL：
```bash
psql -U postgres
```

执行以下 SQL：
```sql
-- 创建数据库
CREATE DATABASE course_ai_vector;

-- 连接到新数据库
\c course_ai_vector

-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 验证安装
SELECT * FROM pg_extension WHERE extname = 'vector';
```

如果看到 `vector` 扩展，说明安装成功。

---

## 4. 配置 Spring Boot 环境变量

在项目根目录创建 `.env` 文件（或在 IDE 中配置环境变量）：

```env
# MySQL（用户数据）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=course_ai_tutor
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# PostgreSQL + PGVector（向量存储）
PGVECTOR_HOST=localhost
PGVECTOR_PORT=5432
PGVECTOR_DB=course_ai_vector
PGVECTOR_USERNAME=postgres
PGVECTOR_PASSWORD=your_postgres_password

# SiliconFlow API Key
SILICONFLOW_API_KEY=your_api_key_here

# JWT
JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits
JWT_EXPIRATION_MS=604800000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

---

## 5. 启动 Spring Boot 后端

```bash
cd course-ai-tutor-spring
mvn clean install
mvn spring-boot:run
```

首次启动时，Spring AI 会自动在 PostgreSQL 中创建 `vector_store` 表。

---

## 6. 验证部署

### 检查 PGVector 表是否创建成功

```bash
psql -U postgres -d course_ai_vector
```

```sql
\dt
-- 应该看到 vector_store 表

\d vector_store
-- 查看表结构
```

### 测试文档上传

1. 启动前端：
```bash
cd course-ai-tutor-frontend
npm run dev
```

2. 访问 http://localhost:5173/teacher/vectordb

3. 创建知识库 → 上传 PDF/Word 文件

4. 检查后端日志，应该看到：
```
📄 开始处理文档: xxx.pdf, 类型: pdf
📝 文档分块完成，共 X 个块
✅ 已添加 X 个文档到向量库
✅ 文档处理完成: xxx.pdf
```

---

## 7. 常见问题

### Q1: `ERROR: extension "vector" does not exist`
**解决**：PGVector 扩展未安装，重新执行步骤 2

### Q2: `Connection refused` 连接 PostgreSQL 失败
**解决**：
- 检查 PostgreSQL 是否启动：`sudo systemctl status postgresql`
- 检查端口是否正确：`netstat -an | grep 5432`
- 检查防火墙是否阻止连接

### Q3: 上传文档时报错 `Failed to parse PDF`
**解决**：
- 确保 `pom.xml` 中已添加 `spring-ai-pdf-document-reader` 依赖
- 重新 `mvn clean install`

### Q4: Embedding 调用失败
**解决**：
- 检查 `SILICONFLOW_API_KEY` 是否正确
- 检查网络是否能访问 `https://api.siliconflow.cn`
- 查看 API 配额是否用完

---

## 8. 生产环境建议

1. **使用云数据库**：
   - AWS RDS for PostgreSQL + pgvector
   - Azure Database for PostgreSQL
   - Google Cloud SQL for PostgreSQL

2. **连接池配置**：
```yaml
spring:
  datasource-pgvector:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
```

3. **向量索引优化**：
```sql
-- 创建 HNSW 索引加速检索
CREATE INDEX ON vector_store USING hnsw (embedding vector_cosine_ops);
```

4. **备份策略**：
```bash
# 定期备份 PostgreSQL
pg_dump -U postgres course_ai_vector > backup_$(date +%Y%m%d).sql
```

---

## 9. 下一步

Phase 2 完成后，你可以：
- 在教师后台上传课件（PDF/Word）
- 系统自动向量化并存入 PGVector
- 在 Agent 中调用 `RagService.retrieveByAgent()` 检索相关知识

Phase 3 将实现多模态（图片/语音）交互支持。
