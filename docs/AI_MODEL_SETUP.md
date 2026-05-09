# 阿里云百炼 qwen3.6-plus 模型配置说明

## 快速开始

### 1. 配置 API Key

在项目根目录的 `.env` 文件中配置你的阿里云百炼 API Key：

```env
# 阿里云百炼 DashScope API 配置
DASHSCOPE_API_KEY=your-dashscope-api-key-here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# AI 模型配置
AI_MODEL=qwen3.6-plus
```

### 2. 获取 API Key

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 登录你的阿里云账号
3. 进入「API-KEY管理」页面
4. 创建或复制你的 API Key
5. 将 API Key 填入 `.env` 文件

### 3. 启动服务

```bash
# 后端
cd course-ai-tutor-backend
npm start

# 前端
cd course-ai-tutor-frontend
npm run dev
```

## 模型配置

### 默认模型

项目默认使用以下模型：

| 用途 | 模型 | 说明 |
|------|------|------|
| 主对话模型 | `qwen3.6-plus` | 通义千问最新版，支持知识点提取、智能推荐等 |
| OCR 视觉模型 | `qwen-vl-max-latest` | 用于图片识别和 OCR |

### 切换模型

如需使用其他模型，修改 `.env` 文件：

```env
# 其他可用模型
AI_MODEL=qwen-max
AI_MODEL=qwen-plus
AI_MODEL=qwen-turbo
```

## 新增功能使用的模型

### 1. 知识点自动提取

**使用场景**: 从教材、文档中自动提取知识点

**模型调用**:
```javascript
// services/knowledgeExtractor.js
const response = await chat([
  { role: 'user', content: prompt }
], {
  maxTokens: 8000,
  temperature: 0.3  // 低温保证输出稳定性
})
```

**特点**:
- 使用低温 (0.3) 保证 JSON 输出稳定性
- 最大 8000 tokens 支持长文档分析
- 自动识别知识点层级关系

### 2. 知识图谱构建

**使用场景**: 构建知识点之间的关联图谱

**数据处理**: 纯算法处理，无需调用 AI 模型

### 3. 智能推荐算法

**使用场景**: 基于用户水平推荐知识点

**算法**: 多维度评分算法（无需 AI 模型）
- 就绪度评分 (35%)
- 紧迫度评分 (35%)
- 难度匹配评分 (30%)

### 4. 掌握度评估

**使用场景**: 自动评估用户对知识点的掌握程度

**算法**: 多因子评估算法（无需 AI 模型）
- 答题正确率 (40%)
- 错题情况 (25%)
- 学习时长 (15%)
- 记忆保持率 (20%)

### 5. 文件导入

**使用场景**: 从 Word/PDF/Markdown 等文件导入知识点

**模型调用**: 与知识点自动提取相同

## 费用说明

### qwen3.6-plus 定价

根据阿里云百炼官方定价：

| 模型 | 输入价格 | 输出价格 |
|------|---------|---------|
| qwen3.6-plus | ¥0.02/千 tokens | ¥0.06/千 tokens |

### 预估费用

以典型使用场景为例：

1. **知识点提取**: 
   - 每次提取约 2000-5000 tokens
   - 费用约 ¥0.04-0.30/次

2. **日常对话**:
   - 每次对话约 1000-3000 tokens
   - 费用约 ¥0.02-0.18/次

**建议**: 开通阿里云百炼的免费额度，新用户通常有一定的免费 tokens。

## 故障排查

### 常见错误

#### 1. DASHSCOPE_API_KEY 未配置

**错误信息**: `DASHSCOPE_API_KEY 未配置`

**解决方法**: 
- 检查 `.env` 文件是否存在
- 确认 `DASHSCOPE_API_KEY` 已正确填写
- 重启后端服务

#### 2. API Key 无效

**错误信息**: `Invalid API Key` 或 `401 Unauthorized`

**解决方法**:
- 确认 API Key 正确
- 检查 API Key 是否已过期
- 在阿里云百炼平台重新生成 API Key

#### 3. 模型不存在

**错误信息**: `Model not found` 或 `404`

**解决方法**:
- 确认模型名称正确：`qwen3.6-plus`
- 检查该模型在你账号中是否可用
- 尝试使用其他模型：`qwen-max`、`qwen-plus`

#### 4. 超出配额

**错误信息**: `Quota exceeded` 或 `429 Too Many Requests`

**解决方法**:
- 检查账户余额
- 等待配额重置
- 联系阿里云客服提升配额

## 性能优化

### 1. 批量处理

对于大量文档的知识点提取，建议：

```javascript
// 使用批量处理
const results = await extractFromMultipleSources(sources, courseId, {
  maxDepth: 3
})
```

### 2. 缓存策略

知识点提取结果会保存到数据库，避免重复调用 AI。

### 3. 温度设置

不同场景使用不同的 temperature：

| 场景 | Temperature | 原因 |
|------|-------------|------|
| 知识点提取 | 0.3 | 保证输出稳定性和 JSON 格式 |
| 日常对话 | 0.7 | 平衡创意性和准确性 |
| 内容创作 | 0.9 | 更具创意性 |

## API 文档

### 阿里云百炼 API

- **官方文档**: https://help.aliyun.com/zh/model-studio/
- **API 参考**: https://help.aliyun.com/zh/model-studio/developer-reference/api-reference
- **定价说明**: https://www.aliyun.com/price/product#/bailian/detail

### DashScope 兼容模式

项目使用 Anthropic SDK 的兼容模式调用 DashScope API：

```javascript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})
```

## 技术支持

如遇到问题：

1. 查看后端日志：`course-ai-tutor-backend` 控制台输出
2. 检查 `.env` 配置是否正确
3. 访问阿里云百炼官方文档
4. 提交 Issue 到项目仓库
