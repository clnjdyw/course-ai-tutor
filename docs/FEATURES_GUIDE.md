# 课程辅导 AI 系统 - 新功能说明

## 新增功能概览

本次更新实现了5个核心功能，大幅提升了系统的智能化水平和用户体验。

---

## 1. 知识点自动拆分功能

### 功能说明
使用 AI 自动从教材、文档等文本内容中提取和拆分知识点，智能识别知识点层级关系、前置依赖、难度等级等。

### 后端实现
- **服务文件**: `course-ai-tutor-backend/src/services/knowledgeExtractor.js`
- **核心功能**:
  - `extractKnowledgePoints(text, courseId, options)` - 从文本中提取知识点
  - `extractFromMultipleSources(sources, courseId, options)` - 批量提取
  - AI 自动识别知识点层级关系（最多5层）
  - 自动评估难度等级（1-5）
  - 自动识别前置依赖关系
  - 自动生成标签

### API 接口
```
POST /api/knowledge-advanced/extract
Body: {
  text: "教材内容...",
  courseId: 1,
  maxDepth: 3,
  difficulty: 1
}
```

### 使用场景
- 教师上传教材后自动拆分知识点
- 学生粘贴学习笔记自动提取知识点
- 批量处理多个文档

---

## 2. 知识点结构化梳理 - 知识图谱可视化

### 功能说明
提供知识图谱和知识树两种可视化方式，清晰展示知识点之间的层级关系、前置依赖和掌握度。

### 后端实现
- **服务文件**: `course-ai-tutor-backend/src/services/knowledgeGraph.js`
- **核心功能**:
  - `buildKnowledgeTree(courseId, userId)` - 构建知识树
  - `getKnowledgeGraph(courseId, userId)` - 获取知识图谱数据
  - `getLearningPath(courseId, userId, targetPointId)` - 生成学习路径
  - 自动计算统计信息（难度分布、掌握度分布等）

### 前端页面
- **页面文件**: `course-ai-tutor-frontend/src/views/KnowledgeGraph.vue`
- **功能特性**:
  - 树形图展示（可展开/折叠）
  - 力导向图谱展示（可拖拽）
  - 节点颜色表示掌握度
  - 点击节点查看详情
  - 实时统计面板

### API 接口
```
GET /api/knowledge-advanced/tree/:courseId?userId=1
GET /api/knowledge-advanced/graph/:courseId?userId=1
GET /api/knowledge-advanced/learning-path/:courseId/:targetPointId
```

### 可视化效果
- **树形图**: 清晰展示父子关系
- **图谱**: 展示复杂的依赖关系
- **颜色编码**: 
  - 🟢 绿色 (≥80%) - 已掌握
  - 🟡 黄色 (50-79%) - 学习中
  - 🔴 红色 (<50%) - 薄弱

---

## 3. 知识点推荐算法

### 功能说明
基于用户掌握水平、学习历史、薄弱点等多维度数据，智能推荐最适合当前学习的知识点。

### 后端实现
- **服务文件**: `course-ai-tutor-backend/src/services/knowledgeRecommendation.js`
- **推荐策略**:
  1. **自适应推荐 (adaptive)** - 综合评分推荐
     - 就绪度 (35%) - 前置知识是否掌握
     - 紧迫度 (35%) - 掌握度和错题情况
     - 难度匹配 (30%) - 难度是否适合当前水平
  
  2. **复习推荐 (review)** - 基于遗忘曲线
     - 根据掌握度计算复习间隔
     - 优先推荐需要复习的知识点
  
  3. **薄弱点推荐 (weakness)** - 针对薄弱环节
     - 优先推荐掌握度低的知识点
  
  4. **顺序学习 (sequential)** - 按层级顺序
     - 从根节点开始逐层学习

### 前端页面
- **页面文件**: `course-ai-tutor-frontend/src/views/KnowledgeRecommendation.vue`
- **功能特性**:
  - 4种推荐策略切换
  - 推荐度百分比显示
  - 学习建议面板
  - 推荐学习顺序生成
  - 实时统计

### API 接口
```
POST /api/knowledge-advanced/recommend/:courseId
Body: {
  limit: 10,
  strategy: "adaptive"
}

GET /api/knowledge-advanced/learning-order/:courseId
```

### 推荐评分算法
```javascript
finalScore = (
  readinessScore * 0.35 +    // 前置知识就绪度
  urgencyScore * 0.35 +      // 学习紧迫度
  difficultyScore * 0.30     // 难度匹配度
)
```

---

## 4. 知识点掌握度评估算法

### 功能说明
基于多种因素综合评估用户对知识点的掌握程度，包括答题正确率、错题情况、学习时长、记忆保持率等。

### 后端实现
- **服务文件**: `course-ai-tutor-backend/src/services/masteryEvaluator.js`
- **评估维度**:
  1. **答题正确率 (40%)**
     - 加权计算（最近的题目权重更高）
     - 完成度加分
  
  2. **错题情况 (25%)**
     - 错题数量惩罚
     - 复习情况加分
  
  3. **学习时长 (15%)**
     - 2分钟以下: 10%
     - 5分钟: 40%
     - 15分钟: 60%
     - 30分钟: 80%
     - 60分钟以上: 100%
  
  4. **记忆保持率 (20%)**
     - 对比近期和早期的正确率
     - 评估知识遗忘情况

### 掌握度等级
- **精通** (≥90%) - 完全掌握
- **掌握** (80-89%) - 熟练掌握
- **熟练** (60-79%) - 基本掌握
- **了解** (40-59%) - 初步了解
- **初学** (20-39%) - 刚开始学习
- **未学习** (<20%) - 尚未接触

