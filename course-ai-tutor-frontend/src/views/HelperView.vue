<template>
  <div class="helper-container">
    <div class="glass-card">
      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-left">
          <div class="title-icon">
            <el-icon :size="24"><ChatDotRound /></el-icon>
          </div>
          <div>
            <h2>💬 实时答疑</h2>
            <p>7×24 小时在线，随时解答你的疑问</p>
          </div>
        </div>
        <div class="header-right">
          <el-tag type="warning" effect="dark" size="large">
            <el-icon><Clock /></el-icon>
            7×24 在线
          </el-tag>
          <el-tag v-if="currentMood" :type="moodTagType" effect="dark" size="small" class="mood-tag">
            {{ currentMood.emoji }} {{ currentMood.description }}
          </el-tag>
        </div>
      </div>

      <el-divider style="margin: 0" />

      <!-- 快捷提问 -->
      <div class="quick-section">
        <div class="section-title">
          <el-icon><Bolt /></el-icon>
          <span>快捷提问</span>
        </div>
        <div class="quick-questions">
          <el-tag
            v-for="(q, index) in quickQuestions"
            :key="index"
            effect="plain"
            size="large"
            class="quick-tag"
            @click="askQuestion(q)"
          >
            {{ q }}
          </el-tag>
        </div>
      </div>

      <el-divider style="margin: 8px 0" />

      <!-- 问答区域 -->
      <div class="qa-container">
        <!-- 问题输入 -->
        <div class="question-input">
          <el-input
            v-model="question"
            type="textarea"
            :rows="4"
            placeholder="请输入你的问题，例如：IOC 和 DI 有什么区别？或上传图片让 AI 识别"
            class="gradient-input blue"
          />

          <!-- 图片上传和预览 -->
          <div v-if="imagePreview" class="image-preview-container">
            <img :src="imagePreview" class="uploaded-image" />
            <el-button
              type="danger"
              size="small"
              circle
              @click="removeImage"
              class="remove-image-btn"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <div class="input-actions">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleImageChange"
              accept="image/*"
            >
              <el-button type="info">
                <el-icon><Picture /></el-icon>
                上传图片
              </el-button>
            </el-upload>

            <el-button
              :type="isRecording ? 'danger' : 'warning'"
              :loading="isTranscribing"
              @click="toggleRecording"
            >
              <el-icon v-if="!isRecording && !isTranscribing"><Microphone /></el-icon>
              <el-icon v-else-if="isRecording"><VideoPause /></el-icon>
              <el-icon v-else class="is-loading"><Loading /></el-icon>
              {{ isRecording ? '停止录音' : isTranscribing ? '识别中...' : '语音输入' }}
            </el-button>

            <el-button
              type="primary"
              :loading="loading"
              @click="submitQuestion"
              class="gradient-btn blue"
            >
              <el-icon v-if="!loading"><QuestionFilled /></el-icon>
              <el-icon v-else class="is-loading"><Loading /></el-icon>
              {{ loading ? '思考中...' : '提交问题' }}
            </el-button>
            <el-button @click="clearQuestion">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>

        <!-- 代码调试 -->
        <el-collapse v-model="activeNames" class="debug-collapse">
          <el-collapse-item name="debug">
            <template #title>
              <div class="collapse-title">
                <el-icon><Bug /></el-icon>
                <span>🔧 代码调试</span>
              </div>
            </template>
            <div class="debug-section">
              <el-input
                v-model="code"
                type="textarea"
                :rows="6"
                placeholder="粘贴你的代码..."
                class="gradient-input code-input"
              />
              <el-input
                v-model="errorMessage"
                placeholder="错误信息（可选）"
                class="gradient-input code-input"
                style="margin-top: 10px"
              />
              <el-button
                type="warning"
                :loading="debugLoading"
                @click="debugCode"
                class="gradient-btn orange"
                style="margin-top: 10px"
              >
                <el-icon v-if="!debugLoading"><Bug /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
                {{ debugLoading ? '调试中...' : '开始调试' }}
              </el-button>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 回答显示 -->
      <div v-if="answerResult" class="answer-section">
        <div class="answer-header">
          <h3>💡 AI 解答</h3>
          <div class="answer-actions">
            <el-button @click="copyAnswer" size="small">
              <el-icon><DocumentCopy /></el-icon>
              复制
            </el-button>
            <el-button type="success" @click="markHelpful" size="small">
              <el-icon><ThumbUp /></el-icon>
              有帮助
            </el-button>
            <el-button type="info" @click="askFollowup" size="small">
              <el-icon><ChatLineRound /></el-icon>
              追问
            </el-button>
          </div>
        </div>

        <!-- 思考过程 -->
        <div v-if="thinkingProcess && !answerResult.streaming" class="thinking-process">
          <div class="thinking-header">
            <el-icon><Cpu /></el-icon>
            <span>思考过程</span>
          </div>
          <div class="thinking-content">{{ thinkingProcess }}</div>
        </div>

        <!-- 加载动画 -->
        <div v-if="answerResult.streaming" class="loading-animation">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="loading-text">AI 正在思考...</span>
        </div>

        <div class="answer-content" v-html="renderedAnswer"></div>
      </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="history-section">
          <el-divider content-position="left">
            <el-icon><History /></el-icon>
            答疑历史
          </el-divider>
          <el-timeline class="history-timeline">
            <el-timeline-item
              v-for="(item, index) in history"
              :key="index"
              :timestamp="item.time"
              placement="top"
              size="large"
            >
              <el-card class="history-card" shadow="hover">
                <div class="history-question">
                  <el-icon><QuestionFilled /></el-icon>
                  <strong>问：</strong>{{ item.question }}
                </div>
                <div class="history-answer">
                  <el-icon><ChatDotSquare /></el-icon>
                  <strong>答：</strong>{{ item.answer.substring(0, 150) }}...
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="!answerResult && history.length === 0"
          description="输入问题，AI 将为你详细解答"
          :image-size="180"
        >
          <template #image>
            <div class="empty-illustration">
              <el-icon :size="80" color="#4facfe"><ChatDotRound /></el-icon>
            </div>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Close, Picture, Cpu, Microphone, VideoPause } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { helperApi, historyApi, speechApi, extractContent, extractMood } from '@/api'
