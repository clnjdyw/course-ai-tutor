<template>
  <div class="tutor-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <span class="icon-emoji">👨‍🏫</span>
            </div>
            <div>
              <h2>👨‍🏫 智能教学</h2>
              <p>一对一专属 AI 教师，耐心讲解每个知识点</p>
            </div>
          </div>
          <div class="header-right">
            <el-tag type="primary" effect="dark" size="large">
              <span class="badge-emoji">🎓</span>
              一对一授课
            </el-tag>
            <el-tag v-if="currentMood" :type="moodTagType" effect="dark" size="small" class="mood-tag">
              {{ currentMood.emoji }} {{ currentMood.description }}
            </el-tag>
            <el-button size="small" type="danger" text @click="clearChat" :disabled="messages.length <= 1">
              🗑️ 清空对话
            </el-button>
          </div>
        </div>
      </template>

      <!-- 聊天界面 -->
      <div class="chat-content">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <!-- 空状态 -->
          <el-empty
            v-if="messages.length === 0"
            description="输入你想学习的知识点，AI 将为你详细讲解"
            :image-size="180"
          >
            <template #image>
              <div class="empty-illustration">
                <span class="empty-emoji">📚</span>
              </div>
            </template>
          </el-empty>

          <transition-group name="message-fade">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.type]"
            >
              <div class="message-avatar">
                <div class="avatar-icon" :class="message.type">
                  <span v-if="message.type === 'ai'">🤖</span>
                  <span v-else>👤</span>
                </div>
              </div>
              <div class="message-content">
                <div class="message-bubble" :class="message.type">
                  <img v-if="message.image" :src="message.image" alt="uploaded image" class="message-image" />
                  <div class="message-text" v-html="renderMessage(message.content, message.streaming)"></div>
                </div>
                <div class="message-time">
                  🕐 {{ message.time }}
                </div>
              </div>
            </div>
          </transition-group>

          <!-- 加载状态 -->
          <div v-if="loading" class="message ai">
            <div class="message-avatar">
              <div class="avatar-icon ai">
                <span>🤖</span>
              </div>
            </div>
            <div class="message-content">
              <div class="message-bubble ai loading">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="loading-text">AI 正在思考...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷提问 -->
        <div class="quick-section" v-if="!loading">
          <div class="section-title">
            <span>⚡</span>
            <span>快捷提问</span>
          </div>
          <div class="quick-questions">
            <el-tag
              v-for="(q, index) in quickTopics"
              :key="index"
              effect="plain"
              size="large"
              class="quick-tag"
              @click="askTopic(q)"
            >
              {{ q }}
            </el-tag>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="请输入你想学习的知识点，例如：什么是依赖注入？"
              class="gradient-input"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="input-toolbar">
              <div class="level-selector">
                <span class="label">📊 难度：</span>
                <el-select v-model="currentLevel" placeholder="选择水平" size="small">
                  <el-option label="🌱 零基础" value="BEGINNER" />
                  <el-option label="🌿 入门" value="ELEMENTARY" />
                  <el-option label="🌳 中级" value="INTERMEDIATE" />
                  <el-option label="🌲 高级" value="ADVANCED" />
                </el-select>
              </div>
              <div class="toolbar-right">
                <input type="file" ref="fileInputRef" accept="image/*" style="display:none" @change="handleImageUpload" />
                <el-button text size="small" @click="$refs.fileInputRef.click()" :disabled="loading">
                  🖼️ 图片
                </el-button>
                <el-tag v-if="uploadedImage" size="small" closable @close="uploadedImage = null">
                  已选择图片
                </el-tag>
                <el-button
                  type="primary"
                  :loading="loading"
                  @click="sendMessage"
                  class="send-btn"
                  :disabled="!inputMessage.trim()"
                >
                  {{ loading ? '发送中...' : '发送' }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { tutorApi, uploadApi, extractContent, extractMood } from '@/api'

const md = new MarkdownIt()

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const quickTopics = ref([
  '什么是依赖注入？',
  'Spring Boot 自动配置原理',
  '如何理解 MVC 模式？',
  'RESTful API 设计规范',
  '数据库索引的优缺点'
])

const messages = ref([])
const inputMessage = ref('')
const currentLevel = ref('BEGINNER')
const loading = ref(false)
const messageListRef = ref(null)
const currentMood = ref(null)
const fileInputRef = ref(null)
const uploadedImage = ref(null)

const moodTagType = computed(() => {
  if (!currentMood.value) return 'info'
  const map = { EXCITED: 'danger', HAPPY: 'success', NEUTRAL: '', CONCERNED: 'warning', ENCOURAGING: 'warning' }
  return map[currentMood.value.type] || 'info'
})

const renderMessage = (content, streaming = false) => {
  return md.render(content) + (streaming ? '<span class="streaming-cursor">▊</span>' : '')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const askTopic = (topic) => {
  inputMessage.value = topic
}

// 处理图片上传
const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await uploadApi.uploadImage(file)
    if (result.success && result.data) {
      uploadedImage.value = result.data.url
      ElMessage.success('图片上传成功')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
  // 重置 input
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// 加载历史对话
const loadHistory = async () => {
  try {
    const res = await tutorApi.loadMessages()
    if (res.success && res.data && res.data.messages && res.data.messages.length > 0) {
      messages.value = res.data.messages.reverse()
      await scrollToBottom()
    }
  } catch (error) {
    console.error('加载对话历史失败:', error)
  }
  // 添加欢迎消息（仅无历史时）
  if (messages.value.length === 0) {
    messages.value.push({
      type: 'ai',
      content: '👋 你好！我是你的 **AI 教学助手**。我会为你详细讲解任何知识点，请问你想学习什么？\n\n你也可以点击下方快捷问题开始学习！',
      time: getCurrentTime()
    })
  }
}

// 保存消息到后端
const saveMessage = async (type, content) => {
  try {
    await tutorApi.saveMessage(type === 'user' ? 'user' : 'assistant', content)
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

// 清空对话
const clearChat = async () => {
  try {
    await tutorApi.clearMessages()
    messages.value = [{
      type: 'ai',
      content: '👋 你好！我是你的 **AI 教学助手**。我会为你详细讲解任何知识点，请问你想学习什么？\n\n你也可以点击下方快捷问题开始学习！',
      time: getCurrentTime()
    }]
    ElMessage.success('对话已清空')
  } catch (error) {
    console.error('清空对话失败:', error)
    ElMessage.error('清空失败')
  }
}

// 发送消息（非流式）
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  const userContent = inputMessage.value
  const userImage = uploadedImage.value
  messages.value.push({
    type: 'user',
    content: userContent,
    image: userImage,
    time: getCurrentTime()
  })
  await saveMessage('user', userContent)

  inputMessage.value = ''
  uploadedImage.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  await scrollToBottom()

  loading.value = true

  // 添加 AI 占位消息
  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    time: getCurrentTime(),
    streaming: true
  })

  try {
    const token = localStorage.getItem('token')
    let aiContent = ''
    let apiResult = null

    if (token && !token.startsWith('mock-token-')) {
      // 真实 API 模式：调用后端 agent 接口
      apiResult = await tutorApi.teach({
        topic: userContent,
        level: currentLevel.value
      })
      // 响应结构: { success, data: { success, intent, result, ... } }
      const data = apiResult.data || apiResult
      aiContent = data.result || data.content || extractContent(data)
    }

    if (!aiContent) {
      // 降级：模拟回复
      aiContent = `好的，让我来为你讲解这个知识点！

## 📚 ${userContent}

这是一个非常重要的概念，让我用简单的方式为你解释：

### 核心要点

1. **理解概念**：先从基础定义开始
2. **结合实际**：通过代码示例加深理解
3. **常见误区**：注意容易混淆的地方

### 代码示例

\`\`\`javascript
// 示例代码
function example() {
  console.log("Hello, World!");
}
\`\`\`

希望这个讲解对你有帮助！如果需要更深入的解释，请随时提问。`
    }

    // 模拟打字效果显示
    let currentContent = ''
    const chunkSize = Math.min(15, aiContent.length)
    for (let i = 0; i < aiContent.length; i += chunkSize) {
      currentContent += aiContent.slice(i, i + chunkSize)
      messages.value[aiMessageIndex].content = currentContent
      await scrollToBottom()
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    messages.value[aiMessageIndex].streaming = false

    // 保存 AI 回复
    await saveMessage('ai', aiContent)

    // 提取情绪
    if (apiResult?.data?.mood) {
      currentMood.value = extractMood(apiResult.data)
    }
  } catch (error) {
    console.error('教学失败:', error)
    messages.value[aiMessageIndex].content = '抱歉，讲解失败，请稍后重试。'
    messages.value[aiMessageIndex].streaming = false
  }

  loading.value = false
  await scrollToBottom()
}

onMounted(() => {
  loadHistory()
})

onBeforeUnmount(() => {
  // 组件卸载前确保数据已保存（saveMessage 是实时保存的，无需额外操作）
})
</script>

<style scoped>
.tutor-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

/* 玻璃态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.glass-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2d3748;
}

.card-header p {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

/* 情绪标签 */
.mood-tag {
  margin-left: 8px;
  animation: moodPulse 2s ease-in-out infinite;
}

@keyframes moodPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 聊天内容区 */
.chat-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 消息列表 */
.message-list {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 12px;
  margin-bottom: 16px;
  margin-top: 8px;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 3px;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 消息样式 */
.message {
  display: flex;
  margin-bottom: 20px;
  animation: messageSlide 0.3s ease;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 头像 */
.message-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-icon.ai {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.avatar-icon.user {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* 消息内容 */
.message-content {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  line-height: 1.6;
}

.message-bubble.ai {
  background: white;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(240, 147, 251, 0.2);
}

.message-bubble.user {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bubble.user :deep(*) {
  color: white;
}

.message-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: block;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3) {
  margin-top: 12px;
  margin-bottom: 8px;
  font-size: 16px;
  color: #2d3748;
}

.message-text :deep(p) {
  margin: 8px 0;
  color: #4a5568;
}

.message-text :deep(code) {
  background: rgba(240, 147, 251, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #d53f8c;
}

.message-text :deep(pre) {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-text :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* 消息时间 */
.message-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #a0aec0;
  margin-top: 6px;
}

/* 快捷提问 */
.quick-section {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 20px;
}

.quick-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
}

/* 输入区域 */
.input-section {
  padding: 0 4px;
}

.input-wrapper {
  background: white;
  border-radius: 16px;
  border: 2px solid rgba(240, 147, 251, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #f093fb;
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.2);
}

.gradient-input :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  padding: 16px;
  font-size: 14px;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(240, 147, 251, 0.05);
  border-top: 1px solid rgba(240, 147, 251, 0.1);
}

.level-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-selector .label {
  font-size: 13px;
  color: #718096;
  font-weight: 500;
}

.send-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
}

/* 加载指示器 */
.typing-indicator {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-right: 8px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
.typing-indicator span:nth-child(3) { animation-delay: 0s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.message-bubble.loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text {
  color: #718096;
  font-size: 14px;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 流式输出光标动画 */
.streaming-cursor {
  display: inline-block;
  color: #f093fb;
  animation: cursorBlink 0.8s infinite ease-in-out;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
