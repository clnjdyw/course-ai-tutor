# 新功能使用说明

本文档介绍了课程辅导 AI 系统新增的 4 个核心功能。

## 目录
- [1. 语音识别后端服务 (STT)](#1-语音识别后端服务-stt)
- [2. 图片 OCR 识别](#2-图片-ocr-识别)
- [3. RAG 向量检索优化](#3-rag-向量检索优化)
- [4. 知识库动态更新](#4-知识库动态更新)

---

## 1. 语音识别后端服务 (STT)

### 功能说明
集成了阿里云百炼的 `paraformer-realtime-v2` 语音识别模型,支持将音频文件转换为文字。

### 配置
在 `course-ai-tutor-backend/.env` 中配置:
```env
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
STT_MODEL=paraformer-realtime-v2
```

### API 接口

#### 1.1 上传音频文件并识别
```http
POST /api/speech/transcribe
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- audio: <audio_file> (mp3/wav/ogg/webm/flac)
- language: zh (可选,默认中文)
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "text": "识别出的文字内容",
    "language": "zh",
    "duration": 5.2,
    "confidence": 0.95,
    "segments": [...]
  }
}
```

#### 1.2 通过 URL 识别音频
```http
POST /api/speech/transcribe-url
Content-Type: application/json
Authorization: Bearer <token>

{
  "audioUrl": "/uploads/audio_file.mp3",
  "language": "zh"
}
```

#### 1.3 缓存管理
```http
GET /api/speech/cache/stats     # 查看缓存统计
POST /api/speech/cache/clear    # 清空缓存
```

### 支持格式
- MP3, WAV, OGG, WebM, FLAC
- 最大文件大小: 25MB

---

## 2. 图片 OCR 识别

### 功能说明
集成了阿里云百炼的 `qwen-vl-max-latest` 视觉语言模型,支持图片文字识别和内容理解。

### 配置
在 `course-ai-tutor-backend/.env` 中配置:
```env
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OCR_MODEL=qwen-vl-max-latest
```

### API 接口

#### 2.1 上传图片并识别
```http
POST /api/ocr/recognize
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- image: <image_file> (jpg/png/gif/webp/bmp)
- language: chi_sim+eng (可选)
- prompt: 请识别图片中的所有文字内容 (可选,自定义提示词)
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "text": "识别出的文字内容",
    "language": "chi_sim+eng",
    "confidence": 1.0,
    "blocks": [
      {
        "id": 0,
        "text": "第一行文字",
        "type": "heading"
      },
      {
        "id": 1,
        "text": "第二行文字",
        "type": "text"
      }
    ]
  }
}
```

#### 2.2 通过 URL 识别图片
```http
POST /api/ocr/recognize-url
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "/uploads/image_file.jpg",
  "language": "chi_sim+eng",
  "prompt": "请识别图片中的数学公式"
}
```

#### 2.3 缓存管理
```http
GET /api/ocr/cache/stats     # 查看缓存统计
POST /api/ocr/cache/clear    # 清空缓存
```

### 支持格式
- JPG, JPEG, PNG, GIF, WebP, BMP
- 最大文件大小: 10MB

### 应用场景
- 教材拍照识别
- 手写笔记识别
- 数学公式识别
- 试卷题目提取

---

## 3. RAG 向量检索优化

### 功能说明
优化了 RAG 知识库服务,新增混合检索引擎(向量检索 + 关键词检索),提升检索准确性和性能。

### 配置
在 `course-ai-tutor-rag/.env` 中配置:
```env
DASHSCOPE_API_KEY=your_api_key_here
EMBEDDING_MODEL=text-embedding-v3
PORT=8083
```

### 新增特性

#### 3.1 混合检索
结合了向量语义相似度和关键词匹配的优势:
- **向量检索**: 理解语义,支持同义词和上下文
- **关键词检索**: 精确匹配专业术语
- **综合评分**: 向量权重 70% + 关键词权重 30%

#### 3.2 API 接口

**检索接口 (已优化)**
```http
POST /api/retrieve
Content-Type: application/json

{
  "query": "如何理解面向对象编程",
  "knowledgeBaseId": 1,
  "topK": 5,
  "threshold": 0.7,
  "useHybrid": true  // 新增:是否使用混合检索
}
```

**新增接口**

```http
# 搜索历史
GET /api/search/history?limit=50

# 热门查询
GET /api/search/popular?limit=20

# 数据库优化
POST /api/optimize

# 向量索引统计
GET /api/vector-index/stats
```

### 性能优化
- ✅ 数据库索引优化
- ✅ Embedding 向量缓存 (LRU, 10000 条)
- ✅ 批量并行向量化
- ✅ 检索历史记录分析

---

## 4. 知识库动态更新

### 功能说明
实现了从对话中自动提取知识点并添加到知识库的功能,实现知识库的动态增长。

### 配置
无需额外配置,使用现有的 `DASHSCOPE_API_KEY` 即可。

### API 接口

#### 4.1 从对话中提取知识
```http
POST /api/knowledge-extract/extract
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversation": [
    {"role": "user", "content": "什么是闭包?"},
    {"role": "assistant", "content": "闭包是指..."}
  ],
  "knowledgeBaseId": 1,      // 可选,指定知识库
  "autoAdd": true,            // 可选,是否自动添加
  "confidenceThreshold": 0.7  // 可选,置信度阈值
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "extracted": [
      {
        "title": "闭包 (Closure)",
        "content": "闭包是指...详细解释",
        "category": "concept",
        "tags": ["JavaScript", "函数", "作用域"],
        "confidence": 0.92
      }
    ],
    "validated": [...],
    "added": 1
  }
}
```

#### 4.2 从历史对话提取
```http
POST /api/knowledge-extract/extract-from-history
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversationId": 123,
  "knowledgeBaseId": 1,
  "autoAdd": true
}
```

#### 4.3 批量提取
```http
POST /api/knowledge-extract/extract-batch
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversations": [...],
  "knowledgeBaseId": 1,
  "autoAdd": true
}
```

#### 4.4 调度提取
```http
POST /api/knowledge-extract/schedule
Content-Type: application/json
Authorization: Bearer <token>

{
  "conversation": [...],
  "delay": 5000  // 延迟执行时间(毫秒)
}
```

#### 4.5 状态查询
```http
GET /api/knowledge-extract/queue/status   # 队列状态
GET /api/knowledge-extract/stats          # 统计信息
```

### 知识分类
自动提取的知识分为以下类别:
- `concept`: 概念定义
- `fact`: 重要事实
- `formula`: 公式定理
- `method`: 方法论
- `qa`: 问答对

### 工作流程
1. AI 分析对话内容,识别知识点
2. 提取标题、内容、标签、分类
3. 计算置信度 (0-1)
4. 过滤低于阈值的知识点
5. 检查是否已存在(按标题匹配)
6. 新增或更新到知识库

---

## 安装依赖

### 后端依赖
```bash
cd course-ai-tutor-backend
npm install
```

新增依赖:
- `form-data`: 表单数据编码
- `node-fetch`: HTTP 客户端

### RAG 服务依赖
```bash
cd course-ai-tutor-rag
npm install
```

---

## 启动服务

### 1. 启动后端服务
```bash
cd course-ai-tutor-backend
npm run dev
```
服务地址: `http://localhost:8081`

### 2. 启动 RAG 服务
```bash
cd course-ai-tutor-rag
npm run dev
```
服务地址: `http://localhost:8083`

### 3. 启动前端
```bash
cd course-ai-tutor-frontend
npm run dev
```
服务地址: `http://localhost:5173`

---

## 环境变量配置

### 后端 (.env)
```env
# 阿里云百炼
DASHSCOPE_API_KEY=sk-xxx
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen3.6-plus

# STT 语音识别
STT_MODEL=paraformer-realtime-v2

# OCR 视觉识别
OCR_MODEL=qwen-vl-max-latest

# JWT
JWT_SECRET=your-secret-at-least-32-chars

# 服务器
PORT=8081
NODE_ENV=development
```

### RAG 服务 (.env)
```env
# 阿里云百炼
DASHSCOPE_API_KEY=sk-xxx

# Embedding 模型
EMBEDDING_MODEL=text-embedding-v3

# 服务端口
PORT=8083
```

---

## 使用示例

### 示例 1: 语音识别
```javascript
// 前端代码
const formData = new FormData()
formData.append('audio', audioFile)
formData.append('language', 'zh')

const response = await fetch('http://localhost:8081/api/speech/transcribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
console.log('识别结果:', result.data.text)
```

### 示例 2: OCR 识别
```javascript
// 前端代码
const formData = new FormData()
formData.append('image', imageFile)
formData.append('prompt', '请识别图片中的数学公式')

const response = await fetch('http://localhost:8081/api/ocr/recognize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
console.log('识别结果:', result.data.text)
```

### 示例 3: 知识提取
```javascript
// 前端代码
const response = await fetch('http://localhost:8081/api/knowledge-extract/extract', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    conversation: [
      { role: 'user', content: '什么是 JavaScript 的 Promise?' },
      { role: 'assistant', content: 'Promise 是 JavaScript 中处理异步操作的对象...' }
    ],
    autoAdd: true,
    confidenceThreshold: 0.8
  })
})

const result = await response.json()
console.log('提取的知识:', result.data.extracted)
```

---

## 注意事项

1. **API Key 安全**: 妥善保管 `DASHSCOPE_API_KEY`,不要提交到代码仓库
2. **文件上传限制**: 音频最大 25MB,图片最大 10MB
3. **缓存管理**: 定期清理缓存避免内存占用过大
4. **知识库质量**: 建议设置合适的置信度阈值 (0.7-0.8)
5. **并发控制**: 批量提取时注意 API 调用频率限制

---

## 技术架构

### 语音识别 (STT)
- 模型: 阿里云百炼 `paraformer-realtime-v2`
- 支持: 多语言、实时流式识别
- 特性: LRU 缓存、批量处理

### OCR 识别
- 模型: 阿里云百炼 `qwen-vl-max-latest`
- 能力: 文字识别、内容理解、格式保持
- 特性: 智能分块、类型识别

### RAG 向量检索
- Embedding: 阿里云百炼 `text-embedding-v3`
- 检索: 混合检索 (向量 70% + 关键词 30%)
- 优化: 索引、缓存、批量并行

### 知识库动态更新
- 提取: AI 自动识别和分类
- 验证: 置信度过滤
- 存储: 支持新增和更新

---

## 故障排查

### 问题 1: API 调用失败
**原因**: API Key 未配置或无效
**解决**: 检查 `.env` 文件中的 `DASHSCOPE_API_KEY`

### 问题 2: 语音识别返回空
**原因**: 音频格式不支持或文件损坏
**解决**: 确认音频格式在支持列表中,文件大小不超过 25MB

### 问题 3: OCR 识别不准确
**原因**: 图片质量差或提示词不当
**解决**: 提高图片清晰度,使用自定义 prompt 指导识别

### 问题 4: 向量检索慢
**原因**: 数据库未优化或缓存未命中
**解决**: 调用 `POST /api/optimize` 优化数据库,检查缓存配置

---

## 更新日志

### v1.1.0 (2026-04-27)
- ✅ 新增语音识别后端服务 (STT)
- ✅ 新增图片 OCR 识别功能
- ✅ 优化 RAG 向量检索 (混合检索引擎)
- ✅ 新增知识库动态更新功能
- ✅ 所有服务统一使用阿里云百炼模型
- ✅ 完善数据库迁移和索引优化