import request from '@/api/request'

const md = new MarkdownIt()

const quickQuestions = ref([
  '什么是依赖注入？',
  'Spring Boot 自动配置原理',
  '如何理解 MVC 模式？',
  'RESTful API 设计规范',
  '数据库索引的优缺点',
  '解释一下闭包的概念和应用',
  'Vue 3 的 Composition API 有什么优势？',
  '如何优化前端性能？',
  '什么是微服务架构？',
  'Git 的 rebase 和 merge 有什么区别？'
])

const question = ref('')
const code = ref('')
const errorMessage = ref('')
const activeNames = ref([])
const loading = ref(false)
const debugLoading = ref(false)
const answerResult = ref(null)
const history = ref([])
const currentMood = ref(null)
const thinkingProcess = ref('')

// 图片相关
const uploadRef = ref(null)
const imagePreview = ref(null)
const imageBase64 = ref(null)
const imageMimeType = ref(null)

// 语音相关
const isRecording = ref(false)
const isTranscribing = ref(false)
let mediaRecorder = null
let audioChunks = []

const moodTagType = computed(() => {
  if (!currentMood.value) return 'info'
  const map = { EXCITED: 'danger', HAPPY: 'success', NEUTRAL: '', CONCERNED: 'warning', ENCOURAGING: 'warning' }
  return map[currentMood.value.type] || 'info'
})

const renderedAnswer = computed(() => {
  if (!answerResult.value) return ''
  const text = answerResult.value.answer || answerResult.value.message || answerResult.value.debugGuidance || ''
  const html = md.render(text)
  const cursor = answerResult.value.streaming ? '<span class="streaming-cursor">▊</span>' : ''
  return html + cursor
})

const askQuestion = (q) => {
  question.value = q
}

const clearQuestion = () => {
  question.value = ''
  answerResult.value = null
  removeImage()
}

// 处理图片上传
const handleImageChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
    // 提取 Base64（去掉 data:image/xxx;base64, 前缀）
    const base64String = e.target.result.split(',')[1]
    imageBase64.value = base64String
    imageMimeType.value = file.raw.type
    ElMessage.success('图片已上传，可以提问了')
  }
  reader.readAsDataURL(file.raw)
}

// 移除图片
const removeImage = () => {
  imagePreview.value = null
  imageBase64.value = null
  imageMimeType.value = null
}

// 语音录制
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    audioChunks = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      await transcribeAudio(audioBlob)
    }

    mediaRecorder.start()
    isRecording.value = true
    ElMessage.success('开始录音，请说话...')
  } catch (err) {
    console.error('录音失败:', err)
    ElMessage.error('无法访问麦克风，请检查权限')
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
}

const transcribeAudio = async (audioBlob) => {
  isTranscribing.value = true
  try {
    const res = await speechApi.transcribe(audioBlob)
    if (res?.success && res.data?.text) {
      question.value += res.data.text
      ElMessage.success('语音识别成功')
    } else {
      ElMessage.warning('未识别到内容，请重试')
    }
  } catch (err) {
    console.error('语音转文字失败:', err)
    ElMessage.error('语音识别失败，请重试')
  } finally {
    isTranscribing.value = false
  }
}

