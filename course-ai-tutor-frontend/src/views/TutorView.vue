<template>
  <div class="tutor-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon :size="24"><VideoCamera /></el-icon>
            </div>
            <div>
              <h2>👨‍🏫 智能教学智能体</h2>
              <p>一对一专属 AI 教师，耐心讲解每个知识点</p>
            </div>
          </div>
          <el-tag type="primary" effect="dark" size="large">
            <el-icon><User /></el-icon>
            一对一授课
          </el-tag>
        </div>
      </template>
      
      <!-- 聊天界面 -->
      <div class="chat-container">
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <transition-group name="message-fade">
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.type]"
            >
              <div class="message-avatar">
                <div class="avatar-icon" :class="message.type">
                  <el-icon v-if="message.type === 'ai'"><Reading /></el-icon>
                  <el-icon v-else><User /></el-icon>
                </div>
              </div>
              <div class="message-content">
                <div class="message-bubble" :class="message.type">
                  <div class="message-text" v-html="renderMessage(message.content)"></div>
                </div>
                <div class="message-time">
                  <el-icon><Clock /></el-icon>
                  {{ message.time }}
                </div>
              </div>
            </div>
          </transition-group>
          
          <!-- 加载状态 -->
          <div v-if="loading" class="message ai">
            <div class="message-avatar">
              <div class="avatar-icon ai">
                <el-icon><Reading /></el-icon>
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
        
        <!-- 输入区域 -->
        <div class="input-area">
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
              <el-button 
                type="primary" 
                :loading="loading" 
                @click="sendMessage"
                class="send-btn"
                :disabled="!inputMessage.trim()"
              >
                <el-icon v-if="!loading"><Promotion /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
                {{ loading ? '发送中...' : '发送' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { tutorApi } from '@/api'

const md = new MarkdownIt()

const messages = ref([
  {
    type: 'ai',
    content: '👋 你好！我是你的 **AI 教学助手**。我会为你详细讲解任何知识点，请问你想学习什么？',
    time: getCurrentTime()
  }
])

const inputMessage = ref('')
const currentLevel = ref('BEGINNER')
const loading = ref(false)
const messageListRef = ref(null)

const renderMessage = (content) => {
  return md.render(content)
}

const getCurrentTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  
  messages.value.push({
    type: 'user',
    content: inputMessage.value,
    time: getCurrentTime()
  })
  
  const topic = inputMessage.value
  inputMessage.value = ''
  await scrollToBottom()
  
  loading.value = true
  try {
    const response = await tutorApi.teach({
      userId: 1,
      topic: topic,
      level: currentLevel.value
    })
    
    messages.value.push({
      type: 'ai',
      content: response.content,
      time: getCurrentTime()
    })
    
    ElMessage.success('讲解完成！')
  } catch (error) {
    console.error('教学失败:', error)
    messages.value.push({
      type: 'ai',
      content: '抱歉，讲解失败，请稍后重试。',
      time: getCurrentTime()
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.tutor-container {
  max-width: 1000px;
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
  height: 700px;
  display: flex;
  flex-direction: column;
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

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
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

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 3px;
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
  position: relative;
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

/* 加载指示器 */
.loading-indicator {
  display: flex;
  gap: 4px;
}

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

/* 输入区域 */
.input-area {
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

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>