### API 接口
```
POST /api/knowledge-advanced/evaluate/:knowledgePointId
POST /api/knowledge-advanced/evaluate/batch/:courseId
```

### 返回数据
```json
{
  "mastery_level": "0.750",
  "details": {
    "exerciseScore": "0.800",
    "wrongQuestionScore": "0.700",
    "timeScore": "0.600",
    "retentionScore": "0.850"
  },
  "statistics": {
    "totalExercises": 15,
    "correctExercises": 12,
    "wrongQuestions": 3,
    "totalStudyTime": 1800
  },
  "level": "熟练",
  "suggestions": ["继续练习提高熟练度", "尝试进阶题目挑战自己"]
}
```

---

## 5. 知识导入功能

### 功能说明
支持从多种文件格式批量导入知识点，包括 Word、PDF、Markdown、TXT、CSV 等。

### 后端实现
- **服务文件**: `course-ai-tutor-backend/src/services/knowledgeImporter.js`
- **支持格式**:
  1. **Markdown (.md, .markdown)**
     - 按标题层级自动分章节
     - 每个章节独立提取知识点
  
  2. **TXT (.txt, .text)**
     - 自动分块（默认3000字/块）
     - 每块调用 AI 提取知识点
  
  3. **CSV (.csv)**
     - 支持标准 CSV 格式
     - 字段映射：title, description, content, difficulty, tags
  
  4. **PDF (.pdf)**
     - 使用 pdf-parse 库提取文本
     - 降级方案：基础文本提取
  
  5. **Word (.docx)**
     - 使用 mammoth 库提取文本
     - 保留基本格式

### 前端页面
- **页面文件**: `course-ai-tutor-frontend/src/views/KnowledgeImport.vue`
- **功能特性**:
  - 文件拖拽上传
  - 文本粘贴导入
  - AI 智能提取
  - 导入进度显示
  - 导入结果展示

### API 接口
```
POST /api/knowledge-advanced/import/:courseId
Content-Type: multipart/form-data
Body: {
  file: <文件>,
  maxDepth: 3,
  difficulty: 1
}

POST /api/knowledge-advanced/import-text/:courseId
Body: {
  text: "文本内容...",
  maxDepth: 3,
  difficulty: 1
}
```

### 导入流程
1. 上传文件或粘贴文本
2. 选择课程和参数
3. 系统自动解析内容
4. AI 提取知识点（如启用）
5. 批量创建知识点记录
6. 返回导入结果

---

## 路由配置

### 新增路由
```javascript
{
  path: 'knowledge-graph',
  name: 'KnowledgeGraph',
  component: () => import('@/views/KnowledgeGraph.vue'),
  meta: { title: '知识图谱', requiresAuth: true }
},
{
  path: 'knowledge-import',
  name: 'KnowledgeImport',
  component: () => import('@/views/KnowledgeImport.vue'),
  meta: { title: '知识导入', requiresAuth: true }
},
{
  path: 'knowledge-recommendation',
  name: 'KnowledgeRecommendation',
  component: () => import('@/views/KnowledgeRecommendation.vue'),
  meta: { title: '智能推荐', requiresAuth: true }
}
```

---

## 依赖安装

### 后端依赖（可选）
```bash
cd course-ai-tutor-backend
npm install pdf-parse mammoth
```

- `pdf-parse` - PDF 文件解析
- `mammoth` - Word 文档解析

---

## 使用示例

### 1. AI 提取知识点
```javascript
// 前端调用
const response = await knowledgeGraphApi.extractKnowledgePoints({
  text: "第一章：函数与极限...\n1.1 函数的概念...\n1.2 极限的定义...",
  courseId: 1,
  maxDepth: 3,
  difficulty: 2
})
```

### 2. 获取知识图谱
```javascript
// 获取树形数据
const tree = await knowledgeGraphApi.getKnowledgeTree(1, userId)

// 获取图谱数据
const graph = await knowledgeGraphApi.getKnowledgeGraph(1, userId)
```

### 3. 获取推荐
```javascript
// 自适应推荐
const recommendation = await knowledgeGraphApi.recommendKnowledgePoints(1, {
  limit: 10,
  strategy: 'adaptive'
})
```

### 4. 评估掌握度
```javascript
// 单个知识点
const evaluation = await knowledgeGraphApi.evaluateMastery(knowledgePointId)

// 整个课程
const courseEval = await knowledgeGraphApi.evaluateCourseMastery(courseId)
```

### 5. 导入文件
```javascript
// 文件导入
const formData = new FormData()
formData.append('file', file)
const result = await knowledgeGraphApi.importFile(courseId, formData)

// 文本导入
const result = await knowledgeGraphApi.importText(courseId, {
  text: content,
  maxDepth: 3
})
```

---

## 技术亮点

1. **AI 驱动** - 使用大语言模型智能提取和分析知识点
2. **多维度评估** - 综合4个维度准确评估掌握度
3. **智能推荐** - 4种策略适应不同学习场景
4. **可视化** - ECharts 实现丰富的图表展示
5. **批量处理** - 支持多种文件格式批量导入
6. **自适应学习** - 根据用户水平动态调整推荐

---

## 后续优化建议

1. 添加更多的推荐策略（协同过滤、基于内容等）
2. 实现知识点版本控制
3. 添加知识点审核机制
4. 支持更多文件格式（PPT、Excel等）
5. 添加知识点导入模板下载
6. 实现知识点质量评分
7. 添加学习路径自动规划
8. 实现知识点关联推荐