const submitQuestion = async () => {
  if (!question.value.trim() && !imageBase64.value) {
    ElMessage.warning('请输入问题或上传图片')
    return
  }

  loading.value = true
  thinkingProcess.value = ''
  answerResult.value = { answer: '', streaming: true }

  try {
    const token = localStorage.getItem('token')

    const requestBody = {
      userId: parseInt(localStorage.getItem('userId') || '1'),
      question: question.value || '请分析这张图片',
      messageType: imageBase64.value ? 'image' : 'text'
    }

    if (imageBase64.value) {
      requestBody.imageUrl = imageBase64.value
    }

    let fullContent = ''
    await helperApi.answerStream(requestBody, (chunk, done, metadata) => {
      fullContent = chunk
      answerResult.value = {
        answer: chunk,
        streaming: !done
      }
      
      if (metadata?.thought) {
        thinkingProcess.value = metadata.thought
      }
    })

    answerResult.value = {
      answer: fullContent,
      streaming: false
    }

    const topicText = question.value || '图片识别'
    const userContent = imageBase64.value
      ? (question.value ? `${question.value}（附图片）` : '图片识别')
      : question.value

    history.value.unshift({
      question: topicText,
      answer: fullContent,
      time: new Date().toLocaleString(),
      hasImage: !!imageBase64.value
    })

    try {
      await historyApi.saveConversation('helper', topicText, [
        { role: 'user', content: userContent },
        { role: 'assistant', content: fullContent }
      ])
    } catch (e) {
      console.warn('保存答疑历史失败:', e)
    }

    ElNotification({
      title: '✅ 解答完成',
      message: imageBase64.value ? 'AI 已识别图片并解答' : 'AI 已详细解答你的问题',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('答疑失败:', error)
    ElMessage.error('解答失败：' + (error.response?.data?.message || error.message))
    answerResult.value = { answer: '解答失败，请稍后重试', streaming: false }
  } finally {
    loading.value = false
  }
}

const debugCode = async () => {
  if (!code.value.trim()) {
    ElMessage.warning('请输入代码')
    return
  }

  debugLoading.value = true
  try {
    const response = await helperApi.debugCode({
      userId: parseInt(localStorage.getItem('userId') || '1'),
      content: code.value,
      errorMessage: errorMessage.value
    })

    answerResult.value = response.data || response
    ElNotification({
      title: '🔧 调试完成',
      message: 'AI 已分析代码问题',
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    console.error('调试失败:', error)
    ElMessage.error('调试失败，请稍后重试')
  } finally {
    debugLoading.value = false
  }
}

const copyAnswer = () => {
  const text = answerResult.value.answer || answerResult.value.message || answerResult.value.debugGuidance || ''
  navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

const markHelpful = () => {
  ElNotification({
    title: '👍 感谢反馈',
    message: '你的反馈将帮助我们改进',
    type: 'success',
    duration: 3000
  })
}

const askFollowup = () => {
  question.value = '我还有个问题：'
  answerResult.value = null
  ElMessage.info('请输入追问内容')
}
</script>

<style scoped>
.helper-container {
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
  padding: 16px 24px 12px;
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
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
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

/* 快捷提问 */
.quick-section {
  padding: 12px 24px;
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
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

/* 问答区域 */
.qa-container {
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-input {
  margin-bottom: 0;
}

.gradient-input.blue :deep(.el-textarea__wrapper) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(255, 250, 250, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(79, 172, 254, 0.2);
}

.gradient-input.blue :deep(.el-textarea__wrapper:hover),
.gradient-input.blue :deep(.el-textarea__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.15);
  border-color: #4facfe;
}

.code-input :deep(.el-textarea__wrapper) {
  font-family: 'Courier New', Courier, monospace;
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  align-items: center;
}

.gradient-btn.blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);
  transition: all 0.3s ease;
}

.gradient-btn.orange {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(246, 211, 101, 0.3);
  transition: all 0.3s ease;
}

.gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(79, 172, 254, 0.4);
}

/* 代码调试 */
.debug-collapse {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #2d3748;
}

.debug-section {
  padding: 16px;
  background: rgba(79, 172, 254, 0.03);
}

/* 回答区域 */
.answer-section {
  animation: fadeIn 0.5s ease;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(79, 172, 254, 0.1);
}

.answer-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.answer-actions {
  display: flex;
  gap: 8px;
}

/* 思考过程 */
.thinking-process {
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 243, 205, 0.5) 0%, rgba(255, 248, 225, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.2);
  animation: fadeIn 0.5s ease;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 8px;
}

.thinking-content {
  font-size: 13px;
  color: #78716c;
  line-height: 1.6;
  padding-left: 24px;
}

/* 加载动画 */
.loading-animation {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  animation: loadingBounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes loadingBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  color: #718096;
  font-size: 14px;
}

.answer-content {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 100%);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.1);
  line-height: 1.8;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.03);
}

.answer-content :deep(h1),
.answer-content :deep(h2),
.answer-content :deep(h3) {
  color: #2d3748;
  margin-top: 16px;
  margin-bottom: 12px;
  font-weight: 600;
}

.answer-content :deep(p) {
  margin: 10px 0;
  color: #4a5568;
}

.answer-content :deep(code) {
  background: rgba(79, 172, 254, 0.12);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #0284c7;
}

.answer-content :deep(pre) {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 历史记录 */
.history-section {
  margin-top: 10px;
}

.history-timeline {
  padding: 10px 0;
}

.history-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(79, 172, 254, 0.15);
  transition: all 0.3s ease;
}

.history-card:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.15);
}

.history-question,
.history-answer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
}

.history-question strong,
.history-answer strong {
  color: #2d3748;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

/* 图片预览 */
.image-preview-container {
  position: relative;
  margin: 12px 0;
  display: inline-block;
}

.uploaded-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.remove-image-btn:hover {
  background: #f78989;
  border-color: #f78989;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
