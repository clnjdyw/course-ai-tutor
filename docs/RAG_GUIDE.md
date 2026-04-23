# RAG 知识库指南

## 概述

RAG（Retrieval-Augmented Generation）服务是独立的知识库检索服务，运行在端口 8083。它为智能体提供基于知识库的上下文增强能力。

## 启动

```cmd
cd course-ai-tutor-rag
npm install
node src/server.js
```

服务启动后访问：http://localhost:8083

## 数据库结构

```sql
-- 知识库表
knowledge_bases (id, name, description, category, created_at, updated_at)

-- 文档表
documents (id, knowledge_base_id, title, content, file_type, word_count, status, created_at, updated_at)

-- 文档分块表
chunks (id, document_id, chunk_index, content, embedding, metadata, created_at)

-- 检索历史表
retrieval_history (id, query, results_count, response_time_ms, user_id, created_at)
```

## 默认知识库

| ID | 名称 | 分类 |
|----|------|------|
| 1 | Java 基础 | programming |
| 2 | Spring Boot | framework |
| 3 | Vue.js | frontend |
| 4 | 数据库 | database |
| 5 | 人工智能 | ai |

## API 接口

### 检索知识

```bash
POST /api/retrieve
Content-Type: application/json

{
  "query": "什么是依赖注入",
  "knowledgeBaseId": 2,
  "limit": 5
}
```

响应：
```json
{
  "success": true,
  "results": [
    {
      "content": "依赖注入是...",
      "score": 0.92,
      "source": "Spring Boot 教程"
    }
  ]
}
```

### 知识库管理

```bash
GET  /api/knowledge-bases          获取所有知识库
POST /api/knowledge-bases          创建知识库
GET  /api/documents?kbId=1         获取文档列表
POST /api/documents                上传文档
DELETE /api/documents/:id          删除文档
```

### 向量化文档

```bash
POST /api/documents/:id/vectorize
```

## 在智能体中使用 RAG

在调用智能体时传入 `knowledgeBaseId`，后端会自动检索相关知识并注入到上下文：

```javascript
POST /api/agent/request
{
  "type": "teaching",
  "content": "讲解 Spring Boot 的自动配置",
  "knowledgeBaseId": 2   // 指定知识库
}
```

## 前端配置

```env
# course-ai-tutor-frontend/.env
VITE_RAG_BASE_URL=http://localhost:8083/api
```

## 注意事项

- 当前使用 sql.js（内存数据库），重启后数据会丢失
- 生产环境建议迁移到 PostgreSQL + pgvector
- 向量化需要配置 `SILICONFLOW_API_KEY` 环境变量
