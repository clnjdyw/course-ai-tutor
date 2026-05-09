# Phase 3 部署指南：多模态（图片识别）功能

## 功能概述

Phase 3 实现了多模态交互支持，允许学生上传图片（如数学题截图、代码截图、错误信息截图），AI 能够识别图片内容并进行讲解。

---

## 1. 后端改动总结

### 新增文件

**`MultimodalService.java`** - 多模态 AI 服务
- 封装图片识别逻辑
- 支持 Base64 图片输入
- 自动降级到纯文本模式（如果多模态失败）

### 修改文件

**`ChatRequest.java`** - 扩展请求体
```java
private String imageBase64;      // Base64 编码的图片
private String imageUrl;          // 图片 URL（可选）
private String imageMimeType;     // 图片类型（image/png, image/jpeg）
```

**`ChatResponse.java`** - 添加时间戳
```java
private Long timestamp;
```

**`AgentController.java`** - 升级 chat 接口
- 检测请求是否包含图片
- 如果有图片，调用 `MultimodalService.chatWithImage()`
- 否则走原有的 `CompanionAgent.chat()` 流程

**`application.yml`** - 配置多模态模型
```yaml
app:
  multimodal:
    enabled: true
    model: Pro/Qwen/Qwen2-VL-72B-Instruct
    max-tokens: 2048
    temperature: 0.7
```

---

## 2. 前端改动总结

### 修改文件

**`HelperView.vue`** - 实时答疑页面
- 新增图片上传按钮（`el-upload`）
- 图片预览组件
- 将图片转为 Base64 并发送给后端
- 支持移除已上传的图片

---

## 3. 支持的多模态模型

### SiliconFlow 平台支持的视觉模型

| 模型 | 能力 | 适用场景 |
|------|------|----------|
| **Pro/Qwen/Qwen2-VL-72B-Instruct** | 通用视觉理解 | 数学题、代码截图、图表分析 |
| **OpenGVLab/InternVL2-26B** | 高精度 OCR | 文字识别、文档扫描 |
| **stepfun-ai/GOT-OCR2_0** | 专业 OCR | 手写文字、复杂排版 |

### 切换模型

修改 `application.yml` 或设置环境变量：
```bash
export MULTIMODAL_MODEL=OpenGVLab/InternVL2-26B
```

---

## 4. 使用流程

### 学生端操作

1. 访问「实时答疑」页面（`/helper`）
2. 点击「上传图片」按钮
3. 选择图片（支持 PNG、JPG、JPEG、GIF）
4. 输入问题（可选，如"这道题怎么做？"）
5. 点击「提交问题」
6. AI 识别图片并给出解答

### 示例场景

**场景 1：数学题求解**
- 上传数学题截图
- 输入："这道题怎么做？"
- AI 识别题目，给出解题步骤

**场景 2：代码调试**
- 上传代码截图
- 输入："这段代码有什么问题？"
- AI 识别代码，指出错误并给出修改建议

**场景 3：错误信息分析**
- 上传错误信息截图
- 输入："这个错误怎么解决？"
- AI 识别错误信息，给出解决方案

---

## 5. API 调用示例

### 请求格式

**纯文本请求：**
```json
POST /api/agent/chat
{
  "userId": 1,
  "message": "什么是依赖注入？"
}
```

**多模态请求（包含图片）：**
```json
POST /api/agent/chat
{
  "userId": 1,
  "message": "这道题怎么做？",
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "imageMimeType": "image/png"
}
```

### 响应格式

```json
{
  "success": true,
  "message": "这是一道二次方程求解题...",
  "timestamp": 1714089600000
}
```

---

## 6. 前端集成示例

### 图片转 Base64

```javascript
const handleImageChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64String = e.target.result.split(',')[1]
    imageBase64.value = base64String
    imageMimeType.value = file.raw.type
  }
  reader.readAsDataURL(file.raw)
}
```

### 发送请求

```javascript
const requestBody = {
  userId: 1,
  message: question.value || '请分析这张图片'
}

if (imageBase64.value) {
  requestBody.imageBase64 = imageBase64.value
  requestBody.imageMimeType = imageMimeType.value
}

const { data } = await request.post('/api/agent/chat', requestBody)
```

---

## 7. 性能优化建议

### 图片压缩

前端上传前压缩图片，减少传输体积：

```javascript
// 使用 canvas 压缩图片
function compressImage(file, maxWidth = 1024) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.8)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
```

### 缓存策略

对于相同的图片，可以缓存识别结果：

```java
@Cacheable(value = "imageRecognition", key = "#imageHash")
public String recognizeImage(String imageBase64, String imageHash) {
    // ...
}
```

---

## 8. 常见问题

### Q1: 图片上传后没有反应
**解决**：
- 检查浏览器控制台是否有错误
- 确认图片大小不超过 10MB
- 检查后端日志，查看是否有异常

### Q2: AI 识别不准确
**解决**：
- 确保图片清晰，分辨率足够
- 尝试切换到 OCR 专用模型（`GOT-OCR2_0`）
- 在问题中添加更多上下文信息

### Q3: 多模态功能不可用
**解决**：
- 检查 `application.yml` 中 `app.multimodal.enabled` 是否为 `true`
- 确认 `SILICONFLOW_API_KEY` 有效
- 检查 API 配额是否用完

### Q4: Base64 编码导致请求体过大
**解决**：
- 前端压缩图片后再上传
- 或改用方案 B（MultipartFile），将图片保存到云存储

---

## 9. 安全建议

1. **限制图片大小**：
```java
@PostMapping("/chat")
public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
    if (request.getImageBase64() != null) {
        byte[] imageBytes = Base64.getDecoder().decode(request.getImageBase64());
        if (imageBytes.length > 10 * 1024 * 1024) { // 10MB
            throw new IllegalArgumentException("图片大小不能超过 10MB");
        }
    }
    // ...
}
```

2. **验证图片格式**：
```java
if (!imageMimeType.matches("image/(png|jpeg|jpg|gif)")) {
    throw new IllegalArgumentException("不支持的图片格式");
}
```

3. **防止恶意图片**：
- 使用图片扫描服务检测恶意内容
- 限制上传频率（防止滥用）

---

## 10. 下一步扩展

Phase 3 完成后，可以进一步扩展：

1. **语音输入**：
   - 前端录音 → 转为 Base64
   - 后端调用语音识别 API（如 Whisper）
   - 将识别的文本传给 AI

2. **视频分析**：
   - 上传视频文件
   - 提取关键帧
   - 逐帧分析或生成摘要

3. **实时摄像头**：
   - 前端调用摄像头 API
   - 实时截图并识别
   - 用于实时答疑场景

---

## 总结

Phase 3 实现了完整的多模态交互闭环：
- ✅ 后端支持接收 Base64 图片
- ✅ 调用多模态 AI 模型（Qwen2-VL）
- ✅ 前端图片上传、预览、Base64 转换
- ✅ 自动降级到纯文本模式

三个 Phase 全部完成！🎉
