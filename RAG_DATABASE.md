# 🧠 RAG 数据库建立完成！

## ✅ 完成状态

| 项目 | 状态 | 端口/路径 |
|------|------|----------|
| **RAG 服务** | ✅ 运行中 | http://localhost:8083 |
| **SQLite 数据库** | ✅ 已创建 | `data/rag.db` |
| **向量嵌入** | ✅ 已集成 | SiliconFlow API |
| **知识库** | ✅ 5 个默认库 | Java/Spring/Vue/DB/AI |
| **检索 API** | ✅ 已就绪 | `/api/retrieve` |

---

## 📚 已创建的知识库

| ID | 名称 | 分类 | 描述 |
|----|------|------|------|
| 1 | Java 基础 | programming | Java 编程语言基础知识 |
| 2 | Spring Boot | framework | Spring Boot 框架教程 |
| 3 | Vue.js | frontend | Vue.js 前端框架 |
| 4 | 数据库 | database | MySQL 数据库知识 |
| 5 | 人工智能 | ai | AI 和机器学习基础 |

---

## 🗄️ 数据库结构

### 表结构

```sql
-- 知识库表
knowledge_bases (
  id, name, description, category,
  created_at, updated_at
)

-- 文档表
documents (
  id, knowledge_base_id, title, content,
  file_type, word_count, status,
  created_at, updated_at
)

-- 文档分块表
chunks (
  id, document_id, chunk_index, content,
  embedding, metadata, created_at
)

-- 检索历史表
retrieval_history (
  id, query, results_count, response_time_ms,
  user_id, created_at
)
```

---

## 📡 API 接口

### 1. 健康检查
```bash
GET /api/health

# 响应
{
  "status": "ok",
  "service": "RAG Service"
}
```

### 2. 获取知识库列表
```bash
GET /api/knowledge-bases

# 响应
{
  "success": true,
  "data": [
    {"id": 1, "name": "Java 基础", ...}
  ]
}
```

### 3. 创建知识库
```bash
POST /api/knowledge-bases
{
  "name": "Python 编程",
  "description": "Python 语言教程",
  "category": "programming"
}
```

### 4. 添加文档（自动向量化）
```bash
POST /api/documents
{
  "knowledgeBaseId": 1,
  "title": "Spring Boot 入门",
  "content": "Spring Boot 是一个...",
  "fileType": "text"
}

# 响应
{
  "success": true,
  "data": {
    "documentId": 1,
    "chunks": 10
  }
}
```

### 5. 向量检索
```bash
POST /api/retrieve
{
  "query": "什么是 Spring Boot",
  "knowledgeBaseId": 2,
  "topK": 5,
  "threshold": 0.7
}

# 响应
{
  "success": true,
  "data": {
    "query": "什么是 Spring Boot",
    "results": [
      {
        "id": 1,
        "title": "Spring Boot 入门",
        "content": "Spring Boot 是一个...",
        "similarity": 0.89
      }
    ],
    "count": 3,
    "responseTime": 1234
  }
}
```

### 6. 获取文档列表
```bash
GET /api/documents?knowledgeBaseId=1
```

### 7. 删除文档
```bash
DELETE /api/documents/:id
```

### 8. 检索统计
```bash
GET /api/stats

# 响应
{
  "success": true,
  "data": {
    "knowledgeBases": 5,
    "documents": 10,
    "chunks": 150,
    "retrievals": 50
  }
}
```

---

## 🔧 技术架构

### 向量嵌入
- **模型**: BAAI/bge-large-zh-v1.5
- **维度**: 1024
- **API**: SiliconFlow
- **相似度**: 余弦相似度

### 文本分块
- **Chunk Size**: 500 字符
- **Chunk Overlap**: 50 字符
- **预处理**: 去除特殊字符、合并空白

### 数据库
- **类型**: SQLite (sql.js)
- **路径**: `data/rag.db`
- **持久化**: 自动保存

---

## 🎯 使用示例

### 添加知识文档

```javascript
// 添加 Spring Boot 教程
const response = await fetch('http://localhost:8083/api/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    knowledgeBaseId: 2,
    title: 'Spring Boot 入门教程',
    content: `
      Spring Boot 是一个用于创建独立、生产级 Spring 应用的框架。
      
      ## 核心特性
      1. 独立运行的 Spring 应用
      2. 内嵌 Tomcat/Jetty
      3. 无需 WAR 打包
      4. 自动配置 Starter POMs
      
      ## 快速开始
      1. 创建 Spring Boot 项目
      2. 添加依赖
      3. 编写主类
      4. 运行应用
    `,
    fileType: 'text'
  })
})

const result = await response.json()
console.log(result)
```

### 向量检索

```javascript
// 检索 Spring Boot 相关内容
const response = await fetch('http://localhost:8083/api/retrieve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Spring Boot 如何配置数据库',
    knowledgeBaseId: 2,
    topK: 3,
    threshold: 0.7
  })
})

const results = await response.json()
console.log('检索结果:', results.data.results)
```

---

## 📊 服务状态

```bash
# 检查服务
curl http://localhost:8083/api/health

# 查看知识库
curl http://localhost:8083/api/knowledge-bases

# 查看统计
curl http://localhost:8083/api/stats

# 查看进程
ps aux | grep "node src/server"
```

---

## 🚀 启动命令

```bash
cd ~/.openclaw/workspace/course-ai-tutor-rag

# 启动服务
npm start

# 开发模式
npm run dev

# 查看日志
tail -f rag.log
```

---

## 📝 下一步

### 已完成 ✅
- [x] RAG 数据库结构
- [x] 向量嵌入集成
- [x] 文本分块处理
- [x] 相似性检索
- [x] REST API 接口
- [x] 5 个默认知识库

### 待完成 🚧
- [ ] 文档导入工具（PDF/Word）
- [ ] Web 管理界面
- [ ] 批量导入功能
- [ ] 知识库分类管理
- [ ] 检索结果优化
- [ ] 与智能体集成

---

## 🔗 集成智能体

### 在智能体中使用 RAG

```javascript
// 智能体请求 RAG 检索
const retrieveFromRAG = async (query, knowledgeBaseId) => {
  const response = await fetch('http://localhost:8083/api/retrieve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      knowledgeBaseId,
      topK: 5
    })
  })
  
  const { data } = await response.json()
  return data.results
}

// 在智能体响应中使用检索结果
const answerWithRAG = async (question) => {
  const context = await retrieveFromRAG(question, 2)
  
  const prompt = `
    基于以下知识回答问题：
    
    相关知识：
    ${context.map(r => r.content).join('\n')}
    
    问题：${question}
    
    请基于以上知识回答。
  `
  
  return await callAI(prompt)
}
```

---

## 🎉 完成！

RAG 数据库已成功建立并运行！

**服务地址**: http://localhost:8083  
**数据库**: `data/rag.db`  
**知识库**: 5 个  
**API**: 8 个接口  

---

**创建时间**: 2026-03-06 03:25  
**状态**: ✅ 运行正常  
**端口**: 8083
